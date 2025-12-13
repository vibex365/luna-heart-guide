import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Heart, Star, Gift, Cake, PartyPopper, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays, differenceInYears, addYears, isBefore, isToday } from "date-fns";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  milestone_date: string;
  category: string;
  icon?: string;
  is_recurring: boolean;
}

const categories = [
  { value: "anniversary", label: "Anniversary", icon: "💍", color: "from-pink-500 to-rose-500" },
  { value: "first_date", label: "First Date", icon: "💕", color: "from-red-500 to-pink-500" },
  { value: "first_kiss", label: "First Kiss", icon: "💋", color: "from-rose-500 to-red-500" },
  { value: "first_trip", label: "First Trip", icon: "✈️", color: "from-blue-500 to-cyan-500" },
  { value: "moved_in", label: "Moved In Together", icon: "🏠", color: "from-green-500 to-emerald-500" },
  { value: "engagement", label: "Engagement", icon: "💎", color: "from-purple-500 to-violet-500" },
  { value: "wedding", label: "Wedding", icon: "👰", color: "from-amber-500 to-yellow-500" },
  { value: "birthday_partner", label: "Partner's Birthday", icon: "🎂", color: "from-orange-500 to-amber-500" },
  { value: "custom", label: "Custom", icon: "⭐", color: "from-indigo-500 to-purple-500" },
];

const getCategoryInfo = (category: string) => {
  return categories.find((c) => c.value === category) || categories[categories.length - 1];
};

const getNextOccurrence = (dateStr: string, isRecurring: boolean) => {
  const date = new Date(dateStr);
  const today = new Date();
  
  if (!isRecurring) return date;
  
  // For recurring events, find the next occurrence
  let nextDate = new Date(date);
  nextDate.setFullYear(today.getFullYear());
  
  if (isBefore(nextDate, today) && !isToday(nextDate)) {
    nextDate = addYears(nextDate, 1);
  }
  
  return nextDate;
};

const getDaysUntil = (dateStr: string, isRecurring: boolean) => {
  const nextDate = getNextOccurrence(dateStr, isRecurring);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(nextDate, today);
};

const getYearsSince = (dateStr: string) => {
  const date = new Date(dateStr);
  return differenceInYears(new Date(), date);
};

interface MilestoneTrackerProps {
  partnerLinkId?: string;
}

export const MilestoneTracker = ({ partnerLinkId }: MilestoneTrackerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    milestone_date: "",
    category: "anniversary",
    is_recurring: true,
  });

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["milestones", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];
      const { data, error } = await supabase
        .from("relationship_milestones")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("milestone_date", { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!partnerLinkId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!partnerLinkId || !user) throw new Error("Missing data");
      const categoryInfo = getCategoryInfo(newMilestone.category);
      const { error } = await supabase.from("relationship_milestones").insert({
        partner_link_id: partnerLinkId,
        title: newMilestone.title,
        description: newMilestone.description || null,
        milestone_date: newMilestone.milestone_date,
        category: newMilestone.category,
        icon: categoryInfo.icon,
        is_recurring: newMilestone.is_recurring,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setIsOpen(false);
      setNewMilestone({ title: "", description: "", milestone_date: "", category: "anniversary", is_recurring: true });
      toast.success("Milestone added!");
    },
    onError: () => toast.error("Failed to add milestone"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("relationship_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone removed");
    },
    onError: () => toast.error("Failed to remove milestone"),
  });

  // Sort milestones by upcoming dates
  const sortedMilestones = [...(milestones || [])].sort((a, b) => {
    const daysA = getDaysUntil(a.milestone_date, a.is_recurring);
    const daysB = getDaysUntil(b.milestone_date, b.is_recurring);
    return daysA - daysB;
  });

  const upcomingMilestones = sortedMilestones.filter((m) => getDaysUntil(m.milestone_date, m.is_recurring) >= 0);
  const todayMilestones = sortedMilestones.filter((m) => getDaysUntil(m.milestone_date, m.is_recurring) === 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            Milestones
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8" disabled={!partnerLinkId}>
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newMilestone.category}
                    onValueChange={(v) => {
                      const cat = getCategoryInfo(v);
                      setNewMilestone({ 
                        ...newMilestone, 
                        category: v,
                        title: v === "custom" ? "" : cat.label
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="E.g., Our Anniversary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newMilestone.milestone_date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, milestone_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="A special note..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newMilestone.is_recurring}
                    onChange={(e) => setNewMilestone({ ...newMilestone, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="recurring" className="text-sm">Celebrate every year</Label>
                </div>

                <Button
                  onClick={() => addMutation.mutate()}
                  disabled={!newMilestone.title || !newMilestone.milestone_date || addMutation.isPending}
                  className="w-full"
                >
                  Add Milestone
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Celebrations */}
        <AnimatePresence>
          {todayMilestones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center"
            >
              <PartyPopper className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold text-lg">Today is special!</p>
              {todayMilestones.map((m) => (
                <p key={m.id} className="text-sm opacity-90">
                  {m.icon} {m.title} - {getYearsSince(m.milestone_date)} years!
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming Milestones */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingMilestones.length > 0 ? (
          <div className="space-y-2">
            {upcomingMilestones.slice(0, 5).map((milestone, index) => {
              const daysUntil = getDaysUntil(milestone.milestone_date, milestone.is_recurring);
              const years = getYearsSince(milestone.milestone_date);
              const categoryInfo = getCategoryInfo(milestone.category);
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center text-lg`}>
                      {milestone.icon || categoryInfo.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(milestone.milestone_date), "MMM d")}
                        {milestone.is_recurring && years > 0 && ` • ${years + 1} years`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysUntil === 0 ? (
                      <span className="text-xs font-bold text-pink-500 bg-pink-500/10 px-2 py-1 rounded-full">
                        Today! 🎉
                      </span>
                    ) : daysUntil <= 7 ? (
                      <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                        {daysUntil}d
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {daysUntil}d
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMutation.mutate(milestone.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Gift className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No milestones yet</p>
            <p className="text-xs text-muted-foreground">Add your first special date!</p>
          </div>
        )}

        {!partnerLinkId && (
          <p className="text-xs text-center text-muted-foreground">
            Link with a partner to track milestones together!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
