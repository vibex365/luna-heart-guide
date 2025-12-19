import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, Trophy, RefreshCw, Heart, Clock, Edit, History, Bell, TrendingUp, Crown, Medal, Flame, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { notifyPartner } from "@/utils/smsNotifications";
import { format } from "date-fns";

interface Question {
  question: string;
  selfQuestion: string;
  options: string[];
  category: "preferences" | "about_them" | "communication" | "goals" | "daily" | "intimacy" | "dreams";
}

const questions: Question[] = [
  // Preferences
  { 
    question: "What's their favorite way to relax?", 
    selfQuestion: "What's YOUR favorite way to relax?",
    options: ["Reading/Netflix", "Outdoors/Exercise", "Gaming/Hobbies", "Sleeping/Napping"], 
    category: "preferences" 
  },
  { 
    question: "What would they choose for a perfect meal?", 
    selfQuestion: "What would YOU choose for a perfect meal?",
    options: ["Italian", "Asian cuisine", "Mexican", "American comfort food"], 
    category: "preferences" 
  },
  { 
    question: "What's their go-to comfort activity?", 
    selfQuestion: "What's YOUR go-to comfort activity?",
    options: ["Watching movies", "Cooking/Eating", "Talking to friends", "Being alone"], 
    category: "preferences" 
  },
  { 
    question: "What type of music do they enjoy most?", 
    selfQuestion: "What type of music do YOU enjoy most?",
    options: ["Pop/Top 40", "Rock/Alternative", "Hip-hop/R&B", "Classical/Jazz"], 
    category: "preferences" 
  },
  // About them
  { 
    question: "What's their biggest pet peeve?", 
    selfQuestion: "What's YOUR biggest pet peeve?",
    options: ["Being late", "Messiness", "Loud noises", "Interruptions"], 
    category: "about_them" 
  },
  { 
    question: "What stresses them out the most?", 
    selfQuestion: "What stresses YOU out the most?",
    options: ["Work deadlines", "Social situations", "Money worries", "Health concerns"], 
    category: "about_them" 
  },
  { 
    question: "What's their hidden talent?", 
    selfQuestion: "What's YOUR hidden talent?",
    options: ["Creative arts", "Problem solving", "Making people laugh", "Organizing"], 
    category: "about_them" 
  },
  { 
    question: "What makes them feel most appreciated?", 
    selfQuestion: "What makes YOU feel most appreciated?",
    options: ["Verbal praise", "Small surprises", "Helping out", "Spending time"], 
    category: "about_them" 
  },
  { 
    question: "What's their love language?", 
    selfQuestion: "What's YOUR love language?",
    options: ["Words of affirmation", "Physical touch", "Quality time", "Acts of service"], 
    category: "about_them" 
  },
  // Communication
  { 
    question: "How do they prefer to resolve conflicts?", 
    selfQuestion: "How do YOU prefer to resolve conflicts?",
    options: ["Talk it out immediately", "Need time to cool down first", "Write down thoughts", "Seek compromise quickly"], 
    category: "communication" 
  },
  { 
    question: "How do they prefer to receive bad news?", 
    selfQuestion: "How do YOU prefer to receive bad news?",
    options: ["Directly and honestly", "Gently and gradually", "In writing first", "In person with support"], 
    category: "communication" 
  },
  { 
    question: "When upset, what do they need most?", 
    selfQuestion: "When upset, what do YOU need most?",
    options: ["Space and quiet", "Physical comfort", "Someone to listen", "Practical solutions"], 
    category: "communication" 
  },
  { 
    question: "How do they show affection?", 
    selfQuestion: "How do YOU show affection?",
    options: ["Words and compliments", "Hugs and kisses", "Thoughtful gestures", "Quality time together"], 
    category: "communication" 
  },
  // Future Goals
  { 
    question: "What's their dream vacation?", 
    selfQuestion: "What's YOUR dream vacation?",
    options: ["Beach resort", "Mountain adventure", "City exploration", "Road trip"], 
    category: "goals" 
  },
  { 
    question: "Where do they see themselves in 5 years?", 
    selfQuestion: "Where do YOU see yourself in 5 years?",
    options: ["Career focused", "Family focused", "Adventure seeking", "Balanced lifestyle"], 
    category: "goals" 
  },
  { 
    question: "What's their biggest life goal?", 
    selfQuestion: "What's YOUR biggest life goal?",
    options: ["Financial freedom", "Happy family", "Career success", "Personal fulfillment"], 
    category: "goals" 
  },
  { 
    question: "Ideal retirement activity?", 
    selfQuestion: "What's YOUR ideal retirement activity?",
    options: ["Traveling the world", "Spending time with family", "Pursuing hobbies", "Volunteering"], 
    category: "goals" 
  },
  // Daily Life
  { 
    question: "Are they a morning person or night owl?", 
    selfQuestion: "Are YOU a morning person or night owl?",
    options: ["Early bird", "Night owl", "Neither - midday person", "Depends on the day"], 
    category: "daily" 
  },
  { 
    question: "How do they like their coffee/tea?", 
    selfQuestion: "How do YOU like your coffee/tea?",
    options: ["Black/plain", "With milk/cream", "Sweet and creamy", "Don't drink it"], 
    category: "daily" 
  },
  { 
    question: "What's their ideal weekend?", 
    selfQuestion: "What's YOUR ideal weekend?",
    options: ["Lazy at home", "Active and outdoors", "Social with friends", "Mix of everything"], 
    category: "daily" 
  },
  { 
    question: "How do they unwind after work?", 
    selfQuestion: "How do YOU unwind after work?",
    options: ["Screen time", "Exercise", "Socializing", "Quiet time alone"], 
    category: "daily" 
  },
  // Intimacy
  { 
    question: "What makes them feel most connected to you?", 
    selfQuestion: "What makes YOU feel most connected to your partner?",
    options: ["Deep conversations", "Physical closeness", "Shared activities", "Acts of care"], 
    category: "intimacy" 
  },
  { 
    question: "How important is alone time to them?", 
    selfQuestion: "How important is alone time to YOU?",
    options: ["Very important daily", "Occasional need", "Rarely needed", "Prefer always together"], 
    category: "intimacy" 
  },
  { 
    question: "What's their ideal date night?", 
    selfQuestion: "What's YOUR ideal date night?",
    options: ["Romantic dinner", "Adventure activity", "Cozy movie night", "New experience"], 
    category: "intimacy" 
  },
  // Dreams
  { 
    question: "If money wasn't an issue, what would they do?", 
    selfQuestion: "If money wasn't an issue, what would YOU do?",
    options: ["Travel endlessly", "Start a business", "Help others", "Pursue creative passions"], 
    category: "dreams" 
  },
  { 
    question: "What's their secret dream?", 
    selfQuestion: "What's YOUR secret dream?",
    options: ["Write a book", "Learn an instrument", "Live abroad", "Build something"], 
    category: "dreams" 
  },
];

