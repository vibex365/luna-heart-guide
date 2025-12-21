import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftStore } from "./GiftStore";
import { useGiftStore } from "@/hooks/useGiftStore";

interface GiftButtonProps {
  partnerLinkId: string;
  partnerId: string;
  partnerName: string;
  variant?: "default" | "compact";
}

export const GiftButton = ({ 
  partnerLinkId, 
  partnerId, 
  partnerName,
  variant = "default" 
}: GiftButtonProps) => {
  const [showStore, setShowStore] = useState(false);
  const { unopenedGiftsCount } = useGiftStore(partnerLinkId, partnerId);

  if (variant === "compact") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowStore(true)}
          className="relative"
        >
          <Gift className="w-5 h-5 text-rose-500" />
          {unopenedGiftsCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
            >
              {unopenedGiftsCount}
            </motion.span>
          )}
        </Button>

        <AnimatePresence>
          {showStore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowStore(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <GiftStore
                  partnerLinkId={partnerLinkId}
                  partnerId={partnerId}
                  partnerName={partnerName}
                  onClose={() => setShowStore(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={() => setShowStore(true)}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white gap-2"
        >
          <Gift className="w-4 h-4" />
          Send a Gift
          {unopenedGiftsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {unopenedGiftsCount} new
            </span>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {showStore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStore(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GiftStore
                partnerLinkId={partnerLinkId}
                partnerId={partnerId}
                partnerName={partnerName}
                onClose={() => setShowStore(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
