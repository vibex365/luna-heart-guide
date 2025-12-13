import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[60] safe-area-top"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            className={`mx-3 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg ${
              isOnline
                ? "bg-green-500/90 backdrop-blur-lg"
                : "bg-destructive/90 backdrop-blur-lg"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">
                  Back online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-white" />
                <div className="flex-1">
                  <span className="text-white text-sm font-medium">
                    You're offline
                  </span>
                  <p className="text-white/80 text-xs">
                    Some features may be limited
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
