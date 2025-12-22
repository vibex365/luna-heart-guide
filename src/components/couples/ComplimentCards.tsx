import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, RotateCcw, Heart, Send, MessageCircleHeart } from "lucide-react";
import { GameCard } from "./cards/GameCard";
import { complimentPrompts } from "@/data/newCardGamesContent";
import { useCouplesGame, GameType } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface ComplimentCardsProps {
  partnerLinkId: string | undefined;
}

const GAME_TYPE: GameType = "compliment_cards" as GameType;

export const ComplimentCards = ({ partnerLinkId }: ComplimentCardsProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompts, setPrompts] = useState<typeof complimentPrompts>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myCompliment, setMyCompliment] = useState("");
  const [sentCompliments, setSentCompliments] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const {
    gameSession,
    localGameState,
    startGame,
    updateGameState,
    saveGameResult,
    isStarting,
  } = useCouplesGame(partnerLinkId, GAME_TYPE);

  const handleStartGame = () => {
    const shuffled = [...complimentPrompts].sort(() => Math.random() - 0.5).slice(0, 10);
    setPrompts(shuffled);
    setCurrentIndex(0);
    setMyCompliment("");
    setSentCompliments(0);
    setIsFlipped(false);
    setHasSent(false);
    startGame({ 
      prompts: shuffled.map(p => p.id),
      compliments: {},
    });
  };

  const handleSendCompliment = () => {
    if (!user || !gameSession || !myCompliment.trim()) return;

    setHasSent(true);
    const currentPrompt = prompts[currentIndex];
    const compliments = (localGameState.compliments as Record<string, Record<string, string>>) || {};

    const promptCompliments = compliments[currentPrompt.id] || {};
    const newCompliments = {
      ...compliments,
      [currentPrompt.id]: {
        ...promptCompliments,
        [user.id]: myCompliment.trim(),
      },
    };

    setSentCompliments(prev => prev + 1);
    updateGameState({ compliments: newCompliments });
  };

  const handleNext = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMyCompliment("");
      setIsFlipped(false);
      setHasSent(false);
    } else {
      // Game finished
      saveGameResult({
        score: sentCompliments,
        total_questions: prompts.length,
        details: { complimentsSent: sentCompliments },
      });
    }
  };

  // Sync with game session
  useEffect(() => {
    if (gameSession && localGameState.prompts) {
      const promptIds = localGameState.prompts as string[];
      const sessionPrompts = promptIds
        .map(id => complimentPrompts.find(p => p.id === id))
        .filter(Boolean) as typeof complimentPrompts;
      setPrompts(sessionPrompts);
    }
  }, [gameSession, localGameState.prompts]);

  const currentPrompt = prompts[currentIndex];
  const progress = prompts.length > 0 ? ((currentIndex + 1) / prompts.length) * 100 : 0;
  const compliments = (localGameState.compliments as Record<string, Record<string, string>>) || {};
  const partnerCompliment = currentPrompt ? Object.entries(compliments[currentPrompt.id] || {}).find(
    ([id, _]) => id !== user?.id
  )?.[1] : undefined;

  return (
    <Card className="overflow-hidden border-pink-200/50 dark:border-pink-800/50">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">💝</span>
            Compliment Cards
          </CardTitle>
          <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
            Remote Play
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Draw prompts and share heartfelt compliments with each other
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
                      className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl"
                    >
                      <MessageCircleHeart className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                      <h3 className="text-xl font-bold mb-2">Beautiful! 💕</h3>
                      <p className="text-muted-foreground">
                        You exchanged {sentCompliments} compliments this session
                      </p>
                      <p className="text-sm text-pink-600 dark:text-pink-400 mt-2">
                        Keep spreading love! ❤️
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
                    <span>Card {currentIndex + 1} of {prompts.length}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Sent: {sentCompliments}
                    </span>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <GameCard
                    theme="romance"
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(true)}
                    frontContent={
                      <div className="text-center">
                        <div className="text-4xl mb-4">💌</div>
                        <p className="text-lg font-medium">Draw a card</p>
                      </div>
                    }
                    backContent={
                      <div className="text-center p-4">
                        <div className="text-3xl mb-3">{currentPrompt?.emoji}</div>
                        <p className="text-lg font-medium leading-relaxed">
                          {currentPrompt?.prompt}
                        </p>
                      </div>
                    }
                  />

                  {isFlipped && !hasSent && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Write your heartfelt compliment..."
                        value={myCompliment}
                        onChange={(e) => setMyCompliment(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        className="w-full"
                        onClick={handleSendCompliment}
                        disabled={!myCompliment.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Compliment
                      </Button>
                    </div>
                  )}

                  {hasSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">You wrote:</p>
                        <p className="text-sm italic">"{myCompliment}"</p>
                      </div>

                      {partnerCompliment ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg"
                        >
                          <p className="text-sm text-muted-foreground mb-1">Partner wrote:</p>
                          <p className="text-sm italic">"{partnerCompliment}"</p>
                        </motion.div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">
                          Waiting for partner's compliment...
                        </p>
                      )}

                      <Button className="w-full" onClick={handleNext}>
                        {currentIndex < prompts.length - 1 ? "Next Card" : "Finish"}
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

export default ComplimentCards;
