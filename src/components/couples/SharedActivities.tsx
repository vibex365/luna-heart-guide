import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Clock, ChevronRight, Check, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyPartner } from "@/utils/smsNotifications";
interface SharedActivity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  difficulty: string;
  instructions: string[];
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-600 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  challenging: "bg-red-500/10 text-red-600 border-red-500/30",
};

const categoryEmojis: Record<string, string> = {
  connection: "💕",
  intimacy: "🌹",
  conflict: "🕊️",
  communication: "💬",
};

export const SharedActivities = () => {
  const [selectedActivity, setSelectedActivity] = useState<SharedActivity | null>(null);
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["shared-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_activities")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      
      return (data || []).map(activity => ({
        ...activity,
        instructions: Array.isArray(activity.instructions) 
          ? activity.instructions 
          : JSON.parse(activity.instructions as string || '[]')
      })) as SharedActivity[];
    },
  });

  const { data: completedIds = [] } = useQuery({
    queryKey: ["completed-activities", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const { data, error } = await supabase
        .from("completed_activities")
        .select("activity_id")
        .eq("partner_link_id", partnerLink.id);

      if (error) throw error;
      return data.map(c => c.activity_id);
    },
    enabled: !!partnerLink,
  });

  const partnerId = partnerLink?.user_id === user?.id 
    ? partnerLink?.partner_id 
    : partnerLink?.user_id;

  const completeMutation = useMutation({
    mutationFn: async (activity: SharedActivity) => {
      if (!user || !partnerLink) throw new Error("Not connected");

      const { error } = await supabase
        .from("completed_activities")
        .insert({
          partner_link_id: partnerLink.id,
          activity_id: activity.id,
          completed_by: user.id,
        });

      if (error) throw error;
      return activity;
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ["completed-activities"] });
      toast({
        title: "Activity Completed! 🎉",
        description: "Great job connecting with your partner!",
      });
      setSelectedActivity(null);
      
      // Notify partner via SMS
      if (partnerId) {
        notifyPartner.activityCompleted(partnerId, activity.title);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark activity as complete.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Couples Activities
          </CardTitle>
          <CardDescription>Strengthen your connection together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.map((activity, index) => {
            const isCompleted = completedIds.includes(activity.id);
            
            return (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedActivity(activity)}
                className={`w-full p-3 rounded-lg border text-left transition-all hover:border-primary/50 hover:bg-accent/50 ${
                  isCompleted ? "bg-green-500/5 border-green-500/30" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryEmojis[activity.category] || "✨"}</span>
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {activity.title}
                        {isCompleted && <Check className="w-4 h-4 text-green-500" />}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.duration_minutes} min
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${difficultyColors[activity.difficulty as keyof typeof difficultyColors]}`}
                        >
                          {activity.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            );
          })}

          {activities.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No activities available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {categoryEmojis[selectedActivity?.category || ""] || "✨"}
              </span>
              {selectedActivity?.title}
            </DialogTitle>
            <DialogDescription>{selectedActivity?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedActivity?.duration_minutes} min
              </Badge>
              <Badge 
                variant="outline" 
                className={difficultyColors[selectedActivity?.difficulty as keyof typeof difficultyColors]}
              >
                {selectedActivity?.difficulty}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Instructions</h4>
              <ol className="space-y-2">
                {selectedActivity?.instructions.map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3 text-sm"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            {partnerLink && (
              <Button
                onClick={() => selectedActivity && completeMutation.mutate(selectedActivity)}
                disabled={completeMutation.isPending || completedIds.includes(selectedActivity?.id || "")}
                className="w-full"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : completedIds.includes(selectedActivity?.id || "") ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Heart className="w-4 h-4 mr-2" />
                )}
                {completedIds.includes(selectedActivity?.id || "") ? "Completed!" : "Mark as Complete"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