type GameMode = "loading" | "set_answers" | "waiting" | "play" | "playing" | "finished" | "history" | "leaderboard";

interface QuizSelfAnswers {
  id: string;
  partner_link_id: string;
  user_id: string;
  answers: Record<string, number>;
  completed_at: string;
}

interface QuizHistoryEntry {
  id: string;
  score: number;
  completed_at: string;
  played_by: string;
}

interface CouplesQuizGameProps {
  partnerLinkId?: string;
}

export const CouplesQuizGame = ({ partnerLinkId }: CouplesQuizGameProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gameMode, setGameMode] = useState<GameMode>("loading");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [selfAnswers, setSelfAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  // Fetch current user's self-answers
  const { data: myAnswers, isLoading: loadingMyAnswers } = useQuery({
    queryKey: ["quiz-self-answers", partnerLinkId, user?.id],
    queryFn: async () => {
      if (!partnerLinkId || !user?.id) return null;
      const { data, error } = await supabase
        .from("quiz_self_answers")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as QuizSelfAnswers | null;
    },
    enabled: !!partnerLinkId && !!user?.id,
  });

  // Fetch partner's answers
  const { data: partnerAnswersData, isLoading: loadingPartnerAnswers } = useQuery({
    queryKey: ["quiz-partner-answers", partnerLinkId, user?.id],
    queryFn: async () => {
      if (!partnerLinkId || !user?.id) return null;
      const { data, error } = await supabase
        .from("quiz_self_answers")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .neq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as QuizSelfAnswers | null;
    },
    enabled: !!partnerLinkId && !!user?.id,
  });

  // Fetch quiz history
  const { data: quizHistory = [] } = useQuery({
    queryKey: ["quiz-history", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];
      const { data, error } = await supabase
        .from("couples_game_history")
        .select("id, score, completed_at, played_by")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "quiz")
        .order("completed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as QuizHistoryEntry[];
    },
    enabled: !!partnerLinkId,
  });

  // Fetch partner's name and ID
  const { data: partnerInfo } = useQuery({
    queryKey: ["partner-info-quiz", partnerLinkId, user?.id],
    queryFn: async () => {
      if (!partnerLinkId || !user?.id) return null;
      const { data: link } = await supabase
        .from("partner_links")
        .select("user_id, partner_id")
        .eq("id", partnerLinkId)
        .single();
      
      if (!link) return null;
      const partnerId = link.user_id === user.id ? link.partner_id : link.user_id;
      if (!partnerId) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .single();
      
      return { partnerId, partnerName: profile?.display_name || "Your partner" };
    },
    enabled: !!partnerLinkId && !!user?.id,
  });

  // Fetch current user's name
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-quiz", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const partnerName = partnerInfo?.partnerName || "Your partner";
  const partnerId = partnerInfo?.partnerId;
  const myName = myProfile?.display_name || "Your partner";

  // Save self-answers mutation
  const saveAnswersMutation = useMutation({
    mutationFn: async (answers: Record<string, number>) => {
      if (!partnerLinkId || !user?.id) throw new Error("Missing data");
      
      const { error } = await supabase
        .from("quiz_self_answers")
        .upsert({
          partner_link_id: partnerLinkId,
          user_id: user.id,
          answers,
          completed_at: new Date().toISOString(),
        }, { onConflict: "partner_link_id,user_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-self-answers"] });
      toast({ title: "Your answers have been saved!" });
      
      // Send automatic SMS notification to partner
      if (partnerId && myName) {
        const partnerHasAnswers = !!partnerAnswersData;
        notifyPartner.quizAnswersReady(partnerId, myName, partnerHasAnswers);
      }
    },
    onError: () => {
      toast({ title: "Failed to save answers", variant: "destructive" });
    },
  });

  // Save quiz result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (score: number) => {
      if (!partnerLinkId || !user?.id) throw new Error("Missing data");
      
      const { error } = await supabase
        .from("couples_game_history")
        .insert({
          partner_link_id: partnerLinkId,
          game_type: "quiz",
          score,
          played_by: user.id,
          total_questions: questions.length,
          matches: Math.round((score / 100) * questions.length),
        });
      
      if (error) throw error;
      return score;
    },
    onSuccess: (score) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-history"] });
      // Notify partner of quiz completion with score
      if (partnerId) {
        const correctAnswers = Math.round((score / 100) * questions.length);
        notifyPartner.quizCompleted(partnerId, myName, correctAnswers, questions.length);
      }
    },
  });

  // Remind partner mutation
  const remindPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!partnerId) throw new Error("No partner");
      await notifyPartner.quizReminder(partnerId, myName);
    },
    onSuccess: () => {
      toast({ title: "Reminder sent!", description: `${partnerName} will receive an SMS reminder.` });
    },
    onError: () => {
      toast({ title: "Couldn't send reminder", description: "Partner may not have SMS notifications enabled.", variant: "destructive" });
    },
  });

  // Determine game mode based on data
  useEffect(() => {
    if (loadingMyAnswers || loadingPartnerAnswers) {
      setGameMode("loading");
      return;
    }

    if (!myAnswers) {
      setGameMode("set_answers");
      return;
    }

    if (!partnerAnswersData) {
      setGameMode("waiting");
      return;
    }

    setGameMode("play");
  }, [myAnswers, partnerAnswersData, loadingMyAnswers, loadingPartnerAnswers]);

  // Real-time subscription for partner's answers
  useEffect(() => {
    if (!partnerLinkId || !user?.id) return;

    const channel = supabase
      .channel(`quiz-answers-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_self_answers",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quiz-self-answers"] });
          queryClient.invalidateQueries({ queryKey: ["quiz-partner-answers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, user?.id, queryClient]);

  const handleStartSetAnswers = () => {
    setCurrentQuestion(0);
    setSelfAnswers([]);
    setGameMode("set_answers");
  };

  const handleSelectSelfAnswer = (answerIndex: number) => {
    const newAnswers = [...selfAnswers, answerIndex];
    setSelfAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      const answersObject: Record<string, number> = {};
      newAnswers.forEach((answer, index) => {
        answersObject[index.toString()] = answer;
      });
      saveAnswersMutation.mutate(answersObject);
    }
  };

  const handleStartQuiz = () => {
    setGameMode("playing");
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResult(false);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers, answerIndex];
    setSelectedAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        const finalScore = calculateScoreFromAnswers(newAnswers);
        saveResultMutation.mutate(finalScore);
        setGameMode("finished");
      }
    }, 1500);
  };

  const getPartnerAnswer = (questionIndex: number): number => {
    if (!partnerAnswersData?.answers) return -1;
    return partnerAnswersData.answers[questionIndex.toString()] ?? -1;
  };

  const calculateScoreFromAnswers = (answers: number[]) => {
    let matches = 0;
    answers.forEach((answer, index) => {
      if (answer === getPartnerAnswer(index)) matches++;
    });
    return Math.round((matches / questions.length) * 100);
  };

  const calculateScore = () => calculateScoreFromAnswers(selectedAnswers);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Calculate stats from history
  const myHistory = quizHistory.filter(h => h.played_by === user?.id);
  const partnerHistory = quizHistory.filter(h => partnerId && h.played_by === partnerId);
  const averageScore = myHistory.length > 0 
    ? Math.round(myHistory.reduce((acc, h) => acc + (h.score || 0), 0) / myHistory.length)
    : 0;
  const bestScore = myHistory.length > 0 
    ? Math.max(...myHistory.map(h => h.score || 0))
    : 0;
  
  // Leaderboard calculations
  const partnerAverageScore = partnerHistory.length > 0 
    ? Math.round(partnerHistory.reduce((acc, h) => acc + (h.score || 0), 0) / partnerHistory.length)
    : 0;
  const partnerBestScore = partnerHistory.length > 0 
    ? Math.max(...partnerHistory.map(h => h.score || 0))
    : 0;
  const myTotalGames = myHistory.length;
  const partnerTotalGames = partnerHistory.length;
  
  // Determine leader
  const scoreDiff = averageScore - partnerAverageScore;
  const isMyLead = scoreDiff > 0;
  const isTied = scoreDiff === 0 && myTotalGames > 0 && partnerTotalGames > 0;
  
  // Win streaks (consecutive games with 70%+ score)
  const calculateWinStreak = (history: QuizHistoryEntry[]) => {
    let streak = 0;
    for (const entry of [...history].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )) {
      if ((entry.score || 0) >= 70) streak++;
      else break;
    }
    return streak;
  };
  const myStreak = calculateWinStreak(myHistory);
  const partnerStreak = calculateWinStreak(partnerHistory);

  if (gameMode === "loading") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            How Well Do You Know Them?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            How Well Do You Know Them?
          </CardTitle>
          {quizHistory.length > 0 && gameMode !== "history" && gameMode !== "leaderboard" && gameMode !== "playing" && gameMode !== "set_answers" && (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setGameMode("leaderboard")}
                className="gap-1 text-xs"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {/* LEADERBOARD VIEW */}
          {gameMode === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Leaderboard
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setGameMode("play")}>
                  Back
                </Button>
              </div>

              {/* Competition banner */}
              <div className={cn(
                "rounded-lg p-4 text-center",
                isTied ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10" :
                isMyLead ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10" :
                "bg-gradient-to-r from-amber-500/10 to-orange-500/10"
              )}>
                {isTied ? (
                  <>
                    <div className="text-2xl mb-1">🤝</div>
                    <p className="font-semibold">It's a tie!</p>
                    <p className="text-xs text-muted-foreground">You know each other equally well</p>
                  </>
                ) : myTotalGames === 0 && partnerTotalGames === 0 ? (
                  <>
                    <div className="text-2xl mb-1">🎮</div>
                    <p className="font-semibold">No games yet!</p>
                    <p className="text-xs text-muted-foreground">Play the quiz to start the competition</p>
                  </>
                ) : (
                  <>
                    <Crown className={cn(
                      "w-8 h-8 mx-auto mb-1",
                      isMyLead ? "text-green-500" : "text-amber-500"
                    )} />
                    <p className="font-semibold">
                      {isMyLead ? "You're in the lead!" : `${partnerName} is winning!`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(scoreDiff)}% average score difference
                    </p>
                  </>
                )}
              </div>

              {/* Leaderboard cards */}
              <div className="space-y-3">
                {/* Your stats */}
                <div className={cn(
                  "rounded-lg p-3 border-2 transition-all",
                  isMyLead && !isTied ? "border-green-500/50 bg-green-500/5" : "border-muted"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isMyLead && !isTied && <Medal className="w-5 h-5 text-yellow-500" />}
                      <span className="font-semibold">You</span>
                    </div>
                    {myStreak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 text-xs">
                        <Flame className="w-4 h-4" />
                        {myStreak} streak
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold text-lg">{averageScore}%</div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-green-600">{bestScore}%</div>
                      <div className="text-xs text-muted-foreground">Best</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{myTotalGames}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </div>
                </div>

                {/* Partner stats */}
                <div className={cn(
                  "rounded-lg p-3 border-2 transition-all",
                  !isMyLead && !isTied && partnerTotalGames > 0 ? "border-amber-500/50 bg-amber-500/5" : "border-muted"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {!isMyLead && !isTied && partnerTotalGames > 0 && <Medal className="w-5 h-5 text-yellow-500" />}
                      <span className="font-semibold">{partnerName}</span>
                    </div>
                    {partnerStreak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 text-xs">
                        <Flame className="w-4 h-4" />
                        {partnerStreak} streak
                      </div>
                    )}
                  </div>
                  {partnerTotalGames > 0 ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-bold text-lg">{partnerAverageScore}%</div>
                        <div className="text-xs text-muted-foreground">Average</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-green-600">{partnerBestScore}%</div>
                        <div className="text-xs text-muted-foreground">Best</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg">{partnerTotalGames}</div>
                        <div className="text-xs text-muted-foreground">Games</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Waiting for {partnerName} to play...
                    </p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              {(myTotalGames > 0 || partnerTotalGames > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Achievements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {bestScore >= 90 && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-700 px-2 py-1 rounded-full">
                        🏆 Quiz Master (90%+)
                      </span>
                    )}
                    {myStreak >= 3 && (
                      <span className="text-xs bg-orange-500/20 text-orange-700 px-2 py-1 rounded-full">
                        🔥 On Fire (3+ streak)
                      </span>
                    )}
                    {myTotalGames >= 5 && (
                      <span className="text-xs bg-blue-500/20 text-blue-700 px-2 py-1 rounded-full">
                        🎯 Dedicated (5+ games)
                      </span>
                    )}
                    {myTotalGames >= 10 && (
                      <span className="text-xs bg-purple-500/20 text-purple-700 px-2 py-1 rounded-full">
                        💫 Expert (10+ games)
                      </span>
                    )}
                    {averageScore >= 75 && myTotalGames >= 3 && (
                      <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded-full">
                        💕 Soulmate Material (75%+ avg)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Recent games */}
              {quizHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Recent Games
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {quizHistory.slice(0, 5).map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            entry.played_by === user?.id ? "bg-purple-500" : "bg-blue-500"
                          )} />
                          <span className="text-muted-foreground text-xs">
                            {entry.played_by === user?.id ? "You" : partnerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold text-xs",
                            entry.score >= 80 ? "text-green-600" : 
                            entry.score >= 50 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {entry.score}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.completed_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleStartQuiz} className="w-full">
                Play to Improve Your Score
              </Button>
            </motion.div>
          )}

          {/* SET YOUR ANSWERS MODE */}
          {gameMode === "set_answers" && selfAnswers.length === 0 && (
            <motion.div
              key="set-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Edit className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="font-semibold">Set Your Answers First!</h3>
              <p className="text-sm text-muted-foreground">
                Answer {questions.length} questions about yourself so your partner can try to guess them.
              </p>
              <Button onClick={() => setSelfAnswers([])} className="w-full">
                Set My Answers
              </Button>
            </motion.div>
          )}

          {gameMode === "set_answers" && selfAnswers.length < questions.length && selfAnswers.length >= 0 && (
            <motion.div
              key={`self-question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full capitalize">
                  {questions[currentQuestion].category.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>Setting Your Answers</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <p className="text-lg font-medium text-center py-4">
                {questions[currentQuestion].selfQuestion}
              </p>

              <div className="grid gap-2">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleSelectSelfAnswer(index)}
                    disabled={saveAnswersMutation.isPending}
                    className="h-auto py-3 px-4 justify-start text-left hover:bg-purple-500/10 hover:border-purple-500"
                  >
                    <span className="flex-1">{option}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* WAITING FOR PARTNER MODE */}
          {gameMode === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold">Waiting for {partnerName}</h3>
              <p className="text-sm text-muted-foreground">
                You've set your answers! Once {partnerName} sets theirs, you can play the quiz.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => remindPartnerMutation.mutate()}
                  disabled={remindPartnerMutation.isPending}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {remindPartnerMutation.isPending ? "Sending..." : "Remind Partner"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleStartSetAnswers}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit My Answers
                </Button>
              </div>
            </motion.div>
          )}

          {/* READY TO PLAY MODE */}
          {gameMode === "play" && (
            <motion.div
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold">Ready to Play!</h3>
              <p className="text-sm text-muted-foreground">
                {questions.length} questions about {partnerName}. How well do you really know them?
              </p>
              
              {myHistory.length > 0 && (
                <div className="flex justify-center gap-4 text-sm">
                  <span className="text-muted-foreground">Best: <span className="text-green-600 font-semibold">{bestScore}%</span></span>
                  <span className="text-muted-foreground">Avg: <span className="font-semibold">{averageScore}%</span></span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={handleStartQuiz} className="w-full">
                  Start Quiz
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleStartSetAnswers}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Update My Answers
                </Button>
              </div>
            </motion.div>
          )}

          {/* PLAYING MODE */}
          {gameMode === "playing" && (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full capitalize">
                  {questions[currentQuestion].category.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>Guessing {partnerName}'s Answers</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <p className="text-lg font-medium text-center py-4">
                {questions[currentQuestion].question}
              </p>

              <div className="grid gap-2">
                {questions[currentQuestion].options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion] === index;
                  const isCorrect = getPartnerAnswer(currentQuestion) === index;
                  const showFeedback = showResult && isSelected;

                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => !showResult && handleSelectAnswer(index)}
                      disabled={showResult}
                      className={cn(
                        "h-auto py-3 px-4 justify-start text-left",
                        showFeedback && isCorrect && "border-green-500 bg-green-500/10",
                        showFeedback && !isCorrect && "border-red-500 bg-red-500/10",
                        showResult && isCorrect && !isSelected && "border-green-500/50 bg-green-500/5"
                      )}
                    >
                      <span className="flex-1">{option}</span>
                      {showFeedback && (
                        isCorrect ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )
                      )}
                      {showResult && isCorrect && !isSelected && (
                        <Check className="w-5 h-5 text-green-500/50" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* FINISHED MODE */}
          {gameMode === "finished" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              
              {/* Both partners' scores */}
              <div className="grid grid-cols-2 gap-4">
                {/* Your score */}
                <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                  <h3 className="text-2xl font-bold text-purple-600">{calculateScore()}%</h3>
                  {bestScore > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Best: {bestScore}%
                    </p>
                  )}
                </div>
                
                {/* Partner's score */}
                <div className="rounded-lg p-3 bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground mb-1">{partnerName}'s Score</p>
                  {partnerHistory.length > 0 ? (
                    <>
                      <h3 className="text-2xl font-bold text-blue-600">{partnerHistory[0]?.score || 0}%</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Best: {partnerBestScore}%
                      </p>
                    </>
                  ) : (
                    <div className="py-1">
                      <p className="text-lg font-semibold text-muted-foreground">—</p>
                      <p className="text-xs text-muted-foreground">Hasn't played yet</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                {calculateScore() >= 80
                  ? "Amazing! You really know your partner! 💕"
                  : calculateScore() >= 50
                  ? "Good job! Keep learning about each other!"
                  : "Time for some quality conversations! 💬"}
              </p>
              
              {bestScore > 0 && calculateScore() > bestScore && (
                <div className="text-green-600 text-sm font-medium">
                  🎉 New personal best!
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={handleStartQuiz} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Play Again
                </Button>
                {quizHistory.length > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setGameMode("history")}
                    className="gap-2 text-sm"
                  >
                    <History className="w-4 h-4" />
                    View History
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
