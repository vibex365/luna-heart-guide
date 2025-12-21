import { motion, AnimatePresence } from "framer-motion";
import { quickReactions } from "@/data/chatStickers";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface ReactionPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  existingReaction?: string;
}

export const ReactionPicker = ({ isOpen, onSelect, onClose, existingReaction }: ReactionPickerProps) => {
  const { trigger } = useHapticFeedback();

  const handleSelect = (emoji: string) => {
    trigger("light");
    onSelect(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="flex items-center gap-1 p-2 bg-card rounded-full shadow-lg border border-border">
              {quickReactions.map((reaction) => (
                <motion.button
                  key={reaction.emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect(reaction.emoji)}
                  className={`text-2xl p-1.5 rounded-full transition-colors ${
                    existingReaction === reaction.emoji
                      ? "bg-primary/20"
                      : "hover:bg-muted"
                  }`}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
