import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Check, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { notifyPartner } from "@/utils/smsNotifications";

interface CoupleGoal {
  id: string;
  partner_link_id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  status: string;
  progress: number;
  created_by: string;
  completed_at: string | null;
  created_at: string;
}

const categories = [
  { value: "communication", label: "Communication", emoji: "💬" },
  { value: "quality_time", label: "Quality Time", emoji: "⏰" },
  { value: "intimacy", label: "Intimacy", emoji: "💕" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "health", label: "Health", emoji: "🏃" },
  { value: "adventure", label: "Adventure", emoji: "🌍" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { value: "general", label: "General", emoji: "🎯" },
];

const getCategoryInfo = (category: string) => {
  return categories.find(c => c.value === category) || categories[categories.length - 1];
};

export const CoupleGoals = () => {
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "general",
    target_date: "",
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["couple-goals", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const { data, error } = await supabase
        .from("couple_goals")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CoupleGoal[];
    },
    enabled: !!partnerLink,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: typeof newGoal) => {
      if (!user || !partnerLink) throw new Error("Not connected");

      const { data, error } = await supabase
        .from("couple_goals")
        .insert({
          partner_link_id: partnerLink.id,
          title: goal.title,
          description: goal.description || null,
          category: goal.category,
          target_date: goal.target_date || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-goals"] });
      setIsAdding(false);
      setNewGoal({ title: "", description: "", category: "general", target_date: "" });
      toast({ title: "Goal created!", description: "Work together to achieve it!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
    },
  });

  const partnerId = partnerLink?.user_id === user?.id 
    ? partnerLink?.partner_id 
    : partnerLink?.user_id;

  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, progress, goalTitle }: { goalId: string; progress: number; goalTitle: string }) => {
      const updates: Record<string, unknown> = { progress };
      
      if (progress === 100) {
        updates.status = "completed";
        updates.completed_at = new Date().toISOString();
      } else {
        updates.status = "active";
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from("couple_goals")
        .update(updates)
        .eq("id", goalId);

      if (error) throw error;
      return { progress, goalTitle };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["couple-goals"] });
      if (result.progress === 100) {
        toast({ title: "🎉 Goal completed!", description: "Congratulations to you both!" });
        // Notify partner via SMS
        if (partnerId) {
          notifyPartner.goalCompleted(partnerId, result.goalTitle);
        }
      }
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("couple_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-goals"] });
      toast({ title: "Goal deleted" });
    },
  });

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Relationship Goals
            </CardTitle>
            <CardDescription>Set and track goals together</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            variant={isAdding ? "outline" : "default"}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isAdding ? "Cancel" : "Add Goal"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Goal Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-4 bg-muted/50 rounded-lg"
            >
              <Input
                placeholder="Goal title..."
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                maxLength={100}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={2}
                maxLength={500}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createGoalMutation.mutate(newGoal)}
                disabled={!newGoal.title.trim() || createGoalMutation.isPending}
              >
                Create Goal
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Goals */}
        {activeGoals.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No goals yet. Create one together!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const categoryInfo = getCategoryInfo(goal.category);
              const isExpanded = expandedGoal === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-card border rounded-lg"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryInfo.emoji}</span>
                        <h4 className="font-medium">{goal.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={goal.progress} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-12">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t space-y-4"
                      >
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="px-2 py-1 bg-muted rounded">{categoryInfo.label}</span>
                          {goal.target_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(goal.target_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Update Progress</label>
                          <Slider
                            value={[goal.progress]}
                            onValueCommit={(value) => {
                              updateProgressMutation.mutate({
                                goalId: goal.id,
                                progress: value[0],
                                goalTitle: goal.title,
                              });
                            }}
                            max={100}
                            step={5}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              updateProgressMutation.mutate({
                                goalId: goal.id,
                                progress: 100,
                                goalTitle: goal.title,
                              })
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteGoalMutation.mutate(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              ✅ Completed ({completedGoals.length})
            </h4>
            <div className="space-y-2">
              {completedGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>{getCategoryInfo(goal.category).emoji}</span>
                    <span className="text-sm line-through text-muted-foreground">
                      {goal.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {goal.completed_at && format(new Date(goal.completed_at), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
