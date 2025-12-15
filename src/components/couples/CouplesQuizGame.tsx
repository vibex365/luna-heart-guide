import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, Trophy, RefreshCw, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  category: "about_them" | "preferences" | "memories" | "dreams";
}

const questions: Question[] = [
  { question: "What's their favorite way to relax?", options: ["Reading/Netflix", "Outdoors/Exercise", "Gaming/Hobbies", "Sleeping/Napping"], category: "preferences" },
  { question: "What's their biggest pet peeve?", options: ["Being late", "Messiness", "Loud noises", "Interruptions"], category: "about_them" },
  { question: "What would they choose for a perfect meal?", options: ["Italian", "Asian cuisine", "Mexican", "American comfort food"], category: "preferences" },
  { question: "How do they prefer to receive love?", options: ["Words of affirmation", "Physical touch", "Quality time", "Acts of service"], category: "about_them" },
  { question: "What's their dream vacation?", options: ["Beach resort", "Mountain adventure", "City exploration", "Road trip"], category: "dreams" },
  { question: "What stresses them out the most?", options: ["Work deadlines", "Social situations", "Money worries", "Health concerns"], category: "about_them" },
  { question: "What's their go-to comfort activity?", options: ["Watching movies", "Cooking/Eating", "Talking to friends", "Being alone"], category: "preferences" },
  { question: "How do they handle conflict?", options: ["Talk it out", "Need space first", "Avoid it", "Write it down"], category: "about_them" },
  { question: "What's their hidden talent?", options: ["Creative arts", "Problem solving", "Making people laugh", "Organizing"], category: "about_them" },
  { question: "What makes them feel most appreciated?", options: ["Verbal praise", "Small surprises", "Helping out", "Spending time"], category: "preferences" },
];

interface CouplesQuizGameProps {
  partnerLinkId?: string;
}

export const CouplesQuizGame = ({ partnerLinkId }: CouplesQuizGameProps) => {
  const [gameState, setGameState] = useState<"start" | "playing" | "finished">("start");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  // Simulate partner answers (in a real app, this would come from the database)
  useEffect(() => {
    if (gameState === "start") {
      const simulated = questions.map(() => Math.floor(Math.random() * 4));
      setPartnerAnswers(simulated);
    }
  }, [gameState]);

  const handleStart = () => {
    setGameState("playing");
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
        setGameState("finished");
      }
    }, 1500);
  };

  const calculateScore = () => {
    let matches = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === partnerAnswers[index]) matches++;
    });
    return Math.round((matches / questions.length) * 100);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
          {gameState === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Answer questions about your partner and see how well you really know them!
              </p>
              <Button onClick={handleStart} className="w-full">
                Start Quiz
              </Button>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
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
                  const isCorrect = partnerAnswers[currentQuestion] === index;
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
                        showFeedback && !isCorrect && "border-red-500 bg-red-500/10"
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
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {gameState === "finished" && (
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
              <Button onClick={handleStart} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
