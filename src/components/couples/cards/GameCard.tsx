import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameCardProps {
  frontContent: React.ReactNode;
  backContent?: React.ReactNode;
  category?: string;
  theme?: "romance" | "spicy" | "adventure" | "drinking" | "intimate";
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
  showFlipHint?: boolean;
}

const themeStyles = {
  romance: {
    gradient: "from-pink-500 via-rose-500 to-red-400",
    glow: "shadow-[0_0_30px_rgba(244,114,182,0.4)]",
    accent: "text-pink-300",
    border: "border-pink-500/30",
    backPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(244,114,182,0.15)_0%,transparent_70%)]",
  },
  spicy: {
    gradient: "from-orange-500 via-red-500 to-rose-600",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.4)]",
    accent: "text-orange-300",
    border: "border-orange-500/30",
    backPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15)_0%,transparent_70%)]",
  },
  adventure: {
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.4)]",
    accent: "text-violet-300",
    border: "border-violet-500/30",
    backPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15)_0%,transparent_70%)]",
  },
  drinking: {
    gradient: "from-amber-500 via-yellow-500 to-orange-400",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.4)]",
    accent: "text-amber-300",
    border: "border-amber-500/30",
    backPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.15)_0%,transparent_70%)]",
  },
  intimate: {
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    glow: "shadow-[0_0_30px_rgba(217,70,239,0.4)]",
    accent: "text-fuchsia-300",
    border: "border-fuchsia-500/30",
    backPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(217,70,239,0.15)_0%,transparent_70%)]",
  },
};

export const GameCard = ({
  frontContent,
  backContent,
  category,
  theme = "romance",
  isFlipped = false,
  onFlip,
  className,
  showFlipHint = false,
}: GameCardProps) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = isFlipped !== undefined ? isFlipped : internalFlipped;
  const styles = themeStyles[theme];

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-[3/4] cursor-pointer perspective-1000",
        className
      )}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Card Back */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden",
            styles.glow,
            styles.border,
            "border-2 backface-hidden"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br", styles.gradient)} />
          <div className={cn("absolute inset-0", styles.backPattern)} />
          
          {/* Decorative pattern */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-xl" />
          <div className="absolute inset-8 border border-white/10 rounded-lg" />
          
          {/* Center emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-4xl">
                  {theme === "romance" && "💕"}
                  {theme === "spicy" && "🔥"}
                  {theme === "adventure" && "✨"}
                  {theme === "drinking" && "🍷"}
                  {theme === "intimate" && "💋"}
                </span>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 text-white/30 text-2xl">♡</div>
          <div className="absolute top-3 right-3 text-white/30 text-2xl">♡</div>
          <div className="absolute bottom-3 left-3 text-white/30 text-2xl">♡</div>
          <div className="absolute bottom-3 right-3 text-white/30 text-2xl">♡</div>

          {/* Flip hint */}
          {showFlipHint && (
            <motion.div
              className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Tap to reveal
            </motion.div>
          )}
        </div>

        {/* Card Front */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden bg-card",
            styles.border,
            "border-2 backface-hidden"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", styles.gradient)} />
          
          {/* Category badge */}
          {category && (
            <div className={cn(
              "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium",
              "bg-gradient-to-r",
              styles.gradient,
              "text-white"
            )}>
              {category}
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center">
            {frontContent}
          </div>

          {/* Corner flourishes */}
          <div className={cn("absolute top-3 right-3 text-2xl", styles.accent)}>✦</div>
          <div className={cn("absolute bottom-3 left-3 text-2xl", styles.accent)}>✦</div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameCard;
