import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, ArrowRight, RotateCcw, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "./cards/GameCard";
import { useAgeGateEnabled } from "@/hooks/useGameQuestions";
import { AgeGateModal } from "./AgeGateModal";

interface HotColdGameProps {
  partnerLinkId?: string;
}

type IntensityLevel = "cold" | "warm" | "hot" | "burning";

interface HotColdCard {
  text: string;
  type: "action" | "question";
  intensity: IntensityLevel;
}

const coldCards: HotColdCard[] = [
  { text: "Give your partner a genuine compliment about their personality", type: "action", intensity: "cold" },
  { text: "What's your favorite memory together?", type: "question", intensity: "cold" },
  { text: "Hold hands for the next 2 rounds", type: "action", intensity: "cold" },
  { text: "What made you first notice your partner?", type: "question", intensity: "cold" },
  { text: "Share a song that reminds you of your partner", type: "action", intensity: "cold" },
  { text: "What's something your partner does that always makes you smile?", type: "question", intensity: "cold" },
  { text: "Give your partner a forehead kiss", type: "action", intensity: "cold" },
  { text: "What's a dream you have for your future together?", type: "question", intensity: "cold" },
];

const warmCards: HotColdCard[] = [
  { text: "Whisper something sweet in your partner's ear", type: "action", intensity: "warm" },
  { text: "What's the most romantic thing your partner has done for you?", type: "question", intensity: "warm" },
  { text: "Give your partner a 30-second shoulder massage", type: "action", intensity: "warm" },
  { text: "Describe your ideal date night", type: "question", intensity: "warm" },
  { text: "Look into each other's eyes without speaking for 30 seconds", type: "action", intensity: "warm" },
  { text: "What's something new you'd like to try together?", type: "question", intensity: "warm" },
  { text: "Give your partner a slow, meaningful hug", type: "action", intensity: "warm" },
  { text: "What do you find most attractive about your partner?", type: "question", intensity: "warm" },
];

const hotCards: HotColdCard[] = [
  { text: "Give your partner a kiss that lasts at least 10 seconds", type: "action", intensity: "hot" },
  { text: "What's a fantasy you've never shared before?", type: "question", intensity: "hot" },
  { text: "Trace your finger slowly along your partner's arm", type: "action", intensity: "hot" },
  { text: "Where do you most like to be touched?", type: "question", intensity: "hot" },
  { text: "Give your partner a neck kiss", type: "action", intensity: "hot" },
  { text: "What's the most passionate moment we've shared?", type: "question", intensity: "hot" },
  { text: "Run your fingers through your partner's hair", type: "action", intensity: "hot" },
  { text: "What's something that instantly puts you in the mood?", type: "question", intensity: "hot" },
];

const burningCards: HotColdCard[] = [
  { text: "Describe in detail what you want to do to your partner later", type: "action", intensity: "burning" },
  { text: "What's your biggest intimate fantasy with your partner?", type: "question", intensity: "burning" },
  { text: "Kiss your partner's most sensitive spot (that's visible)", type: "action", intensity: "burning" },
  { text: "What's the boldest thing you want to try together?", type: "question", intensity: "burning" },
  { text: "Whisper your deepest desire to your partner", type: "action", intensity: "burning" },
  { text: "What drives you absolutely wild about your partner?", type: "question", intensity: "burning" },
  { text: "Show your partner exactly how you like to be kissed", type: "action", intensity: "burning" },
  { text: "Describe your perfect intimate evening together", type: "question", intensity: "burning" },
];

const intensityStyles: Record<IntensityLevel, { color: string; icon: React.ReactNode; label: string }> = {
  cold: { color: "from-blue-400 to-cyan-500", icon: <Snowflake className="w-4 h-4" />, label: "Cold" },
  warm: { color: "from-yellow-400 to-orange-400", icon: <Thermometer className="w-4 h-4" />, label: "Warm" },
  hot: { color: "from-orange-500 to-red-500", icon: <Flame className="w-4 h-4" />, label: "Hot" },
  burning: { color: "from-red-500 to-rose-600", icon: <Flame className="w-4 h-4" />, label: "🔥 Burning" },
};

