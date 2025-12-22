import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Play, RotateCcw, Users, Check, X } from "lucide-react";
import { GameCard } from "./cards/GameCard";
import { dealBreakersCards, DealBreakersCategory } from "@/data/newCardGamesContent";
import { useCouplesGame, GameType } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface DealBreakersProps {
  partnerLinkId: string | undefined;
}

const GAME_TYPE: GameType = "deal_breakers" as GameType;

const categories: { key: DealBreakersCategory; label: string; emoji: string }[] = [
  { key: "habits", label: "Habits", emoji: "🔄" },
  { key: "values", label: "Values", emoji: "💎" },
  { key: "lifestyle", label: "Lifestyle", emoji: "🏠" },
  { key: "quirks", label: "Quirks", emoji: "🤪" },
];

export const DealBreakers = ({ partnerLinkId }: DealBreakersProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DealBreakersCategory | "all">("all");
  const [cards, setCards] = useState<{ id: string; text: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    gameSession,
    localGameState,
    startGame,
    updateGameState,
    saveGameResult,
    isStarting,
  } = useCouplesGame(partnerLinkId, GAME_TYPE);

  // Get all cards based on category
  const getAllCards = (category: DealBreakersCategory | "all") => {
    if (category === "all") {
      return Object.values(dealBreakersCards).flat();
    }
    return dealBreakersCards[category];
  };

  // Start new game
  const handleStartGame = () => {
    const allCards = getAllCards(selectedCategory);
    const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, 10);
    setCards(shuffled);
    setCurrentIndex(0);
    setMatches(0);
    setIsFlipped(false);
    startGame({ 
      cards: shuffled.map(c => c.id),
      responses: {},
      category: selectedCategory,
    });
  };

  // Handle swipe/vote
  const handleVote = (acceptable: boolean) => {
    if (!user || !gameSession) return;

    const currentCard = cards[currentIndex];
    const userKey = `${user.id}_${currentCard.id}`;
    const responses = (localGameState.responses as Record<string, boolean>) || {};
    const newResponses = { ...responses, [userKey]: acceptable };

    // Check if partner has already voted
    const partnerKey = Object.keys(newResponses).find(
      key => key.endsWith(`_${currentCard.id}`) && !key.startsWith(user.id)
    );

    let newMatches = matches;
    if (partnerKey && newResponses[partnerKey] === acceptable) {
      newMatches++;
      setMatches(newMatches);
    }

    updateGameState({ responses: newResponses });

    // Move to next card after a short delay
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Game finished
        saveGameResult({
          matches: newMatches,
          total_questions: cards.length,
          score: Math.round((newMatches / cards.length) * 100),
          details: { category: selectedCategory },
        });
      }
    }, 500);
  };

  // Sync with game session
  useEffect(() => {
    if (gameSession && localGameState.cards) {
      const cardIds = localGameState.cards as string[];
      const allCards = Object.values(dealBreakersCards).flat();
      const sessionCards = cardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean) as typeof cards;
      setCards(sessionCards);
    }
  }, [gameSession, localGameState.cards]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const responses = (localGameState.responses as Record<string, boolean>) || {};
  const myResponse = user ? responses[`${user.id}_${currentCard?.id}`] : undefined;
  const partnerResponse = currentCard ? Object.entries(responses).find(
    ([key, _]) => key.endsWith(`_${currentCard.id}`) && !key.startsWith(user?.id || "")
  )?.[1] : undefined;

  return (
    <Card className="overflow-hidden border-rose-200/50 dark:border-rose-800/50">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            Deal Breakers
          </CardTitle>
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            Remote Play
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Swipe on scenarios - see if you and your partner agree on what's acceptable!
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
              {!gameSession || currentIndex >= cards.length ? (
                <div className="space-y-4">
                  {currentIndex >= cards.length && cards.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 rounded-xl"
                    >
                      <div className="text-4xl mb-2">🎉</div>
                      <h3 className="text-xl font-bold mb-2">Game Complete!</h3>
                      <p className="text-muted-foreground">
                        You matched on {matches} out of {cards.length} scenarios
                      </p>
                      <div className="text-3xl font-bold text-rose-500 mt-2">
                        {Math.round((matches / cards.length) * 100)}% Match
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Category:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        onClick={() => setSelectedCategory("all")}
                      >
                        🎲 All
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.key}
                          size="sm"
                          variant={selectedCategory === cat.key ? "default" : "outline"}
                          onClick={() => setSelectedCategory(cat.key)}
                        >
                          {cat.emoji} {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={isStarting}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentIndex >= cards.length ? "Play Again" : "Start Game"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Card {currentIndex + 1} of {cards.length}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Matches: {matches}
                    </span>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <GameCard
                    theme="romance"
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(true)}
                    frontContent={
                      <div className="text-center">
                        <div className="text-4xl mb-4">🤔</div>
                        <p className="text-lg font-medium">Tap to reveal</p>
                      </div>
                    }
                    backContent={
                      <div className="text-center p-4">
                        <p className="text-lg font-medium leading-relaxed">
                          {currentCard?.text}
                        </p>
                        {partnerResponse !== undefined && (
                          <div className="mt-4 p-2 bg-background/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Partner voted: {partnerResponse ? "Acceptable ✓" : "Deal Breaker ✗"}
                            </p>
                          </div>
                        )}
                      </div>
                    }
                  />

                  {isFlipped && myResponse === undefined && (
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                        onClick={() => handleVote(false)}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Deal Breaker
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                        onClick={() => handleVote(true)}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Acceptable
                      </Button>
                    </div>
                  )}

                  {myResponse !== undefined && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        You voted: {myResponse ? "Acceptable ✓" : "Deal Breaker ✗"}
                      </p>
                      {partnerResponse === undefined && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Waiting for partner...
                        </p>
                      )}
                    </div>
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

export default DealBreakers;
