import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stickerPacks, Sticker } from "@/data/chatStickers";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface StickerPickerProps {
  isOpen: boolean;
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
}

export const StickerPicker = ({ isOpen, onSelect, onClose }: StickerPickerProps) => {
  const [activePack, setActivePack] = useState(stickerPacks[0].id);
  const { trigger } = useHapticFeedback();

  const handleSelect = (sticker: Sticker) => {
    trigger("light");
    onSelect(sticker);
    onClose();
  };

  const currentPack = stickerPacks.find((p) => p.id === activePack) || stickerPacks[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="font-medium text-sm">Stickers</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Pack Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
            {stickerPacks.map((pack) => (
              <button
                key={pack.id}
                onClick={() => setActivePack(pack.id)}
                className={cn(
                  "flex-shrink-0 text-xl p-2 rounded-lg transition-colors",
                  activePack === pack.id
                    ? "bg-primary/20"
                    : "hover:bg-muted"
                )}
                title={pack.name}
              >
                {pack.icon}
              </button>
            ))}
          </div>

          {/* Sticker Grid */}
          <div 
            className="grid grid-cols-6 gap-1 p-3 max-h-64 overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {currentPack.stickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(sticker)}
                className="text-3xl p-2 rounded-lg hover:bg-muted transition-colors"
                title={sticker.label}
              >
                {sticker.emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
