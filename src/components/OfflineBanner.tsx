import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const OfflineBanner = () => {
  const { isOffline } = useOfflineStatus();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500/90 text-yellow-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
