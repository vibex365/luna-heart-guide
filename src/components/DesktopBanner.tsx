import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "luna-desktop-banner-dismissed";
const DISMISS_DURATION_DAYS = 7;

const DesktopBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed < DISMISS_DURATION_DAYS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  const appUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(appUrl)}&bgcolor=1a1625&color=ffffff`;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="sticky top-0 z-50 bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-sm border-b border-border/20"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-background/20">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-foreground">
                  Luna is best on mobile!
                </p>
                <p className="text-xs text-primary-foreground/80 hidden sm:block">
                  Scan the QR code or visit on your phone for the full experience
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-background/10 rounded-lg p-1.5">
                <QrCode className="w-4 h-4 text-primary-foreground/60" />
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to open on mobile" 
                  className="w-12 h-12 rounded"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-primary-foreground hover:bg-background/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DesktopBanner;
