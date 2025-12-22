import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, RotateCcw, Eye, EyeOff, Sparkles, Wand2 } from "lucide-react";
import { GameCard } from "./cards/GameCard";
import { predictionPrompts } from "@/data/newCardGamesContent";
import { useCouplesGame, GameType } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface PredictionsGameProps {
  partnerLinkId: string | undefined;
}

const GAME_TYPE: GameType = "predictions" as GameType;

const categoryColors: Record<string, string> = {
  future: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  travel: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  lifestyle: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  relationship: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  daily: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
};

export const PredictionsGame = ({ partnerLinkId }: PredictionsGameProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompts, setPrompts] = useState<typeof predictionPrompts>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myPrediction, setMyPrediction] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [showReveals, setShowReveals] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const {
    gameSession,
    localGameState,
    startGame,
    updateGameState,
    saveGameResult,
    isStarting,
  } = useCouplesGame(partnerLinkId, GAME_TYPE);

  const handleStartGame = () => {
    const shuffled = [...predictionPrompts].sort(() => Math.random() - 0.5).slice(0, 8);
    setPrompts(shuffled);
    setCurrentIndex(0);
    setMyPrediction("");
    setIsFlipped(false);
    setHasPredicted(false);
    setShowReveals(false);
    setMatchCount(0);
    startGame({ 
      prompts: shuffled.map(p => p.id),
      predictions: {},
    });
  };

  const handlePredict = () => {
    if (!user || !gameSession || !myPrediction.trim()) return;

    setHasPredicted(true);
    const currentPrompt = prompts[currentIndex];
    const predictions = (localGameState.predictions as Record<string, Record<string, string>>) || {};

    const promptPredictions = predictions[currentPrompt.id] || {};
    const newPredictions = {
      ...predictions,
      [currentPrompt.id]: {
        ...promptPredictions,
        [user.id]: myPrediction.trim(),
      },
    };

    updateGameState({ predictions: newPredictions });
  };

  const handleReveal = () => {
    setShowReveals(true);
  };

  const handleNext = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMyPrediction("");
      setIsFlipped(false);
      setHasPredicted(false);
      setShowReveals(false);
    } else {
      // Game finished
      saveGameResult({
        matches: matchCount,
        total_questions: prompts.length,
        details: { predictionsAligned: matchCount },
      });
    }
  };

  // Sync with game session
  useEffect(() => {
    if (gameSession && localGameState.prompts) {
      const promptIds = localGameState.prompts as string[];
      const sessionPrompts = promptIds
        .map(id => predictionPrompts.find(p => p.id === id))
        .filter(Boolean) as typeof predictionPrompts;
      setPrompts(sessionPrompts);
    }
  }, [gameSession, localGameState.prompts]);

  const currentPrompt = prompts[currentIndex];
  const progress = prompts.length > 0 ? ((currentIndex + 1) / prompts.length) * 100 : 0;
  const predictions = (localGameState.predictions as Record<string, Record<string, string>>) || {};
  const partnerPrediction = currentPrompt ? Object.entries(predictions[currentPrompt.id] || {}).find(
    ([id, _]) => id !== user?.id
  )?.[1] : undefined;
  const bothPredicted = hasPredicted && partnerPrediction !== undefined;

  return (
    <Card className="overflow-hidden border-indigo-200/50 dark:border-indigo-800/50">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            Predictions Game
          </CardTitle>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Remote Play
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Predict future scenarios and see how aligned your visions are!
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
              {!gameSession || currentIndex >= prompts.length ? (
                <div className="space-y-4">
                  {currentIndex >= prompts.length && prompts.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-xl"
                    >
                      <Wand2 className="w-12 h-12 mx-auto mb-4 text-indigo-500" />
                      <h3 className="text-xl font-bold mb-2">Visions Revealed! 🔮</h3>
                      <p className="text-muted-foreground">
                        You shared {prompts.length} predictions about your future together
                      </p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                        Keep dreaming together! ✨
                      </p>
                    </motion.div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={isStarting}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentIndex >= prompts.length ? "Play Again" : "Start Game"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Prediction {currentIndex + 1} of {prompts.length}</span>
                    <Badge className={categoryColors[currentPrompt?.category || "future"]}>
                      {currentPrompt?.category}
                    </Badge>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <GameCard
                    theme="adventure"
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(true)}
                    frontContent={
                      <div className="text-center">
                        <div className="text-4xl mb-4">🔮</div>
                        <p className="text-lg font-medium">Reveal your prediction</p>
                      </div>
                    }
                    backContent={
                      <div className="text-center p-4">
                        <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
                        <p className="text-lg font-medium leading-relaxed">
                          {currentPrompt?.prompt}
                        </p>
                      </div>
                    }
                  />

                  {isFlipped && !hasPredicted && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Write your prediction..."
                        value={myPrediction}
                        onChange={(e) => setMyPrediction(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        className="w-full"
                        onClick={handlePredict}
                        disabled={!myPrediction.trim()}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Lock In Prediction
                      </Button>
                    </div>
                  )}

                  {hasPredicted && !showReveals && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Your prediction is locked! 🔒
                        </p>
                        {!partnerPrediction && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Waiting for partner's prediction...
                          </p>
                        )}
                      </div>

                      {bothPredicted && (
                        <Button className="w-full" onClick={handleReveal}>
                          <Eye className="w-4 h-4 mr-2" />
                          Reveal Predictions
                        </Button>
                      )}
                    </motion.div>
                  )}

                  {showReveals && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">You predicted:</p>
                        <p className="text-sm italic">"{myPrediction}"</p>
                      </div>

                      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Partner predicted:</p>
                        <p className="text-sm italic">"{partnerPrediction}"</p>
                      </div>

                      <Button className="w-full" onClick={handleNext}>
                        {currentIndex < prompts.length - 1 ? "Next Prediction" : "See Summary"}
                      </Button>
                    </motion.div>
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

export default PredictionsGame;
