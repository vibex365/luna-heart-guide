import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartnerGift } from "@/hooks/useGiftStore";
import confetti from "canvas-confetti";

interface GiftAnimationProps {
  gift: PartnerGift;
  onComplete: () => void;
}

export const GiftAnimation = ({ gift, onComplete }: GiftAnimationProps) => {
  const [showMessage, setShowMessage] = useState(false);

  const triggerAnimation = useCallback(() => {
    const animationType = gift.digital_gifts?.animation_type || 'hearts';

    switch (animationType) {
      case 'roses':
        // Rose petals falling
        const roseColors = ['#FF6B9D', '#FF1744', '#FF4081', '#E91E63'];
        confetti({
          particleCount: 100,
          spread: 160,
          origin: { y: 0 },
          colors: roseColors,
          shapes: ['circle'],
          gravity: 0.5,
          ticks: 300,
        });
        break;

      case 'hearts':
        // Hearts explosion
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
        // Warm brown/amber colors
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B4513', '#D2691E', '#CD853F', '#F4A460'],
          shapes: ['square'],
        });
        break;

      case 'stars':
        // Star shower
        const duration = 3000;
        const end = Date.now() + duration;
        
        const starInterval = setInterval(() => {
          confetti({
            particleCount: 5,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() * 0.3 },
            colors: ['#FFD700', '#FFA500', '#FFFF00'],
            shapes: ['star'],
            scalar: 1.5,
          });
          
          if (Date.now() > end) {
            clearInterval(starInterval);
          }
        }, 100);
        break;

      case 'sparkle':
        // Diamond sparkle
        confetti({
          particleCount: 100,
          spread: 160,
          origin: { y: 0.5 },
          colors: ['#87CEEB', '#00BFFF', '#1E90FF', '#FFFFFF'],
          shapes: ['circle'],
          scalar: 0.8,
          ticks: 200,
        });
        // Second wave
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
        // Fireworks display
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
  }, [gift]);

  useEffect(() => {
    triggerAnimation();
    
    // Show message after animation starts
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
    }, 500);

    // Auto-close after animation
    const closeTimer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(closeTimer);
    };
  }, [triggerAnimation, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gift Icon */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl mb-6"
          >
            {gift.digital_gifts?.icon || '🎁'}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            You received a gift!
          </motion.h2>

          {/* Gift name */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-rose-300 font-medium"
          >
            {gift.digital_gifts?.name}
          </motion.p>

          {/* Personal message */}
          <AnimatePresence>
            {showMessage && gift.message && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20"
              >
                <p className="text-white/90 italic">"{gift.message}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap to close */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-white/50 text-sm"
          >
            Tap anywhere to close
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
