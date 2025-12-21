import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/data/chatStickers";

// Quick flirty emojis for easy access
const flirtyQuickEmojis = [
  { id: "fq-1", emoji: "😏", label: "Smirk" },
  { id: "fq-2", emoji: "🥵", label: "Hot Face" },
  { id: "fq-3", emoji: "😈", label: "Devil" },
  { id: "fq-4", emoji: "👅", label: "Tongue" },
  { id: "fq-5", emoji: "🍑", label: "Peach" },
  { id: "fq-6", emoji: "🍆", label: "Eggplant" },
  { id: "fq-7", emoji: "💦", label: "Sweat" },
  { id: "fq-8", emoji: "🫦", label: "Biting Lip" },
  { id: "fq-9", emoji: "🤤", label: "Drooling" },
  { id: "fq-10", emoji: "😮‍💨", label: "Exhaling" },
];

interface FlirtyEmojiButtonProps {
  onSelect: (sticker: Sticker) => void;
}

export const FlirtyEmojiButton = ({ onSelect }: FlirtyEmojiButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { trigger } = useHapticFeedback();

  const handleSelect = (emoji: typeof flirtyQuickEmojis[0]) => {
    trigger("light");
    onSelect({
      id: emoji.id,
      emoji: emoji.emoji,
      label: emoji.label,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          trigger("light");
          setIsOpen(!isOpen);
        }}
        className="h-10 w-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
      >
        <Flame className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Emoji popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute bottom-14 right-0 z-50 bg-card border border-border rounded-2xl p-4 shadow-2xl min-w-[280px]"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Flirty Emojis</span>
                  <p className="text-xs text-muted-foreground">Send something spicy 🔥</p>
                </div>
              </div>
              
              {/* Emoji grid */}
              <div className="grid grid-cols-5 gap-2">
                {flirtyQuickEmojis.map((emoji, index) => (
                  <motion.button
                    key={emoji.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleSelect(emoji)}
                    className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl hover:bg-gradient-to-br hover:from-red-500/10 hover:to-pink-500/10 transition-all duration-200 active:bg-red-500/20"
                    title={emoji.label}
                  >
                    {emoji.emoji}
                  </motion.button>
                ))}
              </div>
              
              {/* Tip */}
              <p className="text-[10px] text-muted-foreground text-center mt-3 pt-2 border-t border-border">
                Tap to send instantly
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
