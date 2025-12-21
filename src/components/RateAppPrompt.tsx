import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRateApp } from "@/hooks/useRateApp";
import appIcon from "@/assets/app-icon-512.png";

export const RateAppPrompt = () => {
  const { shouldShowPrompt, markAsRated, dismissPrompt, askLater } = useRateApp();

  return (
    <AnimatePresence>
      {shouldShowPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={dismissPrompt}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={dismissPrompt}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="text-center space-y-4">
              {/* App icon with animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative mx-auto w-20 h-20"
              >
                <img
                  src={appIcon}
                  alt="Luna"
                  className="w-full h-full rounded-2xl shadow-lg"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1.5"
                >
                  <Heart className="w-4 h-4 text-white fill-white" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-bold">Enjoying Luna?</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your feedback helps us improve and reach more people who need support 💜
                </p>
              </motion.div>

              {/* Stars */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-1"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + star * 0.1 }}
                  >
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2 pt-2"
              >
                <Button
                  onClick={markAsRated}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  size="lg"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate Luna
                </Button>
                <Button
                  onClick={askLater}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Maybe Later
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
