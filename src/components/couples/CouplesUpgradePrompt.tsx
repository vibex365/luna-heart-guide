import { Heart, Sparkles, X, Users, MessageCircle, Trophy, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CouplesUpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
  canStartTrial?: boolean;
  isStartingTrial?: boolean;
  variant?: "modal" | "inline";
  context?: "mood" | "journal" | "breathe" | "general";
}

const contextMessages = {
  mood: {
    title: "Track Moods Together",
    description: "Share your emotional journey with your partner and grow closer together.",
  },
  journal: {
    title: "Share Your Growth",
    description: "Connect deeper by sharing your journaling journey with your partner.",
  },
  breathe: {
    title: "Breathe Together",
    description: "Practice mindfulness exercises as a couple and strengthen your bond.",
  },
  general: {
    title: "Unlock Couples Features",
    description: "Experience a deeper connection with shared activities and insights.",
  },
};

const features = [
  { icon: Users, label: "Partner Connection" },
  { icon: MessageCircle, label: "Private Chat" },
  { icon: Trophy, label: "Couples Games" },
  { icon: Target, label: "Shared Goals" },
];

export const CouplesUpgradePrompt = ({
  open,
  onOpenChange,
  onStartTrial,
  canStartTrial = true,
  isStartingTrial = false,
  variant = "modal",
  context = "general",
}: CouplesUpgradePromptProps) => {
  const message = contextMessages[context];

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{message.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{message.description}</p>
            <div className="mt-3 flex gap-2">
              {canStartTrial ? (
                <Button
                  size="sm"
                  onClick={onStartTrial}
                  disabled={isStartingTrial}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isStartingTrial ? "Starting..." : "Try Free"}
                </Button>
              ) : (
                <Link to="/subscription">
                  <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    Upgrade
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header gradient */}
            <div className="h-24 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-12 h-12 text-white fill-white/30" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold">{message.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{message.description}</p>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {features.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <feature.icon className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-6 space-y-2">
                {canStartTrial ? (
                  <>
                    <Button
                      onClick={onStartTrial}
                      disabled={isStartingTrial}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isStartingTrial ? "Starting Trial..." : "Start 3-Day Free Trial"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      No credit card required
                    </p>
                  </>
                ) : (
                  <Link to="/subscription" className="block">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                      Upgrade to Couples Plan
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
