import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, Clock, Star, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { startOfDay, isToday } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  duration_minutes: number | null;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-600 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-600 border-red-500/20",
};

const categoryIcons: Record<string, string> = {
  connection: "💕",
  quality_time: "⏰",
  words: "💬",
  intimacy: "✨",
  touch: "🤝",
  communication: "💭",
  acts: "🎁",
};

export const DailyChallenges = () => {
  const { user } = useAuth();
  const { partnerLink, isLinked } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Fetch all challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["couples-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_challenges")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as Challenge[];
    },
  });

  // Fetch today's completed challenges
  const { data: completedToday = [] } = useQuery({
    queryKey: ["completed-challenges-today", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const todayStart = startOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from("completed_challenges")
        .select("challenge_id, completed_by")
        .eq("partner_link_id", partnerLink.id)
        .gte("completed_at", todayStart);

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerLink,
  });

  // Complete challenge mutation
  const completeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user || !partnerLink) throw new Error("Not connected");

      const { error } = await supabase
        .from("completed_challenges")
        .insert({
          partner_link_id: partnerLink.id,
          challenge_id: challengeId,
          completed_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completed-challenges-today"] });
      toast({
        title: "Challenge Completed! 🎉",
        description: "Great job! Keep the connection strong.",
      });
      setSelectedChallenge(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete challenge. Try again.",
        variant: "destructive",
      });
    },
  });

  // Get today's challenge (rotate based on day of year)
  const getDailyChallenge = (): Challenge | null => {
    if (challenges.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return challenges[dayOfYear % challenges.length];
  };

  const dailyChallenge = getDailyChallenge();
  const isCompleted = (challengeId: string) => 
    completedToday.some(c => c.challenge_id === challengeId && c.completed_by === user?.id);
  const partnerCompleted = (challengeId: string) =>
    completedToday.some(c => c.challenge_id === challengeId && c.completed_by !== user?.id);

  if (!isLinked) return null;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Daily Challenge
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedToday.length} done today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {selectedChallenge ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-background border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[selectedChallenge.category] || "💫"}</span>
                    <h3 className="font-medium">{selectedChallenge.title}</h3>
                  </div>
                  <Badge className={difficultyColors[selectedChallenge.difficulty as keyof typeof difficultyColors] || difficultyColors.easy}>
                    {selectedChallenge.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedChallenge.description}
                </p>
                {selectedChallenge.duration_minutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    ~{selectedChallenge.duration_minutes} min
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedChallenge(null)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  onClick={() => completeMutation.mutate(selectedChallenge.id)}
                  disabled={completeMutation.isPending || isCompleted(selectedChallenge.id)}
                >
                  {isCompleted(selectedChallenge.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Done!
                    </>
                  ) : completeMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Complete
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Today's Featured Challenge */}
              {dailyChallenge && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChallenge(dailyChallenge)}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-left relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-purple-500 text-white text-xs">Today</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{categoryIcons[dailyChallenge.category] || "💫"}</span>
                    <span className="font-medium text-sm">{dailyChallenge.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {dailyChallenge.description}
                  </p>
                  {isCompleted(dailyChallenge.id) && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      You completed this!
                    </div>
                  )}
                  {partnerCompleted(dailyChallenge.id) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-pink-600">
                      <Star className="w-3 h-3 fill-pink-500" />
                      Partner completed this!
                    </div>
                  )}
                </motion.button>
              )}

              {/* More Challenges */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">More Challenges</p>
                <div className="grid grid-cols-2 gap-2">
                  {challenges.slice(0, 4).map((challenge) => (
                    <motion.button
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChallenge(challenge)}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        isCompleted(challenge.id)
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{categoryIcons[challenge.category] || "💫"}</span>
                        {isCompleted(challenge.id) && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2">{challenge.title}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};