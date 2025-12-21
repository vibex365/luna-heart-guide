import { motion } from "framer-motion";
import { Fingerprint, ScanFace, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { Capacitor } from "@capacitor/core";

export const BiometricLockScreen = () => {
  const { biometryType, authenticate, unlock, isLocked } = useBiometricAuth();

  if (!isLocked) return null;

  const handleUnlock = async () => {
    if (Capacitor.isNativePlatform()) {
      await authenticate();
    } else {
      // On web, just unlock directly
      unlock();
    }
  };

  const BiometricIcon = biometryType === "face" ? ScanFace : Fingerprint;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-8"
      >
        {/* App Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Luna
          </span>
        </div>

        {/* Lock Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center"
        >
          <Lock className="w-12 h-12 text-primary" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">App Locked</h2>
          <p className="text-muted-foreground text-sm">
            {Capacitor.isNativePlatform() 
              ? `Use ${biometryType === "face" ? "Face ID" : "Touch ID"} to unlock`
              : "Tap to unlock and continue"
            }
          </p>
        </div>

        <Button
          onClick={handleUnlock}
          size="lg"
          className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <BiometricIcon className="w-5 h-5" />
          {Capacitor.isNativePlatform() ? "Unlock with Biometrics" : "Tap to Unlock"}
        </Button>
      </motion.div>
    </motion.div>
  );
};
