import { ReactNode, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh = ({ children, onRefresh, disabled = false }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { trigger } = useHapticFeedback();
  const y = useMotionValue(0);
  
  const pullProgress = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const indicatorOpacity = useTransform(y, [0, 40, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(y, [0, PULL_THRESHOLD, MAX_PULL], [0, 180, 360]);

  const handleDragEnd = useCallback(
    async (_: any, info: PanInfo) => {
      if (disabled || isRefreshing) return;

      if (info.offset.y >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        trigger("medium");
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [disabled, isRefreshing, onRefresh, trigger]
  );

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{
          opacity: indicatorOpacity,
          scale: indicatorScale,
          top: useTransform(y, (value) => Math.min(value - 40, 20)),
        }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isRefreshing ? "bg-accent" : "bg-card border border-border"
          }`}
          style={{ rotate: isRefreshing ? undefined : indicatorRotate }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : undefined}
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? "text-accent-foreground" : "text-muted-foreground"}`}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={disabled || isRefreshing ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? 60 : y }}
        animate={isRefreshing ? { y: 60 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
