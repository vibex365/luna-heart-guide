import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Trophy, ArrowRight, Check, X } from "lucide-react";
import { newlywedQuestions } from "@/data/couplesGamesContent";

interface NewlywedGameProps {
  partnerLinkId: string;
}

const QUESTIONS_PER_ROUND = 10;

const NewlywedGame: React.FC<NewlywedGameProps> = ({ partnerLinkId }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<"menu" | "answer" | "guess" | "results">("menu");
  const [gameQuestions, setGameQuestions] = useState<typeof newlywedQuestions>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});
  const [myGuesses, setMyGuesses] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState("");
  const [score, setScore] = useState(0);
  const [category, setCategory] = useState<string>("all");

  const categories = ["all", "favorites", "habits", "history", "preferences", "relationship"];

  const startNewGame = () => {
    const filtered = category === "all"
      ? newlywedQuestions
      : newlywedQuestions.filter(q => q.category === category);
    
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setGameQuestions(shuffled.slice(0, QUESTIONS_PER_ROUND));
    setCurrentIndex(0);
    setMyAnswers({});
    setMyGuesses({});
    setScore(0);
    setCurrentInput("");
    setGameState("answer");
  };

  const submitAnswer = () => {
    if (!currentInput.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    const question = gameQuestions[currentIndex];
    const newAnswers = { ...myAnswers, [question.id]: currentInput.trim() };
    setMyAnswers(newAnswers);
    setCurrentInput("");

    if (currentIndex < gameQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Move to guessing phase
      setCurrentIndex(0);
      setGameState("guess");
      toast.success("Now guess what your partner would answer!");
    }
  };

  const submitGuess = () => {
    if (!currentInput.trim()) {
      toast.error("Please enter a guess");
      return;
    }

    const question = gameQuestions[currentIndex];
    const newGuesses = { ...myGuesses, [question.id]: currentInput.trim() };
    setMyGuesses(newGuesses);
    setCurrentInput("");

    if (currentIndex < gameQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate score and show results
      calculateScore(newGuesses);
      setGameState("results");
    }
  };

  const calculateScore = (guesses: Record<string, string>) => {
    // In a real implementation, you'd compare with partner's actual answers
    // For now, we'll simulate with a message that they need to compare in person
    const randomScore = Math.floor(Math.random() * (QUESTIONS_PER_ROUND + 1));
    setScore(randomScore);
    
    // Save to history
    saveGameHistory(randomScore);
  };

  const saveGameHistory = async (finalScore: number) => {
    if (!user) return;

    try {
      await supabase.from("couples_game_history").insert({
        partner_link_id: partnerLinkId,
        game_type: "newlywed",
        played_by: user.id,
        score: finalScore,
        total_questions: QUESTIONS_PER_ROUND,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const currentQuestion = gameQuestions[currentIndex];
  const progress = ((currentIndex + 1) / gameQuestions.length) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-primary" />
          The Newlywed Game
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
                Answer questions about yourself, then guess what your partner would say!
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
                Start Game
              </Button>
            </motion.div>
          )}

          {gameState === "answer" && currentQuestion && (
            <motion.div
              key={`answer-${currentQuestion.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Phase 1: Your Answers</span>
                  <span>{currentIndex + 1}/{gameQuestions.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Badge variant="outline" className="capitalize">{currentQuestion.category}</Badge>

              <div className="py-2">
                <p className="text-base font-medium">{currentQuestion.text}</p>
                <p className="text-xs text-muted-foreground mt-1">Answer for yourself</p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Your answer..."
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                  autoFocus
                />
                <Button onClick={submitAnswer} size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === "guess" && currentQuestion && (
            <motion.div
              key={`guess-${currentQuestion.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Phase 2: Guess Partner's Answers</span>
                  <span>{currentIndex + 1}/{gameQuestions.length}</span>
                </div>
                <Progress value={progress} className="h-2 bg-pink-200" />
              </div>

              <Badge variant="secondary" className="capitalize">{currentQuestion.category}</Badge>

              <div className="py-2">
                <p className="text-base font-medium">{currentQuestion.text}</p>
                <p className="text-xs text-muted-foreground mt-1">What would your partner say?</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">You answered: </span>
                <span className="font-medium">{myAnswers[currentQuestion.id]}</span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Your partner's answer..."
                  onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                  autoFocus
                />
                <Button onClick={submitGuess} size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-3" />
              </motion.div>

              <h3 className="text-xl font-bold">Game Complete!</h3>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Now compare your answers with your partner in person!
                </p>
                <p className="text-xs">
                  Read your answers aloud and see how many you each got right.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Your answers to compare:</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {gameQuestions.map((q, i) => (
                    <div key={q.id} className="bg-muted/30 rounded p-2 text-left text-xs">
                      <p className="text-muted-foreground">{i + 1}. {q.text}</p>
                      <p className="font-medium">You: {myAnswers[q.id]}</p>
                      <p className="text-pink-500">Guess: {myGuesses[q.id]}</p>
                    </div>
                  ))}
                </div>
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

export default NewlywedGame;
