import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wine, Beer, Flame, ArrowRight, RotateCcw, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GameCard } from "./cards/GameCard";
import { useAgeGateEnabled } from "@/hooks/useGameQuestions";
import { AgeGateModal } from "./AgeGateModal";
import {
  DrinkingPrompt,
  getPromptsByCategory,
  drinkIfPrompts,
  sipOrSkipPrompts,
  neverHaveIEverDrinking,
  truthOrDrinkPrompts,
} from "@/data/drinkingGameContent";

interface DrinkingGameProps {
  partnerLinkId?: string;
}

type GameMode = "drink_if" | "sip_or_skip" | "never_have_i_ever" | "truth_or_drink";

const gameModes: { id: GameMode; name: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: "drink_if", 
    name: "Drink If...", 
    icon: <Beer className="w-5 h-5" />, 
    description: "Drink if the statement applies to you" 
  },
  { 
    id: "sip_or_skip", 
    name: "Sip or Skip", 
    icon: <Wine className="w-5 h-5" />, 
    description: "Answer honestly or take a sip" 
  },
  { 
    id: "never_have_i_ever", 
    name: "Never Have I Ever", 
    icon: <Users className="w-5 h-5" />, 
    description: "Drink if you've done it" 
  },
  { 
    id: "truth_or_drink", 
    name: "Truth or Drink", 
    icon: <Flame className="w-5 h-5" />, 
    description: "Tell the truth or take a drink" 
  },
];

export const DrinkingGame = ({ partnerLinkId }: DrinkingGameProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [spicyMode, setSpicyMode] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<DrinkingPrompt | null>(null);
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());
  const [drinkCounts, setDrinkCounts] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const { data: ageGateEnabled } = useAgeGateEnabled();

  const handleSpicyToggle = (checked: boolean) => {
    if (checked && ageGateEnabled && !ageVerified) {
      setShowAgeGate(true);
    } else {
      setSpicyMode(checked);
    }
  };

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    setSpicyMode(true);
    setShowAgeGate(false);
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setIsPlaying(true);
    setUsedPrompts(new Set());
    setDrinkCounts({ player1: 0, player2: 0 });
    drawNextCard(mode);
  };

  const drawNextCard = useCallback((mode?: GameMode) => {
    const currentMode = mode || gameMode;
    if (!currentMode) return;

    const prompts = getPromptsByCategory(currentMode, spicyMode);
    const availablePrompts = prompts.filter(p => !usedPrompts.has(p.text));

    if (availablePrompts.length === 0) {
      setUsedPrompts(new Set());
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
    } else {
      const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
      setCurrentPrompt(randomPrompt);
      setUsedPrompts(prev => new Set([...prev, randomPrompt.text]));
    }
    setIsCardFlipped(false);
  }, [gameMode, spicyMode, usedPrompts]);

  const addDrink = (player: "player1" | "player2") => {
    setDrinkCounts(prev => ({ ...prev, [player]: prev[player] + 1 }));
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameMode(null);
    setCurrentPrompt(null);
    setUsedPrompts(new Set());
    setDrinkCounts({ player1: 0, player2: 0 });
    setIsCardFlipped(false);
  };

  return (
    <>
      <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Wine className="w-5 h-5 text-white" />
              </div>
              Couples Drinking Game
              <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-500">
                21+
              </Badge>
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
                {/* Responsible drinking warning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Please drink responsibly. Know your limits and always have a safe way home.
                  </p>
                </div>

                {!isPlaying ? (
                  <>
                    {/* Spicy mode toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Spicy Mode</span>
                      </div>
                      <Switch checked={spicyMode} onCheckedChange={handleSpicyToggle} />
                    </div>

                    {/* Game mode selection */}
                    <div className="grid grid-cols-2 gap-3">
                      {gameModes.map((mode) => (
                        <motion.button
                          key={mode.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startGame(mode.id)}
                          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                              {mode.icon}
                            </div>
                          </div>
                          <h4 className="font-semibold text-sm">{mode.name}</h4>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Game header */}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        {gameModes.find(m => m.id === gameMode)?.name}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={resetGame}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        End Game
                      </Button>
                    </div>

                    {/* Drink counters */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => addDrink("player1")}
                        className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-center"
                      >
                        <p className="text-2xl font-bold text-pink-500">{drinkCounts.player1}</p>
                        <p className="text-xs text-muted-foreground">You took drinks</p>
                      </button>
                      <button
                        onClick={() => addDrink("player2")}
                        className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center"
                      >
                        <p className="text-2xl font-bold text-blue-500">{drinkCounts.player2}</p>
                        <p className="text-xs text-muted-foreground">Partner took drinks</p>
                      </button>
                    </div>

                    {/* Current card */}
                    {currentPrompt && (
                      <div className="flex justify-center">
                        <div className="w-64">
                          <GameCard
                            theme="drinking"
                            isFlipped={isCardFlipped}
                            onFlip={() => setIsCardFlipped(true)}
                            showFlipHint={!isCardFlipped}
                            category={gameMode === "drink_if" ? "Drink If..." : 
                                     gameMode === "sip_or_skip" ? "Sip or Skip" :
                                     gameMode === "never_have_i_ever" ? "Never Have I Ever" : "Truth or Drink"}
                            frontContent={
                              <div className="text-center p-4">
                                <p className="text-lg font-medium text-foreground leading-relaxed">
                                  {currentPrompt.text}
                                </p>
                                {currentPrompt.isSpicy && (
                                  <div className="flex items-center justify-center gap-1 mt-3">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span className="text-xs text-orange-500">Spicy</span>
                                  </div>
                                )}
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
                          onClick={() => drawNextCard()}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          Next Card
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

export default DrinkingGame;
