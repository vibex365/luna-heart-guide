import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PresenceStatus } from "@/hooks/usePartnerPresence";

interface PartnerPresenceIndicatorProps {
  isOnline: boolean;
  status: PresenceStatus;
  partnerName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PartnerPresenceIndicator = ({
  isOnline,
  status,
  partnerName = "Partner",
  showLabel = true,
  size = "md"
}: PartnerPresenceIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-muted-foreground";
    switch (status) {
      case 'in_call':
        return "bg-green-500";
      case 'in_chat':
        return "bg-blue-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'in_call':
        return <Phone className="w-3 h-3" />;
      case 'in_chat':
        return <MessageCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return "offline";
    switch (status) {
      case 'in_call':
        return "in a call";
      case 'in_chat':
        return "chatting with Luna";
      default:
        return "online";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            getStatusColor()
          )}
          animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        {isOnline && (status === 'in_call' || status === 'in_chat') && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            {getStatusIcon()}
          </motion.div>
        )}
      </div>
      
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-xs text-muted-foreground"
          >
            {partnerName} is {getStatusText()}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
};
