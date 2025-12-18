import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, Trophy, RefreshCw, Heart, Clock, Send, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

interface Question {
  question: string;
  selfQuestion: string; // Question phrased for answering about yourself
  options: string[];
  category: "about_them" | "preferences" | "memories" | "dreams";
}

const questions: Question[] = [
  { 
    question: "What's their favorite way to relax?", 
    selfQuestion: "What's YOUR favorite way to relax?",
    options: ["Reading/Netflix", "Outdoors/Exercise", "Gaming/Hobbies", "Sleeping/Napping"], 
    category: "preferences" 
  },
  { 
    question: "What's their biggest pet peeve?", 
    selfQuestion: "What's YOUR biggest pet peeve?",
    options: ["Being late", "Messiness", "Loud noises", "Interruptions"], 
    category: "about_them" 
  },
  { 
    question: "What would they choose for a perfect meal?", 
    selfQuestion: "What would YOU choose for a perfect meal?",
    options: ["Italian", "Asian cuisine", "Mexican", "American comfort food"], 
    category: "preferences" 
  },
  { 
    question: "How do they prefer to receive love?", 
    selfQuestion: "How do YOU prefer to receive love?",
    options: ["Words of affirmation", "Physical touch", "Quality time", "Acts of service"], 
    category: "about_them" 
  },
  { 
    question: "What's their dream vacation?", 
    selfQuestion: "What's YOUR dream vacation?",
    options: ["Beach resort", "Mountain adventure", "City exploration", "Road trip"], 
    category: "dreams" 
  },
  { 
    question: "What stresses them out the most?", 
    selfQuestion: "What stresses YOU out the most?",
    options: ["Work deadlines", "Social situations", "Money worries", "Health concerns"], 
    category: "about_them" 
  },
  { 
    question: "What's their go-to comfort activity?", 
    selfQuestion: "What's YOUR go-to comfort activity?",
    options: ["Watching movies", "Cooking/Eating", "Talking to friends", "Being alone"], 
    category: "preferences" 
  },
  { 
    question: "How do they handle conflict?", 
    selfQuestion: "How do YOU handle conflict?",
    options: ["Talk it out", "Need space first", "Avoid it", "Write it down"], 
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
    category: "preferences" 
  },
];

type GameMode = "loading" | "set_answers" | "waiting" | "play" | "playing" | "finished";

interface QuizSelfAnswers {
  id: string;
  partner_link_id: string;
  user_id: string;
  answers: Record<string, number>;
  completed_at: string;
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

  // Fetch partner's name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-quiz", partnerLinkId, user?.id],
    queryFn: async () => {
      if (!partnerLinkId || !user?.id) return null;
      // Get partner link to find partner id
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
      
      return profile;
    },
    enabled: !!partnerLinkId && !!user?.id,
  });

  const partnerName = partnerProfile?.display_name || "Your partner";

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
    },
    onError: () => {
      toast({ title: "Failed to save answers", variant: "destructive" });
    },
  });

  // Determine game mode based on data
  useEffect(() => {
    if (loadingMyAnswers || loadingPartnerAnswers) {
      setGameMode("loading");
      return;
    }

    // If user hasn't set their answers yet, show set_answers mode
    if (!myAnswers) {
      setGameMode("set_answers");
      return;
    }

    // If user has answered but partner hasn't, show waiting
    if (!partnerAnswersData) {
      setGameMode("waiting");
      return;
    }

    // Both have answered, ready to play
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
      // Convert to object and save
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
        setGameMode("finished");
      }
    }, 1500);
  };

  const getPartnerAnswer = (questionIndex: number): number => {
    if (!partnerAnswersData?.answers) return -1;
    return partnerAnswersData.answers[questionIndex.toString()] ?? -1;
  };

  const calculateScore = () => {
    let matches = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === getPartnerAnswer(index)) matches++;
    });
    return Math.round((matches / questions.length) * 100);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          How Well Do You Know Them?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {/* SET YOUR ANSWERS MODE */}
          {gameMode === "set_answers" && currentQuestion === 0 && selfAnswers.length === 0 && (
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
                Answer questions about yourself so your partner can try to guess them.
              </p>
              <Button onClick={() => setCurrentQuestion(0)} className="w-full">
                Set My Answers
              </Button>
            </motion.div>
          )}

          {gameMode === "set_answers" && (currentQuestion > 0 || selfAnswers.length > 0 || currentQuestion === 0) && selfAnswers.length < questions.length && (
            <motion.div
              key={`self-question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full">
                  Setting Your Answers
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="capitalize">{questions[currentQuestion].category.replace("_", " ")}</span>
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
                Both of you have set your answers. Try to guess what {partnerName} answered!
              </p>
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
                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full">
                  Guessing {partnerName}'s Answers
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="capitalize">{questions[currentQuestion].category.replace("_", " ")}</span>
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
              <div>
                <h3 className="text-2xl font-bold">{calculateScore()}%</h3>
                <p className="text-muted-foreground">
                  {calculateScore() >= 80
                    ? "Amazing! You really know your partner! 💕"
                    : calculateScore() >= 50
                    ? "Good job! Keep learning about each other!"
                    : "Time for some quality conversations! 💬"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleStartQuiz} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Play Again
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleStartSetAnswers}
                  className="gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Update My Answers
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
