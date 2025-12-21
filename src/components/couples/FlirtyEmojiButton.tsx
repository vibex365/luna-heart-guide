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
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl p-3 shadow-xl"
            >
              <div className="flex items-center gap-1 mb-2 px-1">
                <Flame className="w-3 h-3 text-red-500" />
                <span className="text-xs text-muted-foreground font-medium">Flirty</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {flirtyQuickEmojis.map((emoji) => (
                  <motion.button
                    key={emoji.id}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSelect(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-muted transition-colors"
                  >
                    {emoji.emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
