import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Package, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGiftStore, PartnerGift } from "@/hooks/useGiftStore";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { GiftOpenDialog } from "./GiftOpenDialog";

interface GiftCollectionProps {
  partnerLinkId: string;
  partnerId: string;
}

export const GiftCollection = ({ partnerLinkId, partnerId }: GiftCollectionProps) => {
  const { receivedGifts, sentGifts, receivedLoading, sentLoading, openGift } = useGiftStore(
    partnerLinkId,
    partnerId
  );
  const [selectedGift, setSelectedGift] = useState<PartnerGift | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allGifts = [...receivedGifts, ...sentGifts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleGiftClick = (gift: PartnerGift, isReceived: boolean) => {
    setSelectedGift(gift);
    setDialogOpen(true);
  };

  const handleMarkOpened = (giftId: string) => {
    openGift(giftId);
  };

  if (receivedLoading || sentLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (allGifts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h4 className="font-medium text-foreground">No gifts yet</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Send or receive your first gift to start your collection!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gift Collection</h3>
              <p className="text-sm text-muted-foreground">
                {allGifts.length} gift{allGifts.length !== 1 ? 's' : ''} exchanged
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-4 space-y-3">
            {allGifts.map((gift, index) => {
              const isReceived = receivedGifts.some((g) => g.id === gift.id);
              return (
                <GiftHistoryItem
                  key={gift.id}
                  gift={gift}
                  isSent={!isReceived}
                  isReceived={isReceived}
                  index={index}
                  onClick={() => handleGiftClick(gift, isReceived)}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <GiftOpenDialog
        gift={selectedGift}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMarkOpened={handleMarkOpened}
      />
    </>
  );
};

interface GiftHistoryItemProps {
  gift: PartnerGift;
  isSent: boolean;
  isReceived: boolean;
  index: number;
  onClick: () => void;
}

const GiftHistoryItem = ({ gift, isSent, isReceived, index, onClick }: GiftHistoryItemProps) => {
  const isUnopened = isReceived && !gift.is_opened;

  return (
    <motion.div
      initial={{ opacity: 0, x: isSent ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer
        transition-all hover:scale-[1.02] active:scale-[0.98]
        ${isSent 
          ? 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15' 
          : 'bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15'
        }
        ${isUnopened ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background' : ''}
      `}
    >
      <div className="relative">
        <span className="text-2xl">{gift.digital_gifts?.icon || '🎁'}</span>
        {isUnopened && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-foreground truncate">
            {gift.digital_gifts?.name}
          </h4>
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${isSent 
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }
          `}>
            {isSent ? 'Sent' : 'Received'}
          </span>
          {isUnopened && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
              New!
            </span>
          )}
        </div>
        {gift.message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            "{gift.message}"
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(gift.created_at), 'MMM d, yyyy • h:mm a')}
        </p>
      </div>
    </motion.div>
  );
};
