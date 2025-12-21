import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGiftStore, DigitalGift } from "@/hooks/useGiftStore";
import { GiftCard } from "./GiftCard";
import { GiftMessageModal } from "./GiftMessageModal";
import { Skeleton } from "@/components/ui/skeleton";

interface GiftStoreProps {
  partnerLinkId: string;
  partnerId: string;
  partnerName: string;
  onClose?: () => void;
}

export const GiftStore = ({ partnerLinkId, partnerId, partnerName, onClose }: GiftStoreProps) => {
  const [selectedGift, setSelectedGift] = useState<DigitalGift | null>(null);
  const { gifts, giftsLoading, sendGift, isSending } = useGiftStore(partnerLinkId, partnerId);

  const handleSendGift = (message?: string) => {
    if (!selectedGift) return;
    sendGift({ giftId: selectedGift.id, message });
    setSelectedGift(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-full">
              <Gift className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gift Shop</h3>
              <p className="text-sm text-muted-foreground">
                Send a special gift to {partnerName}
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Gift Grid */}
      <ScrollArea className="h-[400px] p-4">
        {giftsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onSelect={() => setSelectedGift(gift)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 bg-muted/50 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>Gifts include a special animation for your partner!</span>
        </div>
      </div>

      {/* Gift Message Modal */}
      <AnimatePresence>
        {selectedGift && (
          <GiftMessageModal
            gift={selectedGift}
            partnerName={partnerName}
            isSending={isSending}
            onSend={handleSendGift}
            onClose={() => setSelectedGift(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
