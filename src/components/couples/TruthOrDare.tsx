import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const truths = [
  "What's one thing I do that always makes you smile?",
  "What was your first impression of me?",
  "What's your favorite memory of us together?",
  "What's something you've never told me but always wanted to?",
  "What do you think is my best quality?",
  "When did you first realize you loved me?",
  "What's one thing you wish we did more often?",
  "What's your favorite thing about our relationship?",
  "What's the most romantic thing I've ever done for you?",
  "What's something small I do that means a lot to you?",
  "What's your favorite way to spend time together?",
  "What's one thing you admire about me?",
  "What makes you feel most loved by me?",
  "What's your dream date with me?",
  "What song reminds you of us?",
];

const dares = [
  "Give your partner a 2-minute massage",
  "Write a short love poem for your partner right now",
  "Do your best impression of your partner",
  "Give your partner three genuine compliments",
  "Slow dance together for one song",
  "Give your partner a forehead kiss and tell them one reason you love them",
  "Look into each other's eyes for 60 seconds without laughing",
  "Plan a surprise date for next week right now",
  "Tell your partner your favorite physical feature of theirs",
  "Give your partner a big bear hug for 30 seconds",
  "Send your partner a sweet text message they can read later",
  "Recreate your first kiss",
  "Feed your partner a snack like they're royalty",
  "Tell your partner what you love about their laugh",
  "Hold hands and take a short walk together right now",
];

interface TruthOrDareProps {
  partnerLinkId?: string;
}

export const TruthOrDare = ({ partnerLinkId }: TruthOrDareProps) => {
  const [mode, setMode] = useState<"truth" | "dare" | null>(null);
  const [currentCard, setCurrentCard] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const getRandomCard = (type: "truth" | "dare") => {
    const cards = type === "truth" ? truths : dares;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  };

  const handleSelect = (type: "truth" | "dare") => {
    setMode(type);
    setCurrentCard(getRandomCard(type));
    setIsRevealed(true);
  };

  const handleNextCard = () => {
    if (mode) {
      setIsRevealed(false);
      setTimeout(() => {
        setCurrentCard(getRandomCard(mode));
        setIsRevealed(true);
      }, 300);
    }
  };

  const handleReset = () => {
    setMode(null);
    setCurrentCard(null);
    setIsRevealed(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-500/10 to-orange-500/10">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Truth or Dare
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground text-center">
                Choose your challenge!
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSelect("truth")}
                  variant="outline"
                  className="h-24 flex-col gap-2 border-2 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500"
                >
                  <Heart className="w-8 h-8 text-pink-500" />
                  <span className="font-semibold">Truth</span>
                </Button>
                <Button
                  onClick={() => handleSelect("dare")}
                  variant="outline"
                  className="h-24 flex-col gap-2 border-2 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500"
                >
                  <Sparkles className="w-8 h-8 text-orange-500" />
                  <span className="font-semibold">Dare</span>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: isRevealed ? 1 : 0, rotateY: isRevealed ? 0 : 90 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className="space-y-4"
            >
              <div
                className={cn(
                  "p-6 rounded-xl border-2 min-h-[120px] flex items-center justify-center text-center",
                  mode === "truth"
                    ? "bg-pink-500/10 border-pink-500/30"
                    : "bg-orange-500/10 border-orange-500/30"
                )}
              >
                <p className="text-lg font-medium">{currentCard}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleNextCard}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Next {mode === "truth" ? "Truth" : "Dare"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="gap-2"
                >
                  Switch
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
