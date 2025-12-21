import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, ArrowRight, RotateCcw, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "./cards/GameCard";

interface FantasyCardsProps {
  partnerLinkId?: string;
}

type FantasyCategory = "getaway" | "adventure" | "intimate" | "future";

interface FantasyCard {
  text: string;
  category: FantasyCategory;
}

const fantasyCards: FantasyCard[] = [
  // Romantic Getaways
  { text: "A cozy cabin in the mountains with a fireplace and no phone service", category: "getaway" },
  { text: "A beachside villa where you wake up to the sound of waves", category: "getaway" },
  { text: "A European city tour, exploring hidden cafés and museums together", category: "getaway" },
  { text: "A road trip with no set destination, just you two and the open road", category: "getaway" },
  { text: "A luxury treehouse hotel in a tropical rainforest", category: "getaway" },
  { text: "A wine country retreat with vineyard tours and sunset dinners", category: "getaway" },
  
  // Adventures
  { text: "Swimming with dolphins in crystal clear water together", category: "adventure" },
  { text: "Taking a hot air balloon ride at sunrise", category: "adventure" },
  { text: "Learning to scuba dive and exploring coral reefs together", category: "adventure" },
  { text: "Going on a safari and watching wildlife in their natural habitat", category: "adventure" },
  { text: "Hiking to a hidden waterfall and swimming in it together", category: "adventure" },
  { text: "Taking a cooking class in Italy and making pasta from scratch", category: "adventure" },
  
  // Intimate Moments
  { text: "A surprise romantic dinner set up at home with candles everywhere", category: "intimate" },
  { text: "A couples spa day with massages and relaxation", category: "intimate" },
  { text: "Dancing slowly in the living room to your favorite song", category: "intimate" },
  { text: "Staying in bed all day, just talking and being together", category: "intimate" },
  { text: "A picnic under the stars with wine and cheese", category: "intimate" },
  { text: "Re-creating your first date with all the original details", category: "intimate" },
  
  // Future Dreams
  { text: "Growing old together and still holding hands", category: "future" },
  { text: "Building your dream home together from scratch", category: "future" },
  { text: "Traveling to every continent together before you're 50", category: "future" },
  { text: "Starting a small business or passion project together", category: "future" },
  { text: "Having a big family dinner table with kids and grandkids", category: "future" },
  { text: "Retiring to a place you've always dreamed about", category: "future" },
];

const categoryStyles: Record<FantasyCategory, { label: string; color: string; icon: string }> = {
  getaway: { label: "Romantic Getaway", color: "from-pink-500 to-rose-500", icon: "🏖️" },
  adventure: { label: "Adventure", color: "from-violet-500 to-indigo-500", icon: "🌟" },
  intimate: { label: "Intimate Moment", color: "from-rose-500 to-red-500", icon: "💕" },
  future: { label: "Future Dream", color: "from-amber-500 to-orange-500", icon: "✨" },
};

export const FantasyCards = ({ partnerLinkId }: FantasyCardsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<FantasyCard | null>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [showRating, setShowRating] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [matchedFantasies, setMatchedFantasies] = useState(0);

  const drawCard = useCallback(() => {
    const availableCards = fantasyCards.filter(c => !usedCards.has(c.text));

    let selectedCard: FantasyCard;
    if (availableCards.length === 0) {
      setUsedCards(new Set());
      selectedCard = fantasyCards[Math.floor(Math.random() * fantasyCards.length)];
    } else {
      selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setUsedCards(prev => new Set([...prev, selectedCard.text]));
    }

    setCurrentCard(selectedCard);
    setIsCardFlipped(false);
    setShowRating(false);
    setRatings({ player1: 0, player2: 0 });
    setCardCount(prev => prev + 1);
  }, [usedCards]);

  const startGame = () => {
    setIsPlaying(true);
    setUsedCards(new Set());
    setCardCount(0);
    setMatchedFantasies(0);
    drawCard();
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentCard(null);
    setUsedCards(new Set());
    setCardCount(0);
    setMatchedFantasies(0);
    setShowRating(false);
    setIsCardFlipped(false);
  };

  const handleRating = (player: "player1" | "player2", rating: number) => {
    setRatings(prev => ({ ...prev, [player]: rating }));
  };

  const confirmRatings = () => {
    if (ratings.player1 > 0 && ratings.player2 > 0) {
      // Check if both rated 4 or 5 stars
      if (ratings.player1 >= 4 && ratings.player2 >= 4) {
        setMatchedFantasies(prev => prev + 1);
      }
      drawCard();
    }
  };

  const handleCardFlip = () => {
    setIsCardFlipped(true);
    setShowRating(true);
  };

  return (
    <Card className="overflow-hidden border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Fantasy Cards
          </CardTitle>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4">
              {!isPlaying ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Rate romantic scenarios together and discover shared fantasies!
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(categoryStyles).map(([key, style]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg bg-gradient-to-r ${style.color} bg-opacity-10 text-center`}
                      >
                        <span className="text-xl">{style.icon}</span>
                        <p className="text-xs font-medium mt-1">{style.label}</p>
                      </div>
                    ))}
                  </div>

                  <Button onClick={startGame} className="w-full bg-gradient-to-r from-violet-500 to-pink-500">
                    Start Fantasy Cards
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Game header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                        Card {cardCount}
                      </Badge>
                      {matchedFantasies > 0 && (
                        <Badge variant="outline" className="border-pink-500 text-pink-500">
                          <Heart className="w-3 h-3 mr-1 fill-current" />
                          {matchedFantasies} Matched!
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetGame}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      End
                    </Button>
                  </div>

                  {/* Current card */}
                  {currentCard && (
                    <div className="flex justify-center">
                      <div className="w-64">
                        <GameCard
                          theme="adventure"
                          isFlipped={isCardFlipped}
                          onFlip={handleCardFlip}
                          showFlipHint={!isCardFlipped}
                          category={categoryStyles[currentCard.category].label}
                          frontContent={
                            <div className="text-center p-4">
                              <span className="text-3xl mb-3 block">
                                {categoryStyles[currentCard.category].icon}
                              </span>
                              <p className="text-lg font-medium text-foreground leading-relaxed">
                                {currentCard.text}
                              </p>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Rating section */}
                  {showRating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-center text-sm text-muted-foreground">
                        Both partners: Rate this fantasy!
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Player 1 rating */}
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <p className="text-xs text-center mb-2 text-muted-foreground">You</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRating("player1", star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= ratings.player1
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Player 2 rating */}
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs text-center mb-2 text-muted-foreground">Partner</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRating("player2", star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= ratings.player2
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={confirmRatings}
                        disabled={ratings.player1 === 0 || ratings.player2 === 0}
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500"
                      >
                        {ratings.player1 > 0 && ratings.player2 > 0 ? (
                          ratings.player1 >= 4 && ratings.player2 >= 4 ? (
                            <>
                              <Heart className="w-4 h-4 mr-2 fill-current" />
                              It's a Match! Next Card
                            </>
                          ) : (
                            "Next Card"
                          )
                        ) : (
                          "Both rate to continue"
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default FantasyCards;
