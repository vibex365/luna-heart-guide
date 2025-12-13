import { motion } from "framer-motion";
import { Download, Share, MoreVertical, Plus, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import LunaAvatar from "./LunaAvatar";

const PWAInstallInstructions = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { trigger } = useHapticFeedback();
  
  // Check if running in standalone mode (already installed)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );

  const handleInstall = async () => {
    trigger("medium");
    await promptInstall();
  };

  if (isInstalled || isStandalone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto"
      >
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">Already Installed!</h3>
              <p className="text-sm text-muted-foreground">Luna is on your home screen</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
            <LunaAvatar size="lg" showGlow={false} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">Install Luna</h3>
            <p className="text-sm text-muted-foreground">Add to your home screen</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-xs">✓</span>
            </div>
            <span>Launch instantly from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-xs">✓</span>
            </div>
            <span>Works offline for journaling</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-xs">✓</span>
            </div>
            <span>Full-screen experience</span>
          </div>
        </div>

        {isIOS ? (
          /* iOS Instructions */
          <div className="space-y-4">
            <p className="text-sm text-foreground font-medium mb-3">How to install on iPhone/iPad:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Tap the</span>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      <Share className="w-4 h-4" />
                      <span className="text-xs font-medium">Share</span>
                    </div>
                    <span className="text-sm text-foreground">button</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">At the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Scroll down and tap</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md mt-1">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">Add to Home Screen</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-sm text-foreground">Tap "Add" to confirm</span>
                  <p className="text-xs text-muted-foreground mt-1">Luna will appear on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        ) : isInstallable ? (
          /* Android/Desktop with native prompt */
          <Button
            size="lg"
            className="w-full gap-2 bg-accent hover:bg-accent/90"
            onClick={handleInstall}
          >
            <Download className="w-5 h-5" />
            Install Luna
          </Button>
        ) : (
          /* Android Instructions (when prompt not available) */
          <div className="space-y-4">
            <p className="text-sm text-foreground font-medium mb-3">How to install on Android:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Tap the</span>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      <MoreVertical className="w-4 h-4" />
                      <span className="text-xs font-medium">Menu</span>
                    </div>
                    <span className="text-sm text-foreground">button</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Top right of Chrome</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Tap</span>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      <Download className="w-4 h-4" />
                      <span className="text-xs font-medium">Install app</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Or "Add to Home screen"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-accent-foreground font-bold text-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-sm text-foreground">Tap "Install" to confirm</span>
                  <p className="text-xs text-muted-foreground mt-1">Luna will be added to your apps</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PWAInstallInstructions;
