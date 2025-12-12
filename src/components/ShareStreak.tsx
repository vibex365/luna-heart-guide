import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Check, Twitter, Facebook, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareStreakProps {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
}

const ShareStreak = ({ currentStreak, longestStreak, totalCheckIns }: ShareStreakProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    let message = `🔥 I'm on a ${currentStreak}-day mood tracking streak with Luna!\n\n`;
    
    if (currentStreak >= 100) {
      message = `👑 Just hit ${currentStreak} days of mood tracking with Luna! Century legend status unlocked!\n\n`;
    } else if (currentStreak >= 30) {
      message = `🔥 30+ days strong! I've been tracking my mood with Luna for ${currentStreak} days!\n\n`;
    } else if (currentStreak >= 14) {
      message = `⭐ Two weeks and counting! ${currentStreak}-day streak with Luna!\n\n`;
    } else if (currentStreak >= 7) {
      message = `⚡ One week warrior! I'm on a ${currentStreak}-day mood tracking streak with Luna!\n\n`;
    }

    message += `📊 Stats:\n`;
    message += `• Current streak: ${currentStreak} days\n`;
    message += `• Best streak: ${longestStreak} days\n`;
    message += `• Total check-ins: ${totalCheckIns}\n\n`;
    message += `Taking care of my mental health, one day at a time. 💜`;

    return message;
  };

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleNativeShare = async () => {
    const shareText = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Luna Streak",
          text: shareText,
          url: shareUrl,
        });
        setShowOptions(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      setShowOptions(true);
    }
  };

  const handleCopyLink = async () => {
    const shareText = getShareText();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    setShowOptions(false);
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Achievement
      </Button>

      <AnimatePresence>
        {showOptions && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(false)}
            />
            <motion.div
              className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl shadow-luna border border-border p-4 z-50"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Share your streak</p>
                <button
                  onClick={() => setShowOptions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 transition-colors"
                  onClick={handleTwitterShare}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                  <span className="text-xs text-foreground">Twitter</span>
                </motion.button>

                <motion.button
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors"
                  onClick={handleFacebookShare}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                  <span className="text-xs text-foreground">Facebook</span>
                </motion.button>

                <motion.button
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  onClick={handleCopyLink}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Link2 className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-foreground">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </motion.button>
              </div>

              <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {getShareText().split("\n")[0]}...
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareStreak;