export const HotColdGame = ({ partnerLinkId }: HotColdGameProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<HotColdCard | null>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>("warm");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const { data: ageGateEnabled } = useAgeGateEnabled();

  const handleIntensitySelect = (intensity: IntensityLevel) => {
    if ((intensity === "hot" || intensity === "burning") && ageGateEnabled && !ageVerified) {
      setSelectedIntensity(intensity);
      setShowAgeGate(true);
    } else {
      setSelectedIntensity(intensity);
      if (isPlaying) {
        drawCard(intensity);
      }
    }
  };

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    setShowAgeGate(false);
    if (isPlaying) {
      drawCard(selectedIntensity);
    }
  };

  const getAllCardsForIntensity = (intensity: IntensityLevel): HotColdCard[] => {
    switch (intensity) {
      case "cold": return coldCards;
      case "warm": return warmCards;
      case "hot": return hotCards;
      case "burning": return burningCards;
    }
  };

  const drawCard = useCallback((intensity?: IntensityLevel) => {
    const currentIntensity = intensity || selectedIntensity;
    const cards = getAllCardsForIntensity(currentIntensity);
    const availableCards = cards.filter(c => !usedCards.has(c.text));

    let selectedCard: HotColdCard;
    if (availableCards.length === 0) {
      setUsedCards(new Set());
      selectedCard = cards[Math.floor(Math.random() * cards.length)];
    } else {
      selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setUsedCards(prev => new Set([...prev, selectedCard.text]));
    }

    setCurrentCard(selectedCard);
    setIsCardFlipped(false);
    setRoundCount(prev => prev + 1);
  }, [selectedIntensity, usedCards]);

  const startGame = () => {
    setIsPlaying(true);
    setUsedCards(new Set());
    setRoundCount(0);
    drawCard();
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentCard(null);
    setUsedCards(new Set());
    setRoundCount(0);
    setIsCardFlipped(false);
  };

  return (
    <>
      <Card className="overflow-hidden border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-orange-500/5">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-orange-500 to-red-500 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              Hot & Cold Cards
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
                      Draw cards with varying intensity levels - from sweet to steamy!
                    </p>

                    {/* Intensity selector */}
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.entries(intensityStyles) as [IntensityLevel, typeof intensityStyles["cold"]][]).map(([level, style]) => (
                        <button
                          key={level}
                          onClick={() => handleIntensitySelect(level)}
                          className={`p-2 rounded-lg text-center transition-all ${
                            selectedIntensity === level
                              ? `bg-gradient-to-r ${style.color} text-white`
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex justify-center mb-1">{style.icon}</div>
                          <span className="text-xs font-medium">{style.label}</span>
                        </button>
                      ))}
                    </div>

                    <Button onClick={startGame} className="w-full bg-gradient-to-r from-pink-500 to-orange-500">
                      Start Drawing Cards
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Game header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`bg-gradient-to-r ${intensityStyles[selectedIntensity].color} text-white`}>
                          {intensityStyles[selectedIntensity].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Round {roundCount}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={resetGame}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        End
                      </Button>
                    </div>

                    {/* Intensity quick-switch */}
                    <div className="flex justify-center gap-1">
                      {(Object.entries(intensityStyles) as [IntensityLevel, typeof intensityStyles["cold"]][]).map(([level, style]) => (
                        <button
                          key={level}
                          onClick={() => handleIntensitySelect(level)}
                          className={`p-2 rounded-lg transition-all ${
                            selectedIntensity === level
                              ? `bg-gradient-to-r ${style.color} text-white`
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {style.icon}
                        </button>
                      ))}
                    </div>

                    {/* Current card */}
                    {currentCard && (
                      <div className="flex justify-center">
                        <div className="w-64">
                          <GameCard
                            theme={currentCard.intensity === "cold" ? "adventure" : 
                                   currentCard.intensity === "warm" ? "romance" :
                                   currentCard.intensity === "hot" ? "spicy" : "intimate"}
                            isFlipped={isCardFlipped}
                            onFlip={() => setIsCardFlipped(true)}
                            showFlipHint={!isCardFlipped}
                            category={currentCard.type === "action" ? "Action" : "Question"}
                            frontContent={
                              <div className="text-center p-4">
                                <Badge className={`mb-3 bg-gradient-to-r ${intensityStyles[currentCard.intensity].color} text-white`}>
                                  {intensityStyles[currentCard.intensity].icon}
                                  <span className="ml-1">{intensityStyles[currentCard.intensity].label}</span>
                                </Badge>
                                <p className="text-lg font-medium text-foreground leading-relaxed">
                                  {currentCard.text}
                                </p>
                              </div>
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Next card button */}
                    {isCardFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Button
                          onClick={() => drawCard()}
                          className={`w-full bg-gradient-to-r ${intensityStyles[selectedIntensity].color}`}
                        >
                          Draw Next Card
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

      <AgeGateModal
        open={showAgeGate}
        onCancel={() => setShowAgeGate(false)}
        onConfirm={handleAgeConfirm}
      />
    </>
  );
};

export default HotColdGame;
