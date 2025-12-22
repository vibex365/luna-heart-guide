import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Trophy, Clock, Zap } from "lucide-react";
import { GameCard } from "./cards/GameCard";
import { loveTriviaQuestions } from "@/data/newCardGamesContent";
import { useCouplesGame, GameType } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface LoveTriviaChallengeProps {
  partnerLinkId: string | undefined;
}

const GAME_TYPE: GameType = "love_trivia" as GameType;

export const LoveTriviaChallenge = ({ partnerLinkId }: LoveTriviaChallengeProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [questions, setQuestions] = useState<typeof loveTriviaQuestions>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    gameSession,
    localGameState,
    startGame,
    updateGameState,
    saveGameResult,
    isStarting,
  } = useCouplesGame(partnerLinkId, GAME_TYPE);

  const handleStartGame = () => {
    const shuffled = [...loveTriviaQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setMyScore(0);
    setPartnerScore(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsFlipped(false);
    startGame({ 
      questions: shuffled.map(q => q.id),
      scores: {},
      answers: {},
    });
  };

  const handleAnswer = (answer: string) => {
    if (!user || !gameSession || selectedAnswer) return;

    setSelectedAnswer(answer);
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.answer;

    const scores = (localGameState.scores as Record<string, number>) || {};
    const answers = (localGameState.answers as Record<string, Record<string, string>>) || {};

    const newScores = {
      ...scores,
      [user.id]: (scores[user.id] || 0) + (isCorrect ? 1 : 0),
    };

    const questionAnswers = answers[currentQuestion.id] || {};
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        ...questionAnswers,
        [user.id]: answer,
      },
    };

    if (isCorrect) {
      setMyScore(newScores[user.id]);
    }

    updateGameState({ scores: newScores, answers: newAnswers });

    // Show correct answer
    setTimeout(() => {
      setShowAnswer(true);
    }, 500);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setIsFlipped(false);
    } else {
      // Game finished
      saveGameResult({
        score: myScore,
        total_questions: questions.length,
        details: { 
          myScore, 
          partnerScore,
          winner: myScore > partnerScore ? user?.id : "partner",
        },
      });
    }
  };

  // Sync with game session
  useEffect(() => {
    if (gameSession && localGameState.questions) {
      const questionIds = localGameState.questions as string[];
      const sessionQuestions = questionIds
        .map(id => loveTriviaQuestions.find(q => q.id === id))
        .filter(Boolean) as typeof loveTriviaQuestions;
      setQuestions(sessionQuestions);
    }
  }, [gameSession, localGameState.questions]);

  // Update partner score
  useEffect(() => {
    if (user && localGameState.scores) {
      const scores = localGameState.scores as Record<string, number>;
      const partnerId = Object.keys(scores).find(id => id !== user.id);
      if (partnerId) {
        setPartnerScore(scores[partnerId] || 0);
      }
    }
  }, [localGameState.scores, user]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <Card className="overflow-hidden border-amber-200/50 dark:border-amber-800/50">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Love Trivia Challenge
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            Remote Play
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Test your knowledge about love, relationships, and famous couples!
        </p>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="p-4 space-y-4">
              {!gameSession || currentIndex >= questions.length ? (
                <div className="space-y-4">
                  {currentIndex >= questions.length && questions.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl"
                    >
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                      <h3 className="text-xl font-bold mb-2">Game Complete!</h3>
                      <div className="flex justify-center gap-8 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">You</p>
                          <p className="text-3xl font-bold text-amber-500">{myScore}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Partner</p>
                          <p className="text-3xl font-bold text-purple-500">{partnerScore}</p>
                        </div>
                      </div>
                      <p className="text-lg">
                        {myScore > partnerScore ? "🎉 You win!" : myScore < partnerScore ? "Your partner wins! 🎉" : "It's a tie! 🤝"}
                      </p>
                    </motion.div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={isStarting}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentIndex >= questions.length ? "Play Again" : "Start Trivia"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        You: {myScore}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        Partner: {partnerScore}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {currentIndex + 1}/{questions.length}
                    </span>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <GameCard
                    theme="adventure"
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(true)}
                    frontContent={
                      <div className="text-center">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                        <p className="text-lg font-medium">Tap to see question</p>
                      </div>
                    }
                    backContent={
                      <div className="text-center p-4">
                        <p className="text-lg font-medium mb-4">
                          {currentQuestion?.question}
                        </p>
                        {showAnswer && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"
                          >
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                              Correct Answer: {currentQuestion?.answer}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    }
                  />

                  {isFlipped && !showAnswer && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion?.options.map((option) => (
                        <Button
                          key={option}
                          variant={selectedAnswer === option ? "default" : "outline"}
                          className={`h-auto py-3 ${
                            selectedAnswer === option 
                              ? selectedAnswer === currentQuestion.answer
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                              : ""
                          }`}
                          onClick={() => handleAnswer(option)}
                          disabled={!!selectedAnswer}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {showAnswer && (
                    <Button className="w-full" onClick={handleNext}>
                      {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleStartGame}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart Game
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LoveTriviaChallenge;
