import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { Button } from "./ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

const PWAInstallBanner = () => {
  const { isInstallable, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const { trigger } = useHapticFeedback();

  const handleInstall = async () => {
    trigger("medium");
    await promptInstall();
  };

  const handleDismiss = () => {
    trigger("light");
    dismissPrompt();
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 safe-area-top"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="mx-3 mt-3 p-4 bg-card/95 backdrop-blur-lg rounded-2xl border border-border shadow-lg">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-sm">
                Install Luna
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS
                  ? "Tap Share, then 'Add to Home Screen'"
                  : "Add to your home screen for the best experience"}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {isIOS ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleDismiss}
              >
                <Share className="w-4 h-4" />
                Got it
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={handleDismiss}
                >
                  Not now
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                  onClick={handleInstall}
                >
                  <Download className="w-4 h-4" />
                  Install
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
