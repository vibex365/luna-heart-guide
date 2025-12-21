import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { thirtySixQuestions } from "@/data/couplesGamesContent";

interface ThirtySixQuestionsProps {
  partnerLinkId: string;
}

type Level = "level1" | "level2" | "level3";

const levelInfo = {
  level1: { name: "Set I", description: "Getting to know each other", color: "bg-blue-500" },
  level2: { name: "Set II", description: "Going deeper", color: "bg-purple-500" },
  level3: { name: "Set III", description: "Building intimacy", color: "bg-pink-500" },
};

const ThirtySixQuestions: React.FC<ThirtySixQuestionsProps> = ({ partnerLinkId }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<"menu" | "playing">("menu");
  const [currentLevel, setCurrentLevel] = useState<Level>("level1");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [partnerLinkId]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("couples_game_history")
        .select("details")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "36_questions")
        .eq("played_by", user.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.details) {
        const details = data.details as any;
        if (details.completedQuestions) {
          setCompletedQuestions(new Set(details.completedQuestions));
        }
        if (details.currentLevel) {
          setCurrentLevel(details.currentLevel);
        }
        if (details.currentIndex !== undefined) {
          setCurrentIndex(details.currentIndex);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveProgress = async () => {
    if (!user) return;

    try {
      await supabase.from("couples_game_history").upsert({
        partner_link_id: partnerLinkId,
        game_type: "36_questions",
        played_by: user.id,
        details: {
          completedQuestions: Array.from(completedQuestions),
          currentLevel,
          currentIndex,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const startFromLevel = (level: Level) => {
    setCurrentLevel(level);
    setCurrentIndex(0);
    setGameState("playing");
  };

  const continueFromProgress = () => {
    setGameState("playing");
  };

  const markAsDiscussed = () => {
    const questions = thirtySixQuestions[currentLevel];
    const question = questions[currentIndex];
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(question.id);
    setCompletedQuestions(newCompleted);
    saveProgress();
  };

  const goToNext = () => {
    const questions = thirtySixQuestions[currentLevel];
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (currentLevel === "level1") {
      setCurrentLevel("level2");
      setCurrentIndex(0);
    } else if (currentLevel === "level2") {
      setCurrentLevel("level3");
      setCurrentIndex(0);
    }
    saveProgress();
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (currentLevel === "level2") {
      setCurrentLevel("level1");
      setCurrentIndex(11);
    } else if (currentLevel === "level3") {
      setCurrentLevel("level2");
      setCurrentIndex(11);
    }
  };

  const questions = thirtySixQuestions[currentLevel];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = 36;
  const currentQuestionNumber = 
    (currentLevel === "level1" ? 0 : currentLevel === "level2" ? 12 : 24) + currentIndex + 1;
  const progress = (completedQuestions.size / totalQuestions) * 100;
  const isCompleted = currentQuestion && completedQuestions.has(currentQuestion.id);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          36 Questions to Fall in Love
        </CardTitle>
        {completedQuestions.size > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedQuestions.size}/36 discussed</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
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
                The famous 36 questions designed to build emotional intimacy. Take turns answering each question with your partner.
              </p>

              <div className="space-y-2">
                {(Object.keys(levelInfo) as Level[]).map((level) => {
                  const info = levelInfo[level];
                  const levelQuestions = thirtySixQuestions[level];
                  const levelCompleted = levelQuestions.filter(q => completedQuestions.has(q.id)).length;
                  
                  return (
                    <button
                      key={level}
                      onClick={() => startFromLevel(level)}
                      className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${info.color}`} />
                          <span className="font-medium">{info.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {levelCompleted}/12
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>

              {completedQuestions.size > 0 && (
                <Button onClick={continueFromProgress} variant="outline" className="w-full">
                  Continue Where You Left Off
                </Button>
              )}
            </motion.div>
          )}

          {gameState === "playing" && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge className={levelInfo[currentLevel].color}>
                  {levelInfo[currentLevel].name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Question {currentQuestionNumber} of 36
                </span>
              </div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="min-h-[120px] flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
              >
                <p className="text-center text-base leading-relaxed">
                  {currentQuestion.text}
                </p>
              </motion.div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrev}
                  disabled={currentLevel === "level1" && currentIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant={isCompleted ? "secondary" : "default"}
                  onClick={markAsDiscussed}
                  className="flex-1"
                >
                  {isCompleted ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Discussed
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Mark as Discussed
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  disabled={currentLevel === "level3" && currentIndex === 11}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex justify-center gap-1">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex
                        ? "bg-primary"
                        : completedQuestions.has(questions[idx].id)
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGameState("menu")}
                className="w-full text-muted-foreground"
              >
                Back to Menu
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ThirtySixQuestions;
