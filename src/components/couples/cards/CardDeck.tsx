import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardDeckProps {
  cardCount?: number;
  theme?: "romance" | "spicy" | "adventure" | "drinking" | "intimate";
  onDraw?: () => void;
  isDrawing?: boolean;
  className?: string;
}

const themeStyles = {
  romance: "from-pink-500 via-rose-500 to-red-400",
  spicy: "from-orange-500 via-red-500 to-rose-600",
  adventure: "from-violet-500 via-purple-500 to-indigo-500",
  drinking: "from-amber-500 via-yellow-500 to-orange-400",
  intimate: "from-fuchsia-500 via-pink-500 to-rose-500",
};

export const CardDeck = ({
  cardCount = 5,
  theme = "romance",
  onDraw,
  isDrawing = false,
  className,
}: CardDeckProps) => {
  const visibleCards = Math.min(cardCount, 5);

  return (
    <div
      className={cn("relative w-48 h-64 cursor-pointer", className)}
      onClick={onDraw}
    >
      {/* Stacked cards */}
      {Array.from({ length: visibleCards }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "absolute inset-0 rounded-2xl border-2 border-white/20",
            "bg-gradient-to-br",
            themeStyles[theme]
          )}
          initial={false}
          animate={{
            y: isDrawing && index === visibleCards - 1 ? -100 : -index * 3,
            x: index * 2,
            rotate: index * 1.5,
            opacity: isDrawing && index === visibleCards - 1 ? 0 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          style={{
            zIndex: index,
          }}
        >
          {/* Card back design */}
          <div className="absolute inset-4 border border-white/20 rounded-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-2xl">
                {theme === "romance" && "💕"}
                {theme === "spicy" && "🔥"}
                {theme === "adventure" && "✨"}
                {theme === "drinking" && "🍷"}
                {theme === "intimate" && "💋"}
              </span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Card count indicator */}
      {cardCount > 0 && (
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold text-foreground z-10">
          {cardCount}
        </div>
      )}

      {/* Draw hint */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-white/60 text-sm font-medium">Tap to draw</span>
      </motion.div>
    </div>
  );
};

export default CardDeck;
