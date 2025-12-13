import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Heart, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Question {
  optionA: string;
  optionB: string;
  category: "romantic" | "fun" | "deep" | "adventure";
}

const questions: Question[] = [
  // Romantic
  { optionA: "Receive breakfast in bed every morning", optionB: "Get a love note every day", category: "romantic" },
  { optionA: "Have a surprise date night planned for you", optionB: "Plan the perfect date for your partner", category: "romantic" },
  { optionA: "Always hold hands in public", optionB: "Always get a goodbye kiss", category: "romantic" },
  { optionA: "Slow dance in the kitchen", optionB: "Watch the sunset together", category: "romantic" },
  
  // Fun
  { optionA: "Only communicate through song lyrics for a day", optionB: "Only communicate through movie quotes for a day", category: "fun" },
  { optionA: "Have a food fight", optionB: "Have a pillow fight", category: "fun" },
  { optionA: "Do karaoke together in public", optionB: "Take a dance class together", category: "fun" },
  { optionA: "Binge-watch your partner's favorite show", optionB: "Let your partner pick all meals for a week", category: "fun" },
  
  // Deep
  { optionA: "Know exactly what your partner is thinking", optionB: "Always know how to make them feel better", category: "deep" },
  { optionA: "Relive your first date", optionB: "Fast-forward to your 50th anniversary", category: "deep" },
  { optionA: "Never argue again", optionB: "Always resolve arguments within an hour", category: "deep" },
  { optionA: "Have your partner's full support in any career change", optionB: "Have your partner's full attention whenever you need to talk", category: "deep" },
  
  // Adventure
  { optionA: "Travel the world together for a year", optionB: "Build your dream home together", category: "adventure" },
  { optionA: "Go skydiving together", optionB: "Go scuba diving together", category: "adventure" },
  { optionA: "Live in a new country for a year", optionB: "Take a month-long road trip", category: "adventure" },
  { optionA: "Climb a mountain together", optionB: "Sail across an ocean together", category: "adventure" },
];

const categoryColors = {
  romantic: "text-pink-500",
  fun: "text-yellow-500",
  deep: "text-purple-500",
  adventure: "text-green-500",
};

export const WouldYouRather = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const [partnerSelected, setPartnerSelected] = useState<"A" | "B" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option: "A" | "B") => {
    setSelectedOption(option);
    // Simulate partner selection for demo (in real app, this would come from real-time sync)
    const partnerChoice = Math.random() > 0.5 ? "A" : "B";
    setPartnerSelected(partnerChoice);
    setShowResult(true);
    setTotalPlayed(prev => prev + 1);
    if (option === partnerChoice) {
      setMatchCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setPartnerSelected(null);
    setShowResult(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const shuffleQuestion = () => {
    setSelectedOption(null);
    setPartnerSelected(null);
    setShowResult(false);
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentIndex(randomIndex);
  };

  const isMatch = selectedOption === partnerSelected;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Would You Rather
          </CardTitle>
          {totalPlayed > 0 && (
            <span className="text-xs text-muted-foreground">
              {matchCount}/{totalPlayed} matches
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium capitalize ${categoryColors[currentQuestion.category]}`}>
                  {currentQuestion.category}
                </span>
                <Button variant="ghost" size="sm" onClick={shuffleQuestion} className="h-8">
                  <Shuffle className="w-4 h-4 mr-1" />
                  Shuffle
                </Button>
              </div>

              <p className="text-sm font-medium text-center text-muted-foreground">
                Would you rather...
              </p>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect("A")}
                  className="w-full p-4 text-left text-sm rounded-xl border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 transition-all"
                >
                  <span className="font-medium text-primary mr-2">A:</span>
                  {currentQuestion.optionA}
                </motion.button>

                <div className="text-center text-xs text-muted-foreground font-medium">OR</div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect("B")}
                  className="w-full p-4 text-left text-sm rounded-xl border-2 border-pink-500/20 bg-background hover:bg-pink-500/5 hover:border-pink-500/40 transition-all"
                >
                  <span className="font-medium text-pink-500 mr-2">B:</span>
                  {currentQuestion.optionB}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              {isMatch ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">You matched!</p>
                  <p className="text-sm text-muted-foreground">
                    You both chose: <span className="font-medium">{selectedOption === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="font-semibold">Different choices!</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>You chose: <span className="font-medium">{selectedOption === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span></p>
                    <p>Partner chose: <span className="font-medium">{partnerSelected === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Differences make relationships interesting!
                  </p>
                </motion.div>
              )}

              <Button onClick={nextQuestion} className="mt-4">
                Next Question
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};