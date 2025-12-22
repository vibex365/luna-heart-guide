import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Star, Heart, Sparkles } from "lucide-react";
import { GameCard } from "./cards/GameCard";
import { dateNightIdeas, DateNightCategory } from "@/data/newCardGamesContent";
import { useCouplesGame, GameType } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface DateNightRouletteProps {
  partnerLinkId: string | undefined;
}

const GAME_TYPE: GameType = "date_night_roulette" as GameType;

const categories: { key: DateNightCategory; label: string; emoji: string }[] = [
  { key: "adventure", label: "Adventure", emoji: "🏔️" },
  { key: "romantic", label: "Romantic", emoji: "💕" },
  { key: "budget", label: "Budget-Friendly", emoji: "💰" },
  { key: "creative", label: "Creative", emoji: "🎨" },
];

type DateIdea = { id: string; title: string; description: string };

export const DateNightRoulette = ({ partnerLinkId }: DateNightRouletteProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DateNightCategory | "all">("all");
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topMatches, setTopMatches] = useState<DateIdea[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);

  const {
    gameSession,
    localGameState,
    startGame,
    updateGameState,
    saveGameResult,
    isStarting,
  } = useCouplesGame(partnerLinkId, GAME_TYPE);

  const getAllIdeas = (category: DateNightCategory | "all"): DateIdea[] => {
    if (category === "all") {
      return Object.values(dateNightIdeas).flat();
    }
    return dateNightIdeas[category];
  };

  const handleStartGame = () => {
    const allIdeas = getAllIdeas(selectedCategory);
    const shuffled = [...allIdeas].sort(() => Math.random() - 0.5).slice(0, 8);
    setIdeas(shuffled);
    setCurrentIndex(0);
    setTopMatches([]);
    setIsFlipped(false);
    setMyRating(null);
    startGame({ 
      ideas: shuffled.map(i => i.id),
      ratings: {},
      category: selectedCategory,
    });
  };

  const handleRate = (rating: number) => {
    if (!user || !gameSession || myRating !== null) return;

    setMyRating(rating);
    const currentIdea = ideas[currentIndex];
    const ratings = (localGameState.ratings as Record<string, Record<string, number>>) || {};

    const ideaRatings = ratings[currentIdea.id] || {};
    const newIdeaRatings = { ...ideaRatings, [user.id]: rating };
    const newRatings = { ...ratings, [currentIdea.id]: newIdeaRatings };

    // Check for high mutual rating
    const partnerRating = Object.entries(newIdeaRatings).find(([id, _]) => id !== user.id)?.[1];
    if (partnerRating !== undefined && rating >= 4 && partnerRating >= 4) {
      setTopMatches(prev => [...prev, currentIdea]);
    }

    updateGameState({ ratings: newRatings });

    // Move to next after short delay
    setTimeout(() => {
      if (currentIndex < ideas.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setMyRating(null);
      } else {
        // Game finished
        saveGameResult({
          matches: topMatches.length + (partnerRating !== undefined && rating >= 4 && partnerRating >= 4 ? 1 : 0),
          total_questions: ideas.length,
          details: { 
            category: selectedCategory,
            topMatches: [...topMatches, ...(partnerRating !== undefined && rating >= 4 && partnerRating >= 4 ? [currentIdea] : [])].map(i => i.id),
          },
        });
      }
    }, 1000);
  };

  // Sync with game session
  useEffect(() => {
    if (gameSession && localGameState.ideas) {
      const ideaIds = localGameState.ideas as string[];
      const allIdeas = Object.values(dateNightIdeas).flat();
      const sessionIdeas = ideaIds.map(id => allIdeas.find(i => i.id === id)).filter(Boolean) as DateIdea[];
      setIdeas(sessionIdeas);
    }
  }, [gameSession, localGameState.ideas]);

  const currentIdea = ideas[currentIndex];
  const progress = ideas.length > 0 ? ((currentIndex + 1) / ideas.length) * 100 : 0;
  const ratings = (localGameState.ratings as Record<string, Record<string, number>>) || {};
  const partnerRating = currentIdea ? Object.entries(ratings[currentIdea.id] || {}).find(
    ([id, _]) => id !== user?.id
  )?.[1] : undefined;

  return (
    <Card className="overflow-hidden border-purple-200/50 dark:border-purple-800/50">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            Date Night Roulette
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            Remote Play
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Rate date ideas - matches become your bucket list!
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
              {!gameSession || currentIndex >= ideas.length ? (
                <div className="space-y-4">
                  {currentIndex >= ideas.length && ideas.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl"
                    >
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                      <h3 className="text-xl font-bold mb-2">Your Date Bucket List!</h3>
                      {topMatches.length > 0 ? (
                        <div className="space-y-2">
                          {topMatches.map((idea) => (
                            <div key={idea.id} className="p-3 bg-background rounded-lg flex items-center gap-2">
                              <Heart className="w-4 h-4 text-pink-500" />
                              <span className="font-medium">{idea.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No mutual 4+ star matches this round. Try again!
                        </p>
                      )}
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
                    {currentIndex >= ideas.length ? "Play Again" : "Start Game"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Idea {currentIndex + 1} of {ideas.length}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Matches: {topMatches.length}
                    </span>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <GameCard
                    theme="romance"
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(true)}
                    frontContent={
                      <div className="text-center">
                        <div className="text-4xl mb-4">🎲</div>
                        <p className="text-lg font-medium">Tap to reveal date idea</p>
                      </div>
                    }
                    backContent={
                      <div className="text-center p-4">
                        <h3 className="text-xl font-bold mb-2">{currentIdea?.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {currentIdea?.description}
                        </p>
                        {partnerRating !== undefined && (
                          <div className="mt-4 p-2 bg-background/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Partner rated: {partnerRating} ⭐
                            </p>
                          </div>
                        )}
                      </div>
                    }
                  />

                  {isFlipped && myRating === null && (
                    <div className="space-y-2">
                      <p className="text-sm text-center text-muted-foreground">Rate this date idea:</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="outline"
                            size="lg"
                            className="p-3"
                            onClick={() => handleRate(rating)}
                          >
                            <Star className={`w-6 h-6 ${rating <= (myRating || 0) ? "fill-amber-400 text-amber-400" : ""}`} />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {myRating !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 bg-muted/50 rounded-lg"
                    >
                      <p className="text-sm text-muted-foreground">
                        You rated: {myRating} ⭐
                      </p>
                      {partnerRating === undefined && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Waiting for partner's rating...
                        </p>
                      )}
                      {partnerRating !== undefined && myRating >= 4 && partnerRating >= 4 && (
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-600 dark:text-green-400 font-medium mt-2"
                        >
                          🎉 It's a match! Added to bucket list!
                        </motion.p>
                      )}
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

export default DateNightRoulette;
