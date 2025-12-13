import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MessageLimitBannerProps {
  onDismiss?: () => void;
}

export const MessageLimitBanner = ({ onDismiss }: MessageLimitBannerProps) => {
  const { user } = useAuth();
  const { plan, getLimit, isLoading } = useSubscription();
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const dailyLimit = getLimit("messages_per_day");
  const isUnlimited = dailyLimit === -1;

  useEffect(() => {
    if (!user || isUnlimited) return;

    const fetchMessageCount = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("conversation_analytics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      if (!error && count !== null) {
        setMessagesUsed(count);
      }
    };

    fetchMessageCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchMessageCount, 30000);
    return () => clearInterval(interval);
  }, [user, isUnlimited]);

  // Don't show banner for paid users or while loading
  if (isLoading || isUnlimited || plan !== "free" || dismissed) {
    return null;
  }

  const remaining = Math.max(0, dailyLimit - messagesUsed);
  const percentUsed = (messagesUsed / dailyLimit) * 100;
  const isLow = remaining <= 2;
  const isExhausted = remaining === 0;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`mx-4 mt-2 rounded-xl p-3 flex items-center gap-3 ${
          isExhausted
            ? "bg-destructive/10 border border-destructive/30"
            : isLow
            ? "bg-amber-500/10 border border-amber-500/30"
            : "bg-secondary/50 border border-border"
        }`}
      >
        {isExhausted ? (
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        ) : (
          <Crown className="w-5 h-5 text-primary shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {isExhausted ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">Daily limit reached.</span>{" "}
              <span className="text-muted-foreground">Upgrade for unlimited messages.</span>
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{remaining} message{remaining !== 1 ? "s" : ""}</span>{" "}
                <span className="text-muted-foreground">remaining today</span>
              </p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentUsed}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    isLow ? "bg-amber-500" : "bg-primary"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/subscription">
            <Button
              size="sm"
              variant={isExhausted ? "default" : "outline"}
              className={isExhausted ? "bg-primary" : ""}
            >
              Upgrade
            </Button>
          </Link>
          {!isExhausted && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
