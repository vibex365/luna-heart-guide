import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Heart, RefreshCw, CheckCircle } from "lucide-react";
import { mostLikelyToQuestions } from "@/data/couplesGamesContent";

interface MostLikelyToProps {
  partnerLinkId: string;
}

const QUESTIONS_PER_GAME = 10;

const MostLikelyTo: React.FC<MostLikelyToProps> = ({ partnerLinkId }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<"menu" | "playing" | "waiting" | "results">("menu");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<typeof mostLikelyToQuestions>([]);
  const [myAnswers, setMyAnswers] = useState<Record<string, "me" | "partner">>({});
  const [partnerAnswers, setPartnerAnswers] = useState<Record<string, "me" | "partner">>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("all");

  const categories = ["all", "fun", "romantic", "daily", "future", "embarrassing"];

  const startNewGame = () => {
    const filtered = category === "all" 
      ? mostLikelyToQuestions 
      : mostLikelyToQuestions.filter(q => q.category === category);
    
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setGameQuestions(shuffled.slice(0, QUESTIONS_PER_GAME));
    setCurrentQuestionIndex(0);
    setMyAnswers({});
    setPartnerAnswers({});
    setMatchCount(0);
    setGameState("playing");
    createSession(shuffled.slice(0, QUESTIONS_PER_GAME));
  };

  const createSession = async (questions: typeof mostLikelyToQuestions) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("couples_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          game_type: "most_likely_to",
          started_by: user.id,
          game_state: {
            questions: questions.map(q => q.id),
            answers: {},
          },
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error(error);
    }
  };

  const submitAnswer = async (answer: "me" | "partner") => {
    const question = gameQuestions[currentQuestionIndex];
    if (!question || !sessionId) return;

    const newAnswers = { ...myAnswers, [question.id]: answer };
    setMyAnswers(newAnswers);

    // Update session
    try {
      const { data: sessionData } = await supabase
        .from("couples_game_sessions")
        .select("game_state")
        .eq("id", sessionId)
        .single();

      const gameState = sessionData?.game_state as any || {};
      const allAnswers = gameState.answers || {};
      allAnswers[user?.id || ""] = newAnswers;

      await supabase
        .from("couples_game_sessions")
        .update({
          game_state: {
            ...gameState,
            answers: allAnswers,
          },
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error(error);
    }

    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState("waiting");
      checkForPartnerAnswers();
    }
  };

  const checkForPartnerAnswers = async () => {
    if (!sessionId || !user) return;

    const { data } = await supabase
      .from("couples_game_sessions")
      .select("game_state, started_by")
      .eq("id", sessionId)
      .single();

    if (data) {
      const gameState = data.game_state as any;
      const answers = gameState.answers || {};
      const partnerUserId = Object.keys(answers).find(id => id !== user.id);

      if (partnerUserId && answers[partnerUserId]) {
        setPartnerAnswers(answers[partnerUserId]);
        calculateResults(myAnswers, answers[partnerUserId]);
        setGameState("results");
      }
    }
  };

  const calculateResults = (mine: Record<string, "me" | "partner">, theirs: Record<string, "me" | "partner">) => {
    let matches = 0;
    Object.keys(mine).forEach(questionId => {
      // They match if both said the same person (accounting for perspective flip)
      const myAnswer = mine[questionId];
      const theirAnswer = theirs[questionId];
      
      // If I said "me" and they said "partner" (meaning me), OR
      // If I said "partner" and they said "me" (meaning them), it's a match
      if ((myAnswer === "me" && theirAnswer === "partner") || 
          (myAnswer === "partner" && theirAnswer === "me")) {
        matches++;
      }
    });
    setMatchCount(matches);
  };

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / gameQuestions.length) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Most Likely To
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {gameState === "menu" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Vote on who's most likely to do something. See if you and your partner agree!
              </p>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Choose category:</p>
                <div className="flex flex-wrap gap-1">
                  {categories.map(cat => (
                    <Badge 
                      key={cat}
                      variant={category === cat ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={startNewGame} className="w-full">
                Start Game ({QUESTIONS_PER_GAME} questions)
              </Button>
            </motion.div>
          )}

          {gameState === "playing" && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestionIndex + 1} of {gameQuestions.length}</span>
                  <Badge variant="outline" className="capitalize">{currentQuestion.category}</Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="text-center py-4">
                <p className="text-lg font-medium">{currentQuestion.text}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submitAnswer("me")}
                  className="p-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
                >
                  <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Me</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submitAnswer("partner")}
                  className="p-4 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 transition-colors"
                >
                  <Heart className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                  <p className="font-medium">Partner</p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === "waiting" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center space-y-4 py-6"
            >
              <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground">
                Waiting for your partner to finish...
              </p>
              <Button variant="outline" onClick={checkForPartnerAnswers}>
                Check for answers
              </Button>
            </motion.div>
          )}

          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 text-center"
            >
              <div className="py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-3" />
                </motion.div>
                <h3 className="text-2xl font-bold">{matchCount}/{gameQuestions.length}</h3>
                <p className="text-muted-foreground">Matches!</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  {matchCount >= 8 ? "Amazing! You really know each other! 💕" :
                   matchCount >= 5 ? "Pretty good! You're in sync! 😊" :
                   "Interesting results! Time to learn more about each other! 🤔"}
                </p>
              </div>

              <Button onClick={() => setGameState("menu")} className="w-full">
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MostLikelyTo;
