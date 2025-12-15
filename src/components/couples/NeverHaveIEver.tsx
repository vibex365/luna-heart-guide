import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Shuffle, SkipForward, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statements = [
  "Never have I ever sent a love letter",
  "Never have I ever planned a surprise date",
  "Never have I ever cried during a movie with my partner",
  "Never have I ever forgotten an anniversary or special date",
  "Never have I ever pretended to like a gift I didn't",
  "Never have I ever stalked my partner on social media before we dated",
  "Never have I ever written a love poem",
  "Never have I ever had a dream about my partner",
  "Never have I ever sung a love song to someone",
  "Never have I ever given flowers for no reason",
  "Never have I ever stayed up all night talking with my partner",
  "Never have I ever cooked a romantic dinner",
  "Never have I ever made up a silly nickname for my partner",
  "Never have I ever danced in the rain with someone",
  "Never have I ever watched the sunrise or sunset together",
  "Never have I ever taken a spontaneous trip together",
  "Never have I ever shared food from my plate",
  "Never have I ever embarrassed myself trying to impress my partner",
  "Never have I ever pretended not to see their text to seem less eager",
  "Never have I ever practiced saying 'I love you' in the mirror",
];

interface NeverHaveIEverProps {
  partnerLinkId?: string;
}

export const NeverHaveIEver = ({ partnerLinkId }: NeverHaveIEverProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [yourAnswer, setYourAnswer] = useState<boolean | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<boolean | null>(null);
  const [showBoth, setShowBoth] = useState(false);

  const getNextStatement = () => {
    const available = statements.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (available.length === 0) {
      setUsedIndices([]);
      return Math.floor(Math.random() * statements.length);
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleAnswer = (isYou: boolean, answer: boolean) => {
    if (isYou) {
      setYourAnswer(answer);
    } else {
      setPartnerAnswer(answer);
    }
  };

  const handleReveal = () => {
    setShowBoth(true);
  };

  const handleNext = () => {
    const nextIndex = getNextStatement();
    setUsedIndices([...usedIndices, currentIndex]);
    setCurrentIndex(nextIndex);
    setYourAnswer(null);
    setPartnerAnswer(null);
    setShowBoth(false);
  };

  const handleShuffle = () => {
    setUsedIndices([]);
    setCurrentIndex(Math.floor(Math.random() * statements.length));
    setYourAnswer(null);
    setPartnerAnswer(null);
    setShowBoth(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hand className="w-5 h-5 text-indigo-500" />
            Never Have I Ever
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleShuffle}>
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Statement Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-pink-500/10 border border-indigo-500/20 text-center">
              <p className="text-lg font-medium">{statements[currentIndex]}</p>
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {/* You */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">You</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnswer(true, true)}
                    disabled={yourAnswer !== null}
                    className={cn(
                      "flex-1",
                      yourAnswer === true && "border-green-500 bg-green-500/10"
                    )}
                  >
                    I have ✋
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnswer(true, false)}
                    disabled={yourAnswer !== null}
                    className={cn(
                      "flex-1",
                      yourAnswer === false && "border-muted bg-muted"
                    )}
                  >
                    Never
                  </Button>
                </div>
              </div>

              {/* Partner */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Partner</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnswer(false, true)}
                    disabled={partnerAnswer !== null}
                    className={cn(
                      "flex-1",
                      partnerAnswer === true && "border-green-500 bg-green-500/10"
                    )}
                  >
                    They have ✋
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnswer(false, false)}
                    disabled={partnerAnswer !== null}
                    className={cn(
                      "flex-1",
                      partnerAnswer === false && "border-muted bg-muted"
                    )}
                  >
                    Never
                  </Button>
                </div>
              </div>
            </div>

            {/* Result */}
            {yourAnswer !== null && partnerAnswer !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-muted/50 text-center"
              >
                {yourAnswer === partnerAnswer ? (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <Heart className="w-5 h-5 fill-current" />
                    <span className="font-medium">You're in sync!</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <span>Different experiences - time to share stories! 📖</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Next Button */}
            <Button onClick={handleNext} className="w-full gap-2">
              <SkipForward className="w-4 h-4" />
              Next Statement
            </Button>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
