import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import LunaAvatar from "@/components/LunaAvatar";

interface WelcomeAnimationProps {
  userName?: string;
  onComplete: () => void;
}

const WelcomeAnimation = ({ userName, onComplete }: WelcomeAnimationProps) => {
  const [phase, setPhase] = useState<"avatar" | "greeting" | "message">("avatar");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("greeting"), 800),
      setTimeout(() => setPhase("message"), 1800),
      setTimeout(() => onComplete(), 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const displayName = userName || "there";

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background px-8">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-accent/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 20,
            }}
            animate={{
              y: -20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Luna Avatar */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="relative mb-8"
      >
        <LunaAvatar size="xl" showGlow />
        
        {/* Sparkle effects */}
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Sparkles className="w-6 h-6 text-accent" />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-3"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>

      {/* Greeting text */}
      <AnimatePresence mode="wait">
        {phase === "greeting" && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Hi, {displayName}! 👋
            </h1>
          </motion.div>
        )}

        {phase === "message" && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.h1
              className="font-heading text-2xl font-bold text-foreground mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              I'm Luna 💜
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-base max-w-xs leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              I'm here to listen and support you on your emotional journey. Let's get started!
            </motion.p>

            {/* Animated dots */}
            <motion.div
              className="flex justify-center gap-1.5 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        className="absolute bottom-8 text-sm text-muted-foreground hover:text-accent transition-colors"
        onClick={onComplete}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Tap to continue
      </motion.button>
    </div>
  );
};

export default WelcomeAnimation;
