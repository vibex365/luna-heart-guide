import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartnerGift } from "@/hooks/useGiftStore";
import confetti from "canvas-confetti";
import { Sparkles, Heart, X } from "lucide-react";

interface GiftOpenDialogProps {
  gift: PartnerGift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkOpened?: (giftId: string) => void;
}

// Poems for each gift type/animation
const giftPoems: Record<string, { title: string; poem: string }> = {
  roses: {
    title: "A Rose for You",
    poem: `Like petals soft upon the breeze,
My love for you will never cease.
Each rose I send speaks from my heart,
A promise we shall never part.`
  },
  hearts: {
    title: "My Heart is Yours",
    poem: `A heart once lonely, now complete,
Since the moment our souls did meet.
In every beat, your name resides,
My love for you forever guides.`
  },
  chocolates: {
    title: "Sweet as You",
    poem: `Sweet as chocolate, warm and true,
Is every moment spent with you.
Life's richest treasure I have found,
When your love wrapped my heart around.`
  },
  stars: {
    title: "Written in the Stars",
    poem: `Among the stars, our love was written,
By fate and destiny, I am smitten.
Each twinkling light reminds me still,
You are my wish, my heart's one thrill.`
  },
  sparkle: {
    title: "You Make Me Sparkle",
    poem: `Like diamonds catching morning light,
You make my darkest days feel bright.
A treasure rare, beyond compare,
My sparkling love beyond repair.`
  },
  fireworks: {
    title: "Our Love Ignites",
    poem: `Like fireworks across the sky,
Our love lights up, reaching high.
With every burst of color bright,
I celebrate you day and night.`
  },
  default: {
    title: "With All My Love",
    poem: `This gift I send with love so true,
To show how much I cherish you.
In every thought, you're always there,
My love for you beyond compare.`
  }
};

export const GiftOpenDialog = ({ 
  gift, 
  open, 
  onOpenChange, 
  onMarkOpened 
}: GiftOpenDialogProps) => {
  const [isOpening, setIsOpening] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const animationType = gift?.digital_gifts?.animation_type || 'hearts';
  const poemData = giftPoems[animationType] || giftPoems.default;

  const triggerAnimation = useCallback(() => {
    const type = animationType;

    switch (type) {
      case 'roses':
        confetti({
          particleCount: 100,
          spread: 160,
          origin: { y: 0 },
          colors: ['#FF6B9D', '#FF1744', '#FF4081', '#E91E63'],
          shapes: ['circle'],
          gravity: 0.5,
          ticks: 300,
        });
        break;

      case 'hearts':
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#FF1744', '#FF4081'],
          shapes: ['circle'],
          scalar: 1.2,
        });
        break;

      case 'chocolates':
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B4513', '#D2691E', '#CD853F', '#F4A460'],
          shapes: ['square'],
        });
        break;

      case 'stars':
        const starDuration = 3000;
        const starEnd = Date.now() + starDuration;
        
        const starInterval = setInterval(() => {
          confetti({
            particleCount: 5,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() * 0.3 },
            colors: ['#FFD700', '#FFA500', '#FFFF00'],
            shapes: ['star'],
            scalar: 1.5,
          });
          
          if (Date.now() > starEnd) {
            clearInterval(starInterval);
          }
        }, 100);
        break;

      case 'sparkle':
        confetti({
          particleCount: 100,
          spread: 160,
          origin: { y: 0.5 },
          colors: ['#87CEEB', '#00BFFF', '#1E90FF', '#FFFFFF'],
          shapes: ['circle'],
          scalar: 0.8,
          ticks: 200,
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#E0FFFF', '#B0E0E6', '#FFFFFF'],
            scalar: 1.2,
          });
        }, 500);
        break;

      case 'fireworks':
        const fireworksDuration = 3000;
        const fireworksEnd = Date.now() + fireworksDuration;
        const fireworkColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

        const fireworkInterval = setInterval(() => {
          confetti({
            particleCount: 30,
            spread: 360,
            origin: { 
              x: 0.2 + Math.random() * 0.6,
              y: 0.3 + Math.random() * 0.3 
            },
            colors: fireworkColors.slice(0, 3),
            startVelocity: 30,
          });

          if (Date.now() > fireworksEnd) {
            clearInterval(fireworkInterval);
          }
        }, 300);
        break;

      default:
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
    }
  }, [animationType]);

  const handleOpen = () => {
    if (!gift) return;
    
    setIsOpening(true);
    triggerAnimation();
    
    setTimeout(() => {
      setShowContent(true);
      if (!gift.is_opened && onMarkOpened) {
        onMarkOpened(gift.id);
      }
    }, 800);
  };

  useEffect(() => {
    if (open) {
      setIsOpening(false);
      setShowContent(false);
    }
  }, [open, gift?.id]);

  if (!gift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 bg-gradient-to-br from-rose-950 via-purple-950 to-indigo-950 border-rose-500/30 overflow-hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <AnimatePresence mode="wait">
          {!isOpening && !showContent ? (
            // Wrapped gift state
            <motion.div
              key="wrapped"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="p-8 text-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [-2, 2, -2],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-8xl mb-6 cursor-pointer"
                onClick={handleOpen}
              >
                🎁
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                You received a gift!
              </h3>
              <p className="text-rose-200 text-sm mb-6">
                {gift.digital_gifts?.name}
              </p>
              
              <Button
                onClick={handleOpen}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Open Gift
              </Button>
            </motion.div>
          ) : isOpening && !showContent ? (
            // Opening animation
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center min-h-[300px] flex items-center justify-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 0],
                  rotate: [0, 360],
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-8xl"
              >
                🎁
              </motion.div>
            </motion.div>
          ) : (
            // Revealed gift with poem
            <motion.div
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-center"
            >
              {/* Gift icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                className="text-7xl mb-4"
              >
                {gift.digital_gifts?.icon || '🎁'}
              </motion.div>

              {/* Gift name */}
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white mb-1"
              >
                {gift.digital_gifts?.name}
              </motion.h3>

              {/* Poem title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 mb-3"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span className="text-rose-300 text-sm font-medium italic">
                  {poemData.title}
                </span>
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              </motion.div>

              {/* Poem */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4"
              >
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line italic">
                  {poemData.poem}
                </p>
              </motion.div>

              {/* Personal message */}
              {gift.message && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-rose-500/20 rounded-xl p-4 border border-rose-500/30"
                >
                  <p className="text-xs text-rose-300 mb-1">Personal message:</p>
                  <p className="text-white text-sm">"{gift.message}"</p>
                </motion.div>
              )}

              {/* Replay animation button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerAnimation}
                  className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Replay Animation
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};