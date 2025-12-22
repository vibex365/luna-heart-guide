import { useState } from "react";
import { Mic, MicOff, Loader2, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceSessionButtonProps {
  isConnecting: boolean;
  isActive: boolean;
  isEnding: boolean;
  isLunaSpeaking: boolean;
  durationSeconds: number;
  onStart: () => void;
  onEnd: () => void;
  disabled?: boolean;
  size?: "default" | "large";
}

export const VoiceSessionButton = ({
  isConnecting,
  isActive,
  isEnding,
  isLunaSpeaking,
  durationSeconds,
  onStart,
  onEnd,
  disabled = false,
  size = "default"
}: VoiceSessionButtonProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLarge = size === "large";

  // Idle state - start button
  if (!isConnecting && !isActive && !isEnding) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Button
          onClick={onStart}
          disabled={disabled}
          size="lg"
          className={cn(
            "rounded-full transition-all",
            isLarge ? "w-32 h-32" : "w-20 h-20",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "shadow-lg hover:shadow-xl hover:shadow-primary/25"
          )}
        >
          <Mic className={cn(isLarge ? "w-12 h-12" : "w-8 h-8")} />
        </Button>
        <p className="text-sm text-muted-foreground">
          Tap to talk with Luna
        </p>
      </motion.div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div
          className={cn(
            "rounded-full flex items-center justify-center",
            isLarge ? "w-32 h-32" : "w-20 h-20",
            "bg-gradient-to-br from-primary/50 to-primary/30",
            "animate-pulse"
          )}
        >
          <Loader2 className={cn(isLarge ? "w-12 h-12" : "w-8 h-8", "animate-spin text-primary")} />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Connecting to Luna...
        </p>
      </motion.div>
    );
  }

  // Active state - end button with duration
  if (isActive) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          {/* Pulsing ring when Luna is speaking */}
          <AnimatePresence>
            {isLunaSpeaking && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full bg-primary/30",
                  isLarge ? "w-32 h-32" : "w-20 h-20"
                )}
              />
            )}
          </AnimatePresence>
          
          <Button
            onClick={onEnd}
            variant="destructive"
            size="lg"
            className={cn(
              "rounded-full transition-all relative z-10",
              isLarge ? "w-32 h-32" : "w-20 h-20",
              "shadow-lg hover:shadow-xl"
            )}
          >
            <PhoneOff className={cn(isLarge ? "w-10 h-10" : "w-6 h-6")} />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-2xl font-mono font-bold text-primary">
            {formatDuration(durationSeconds)}
          </p>
          <p className="text-sm text-muted-foreground">
            {isLunaSpeaking ? "Luna is speaking..." : "Listening..."}
          </p>
        </div>
      </motion.div>
    );
  }

  // Ending state
  if (isEnding) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div
          className={cn(
            "rounded-full flex items-center justify-center",
            isLarge ? "w-32 h-32" : "w-20 h-20",
            "bg-muted"
          )}
        >
          <Loader2 className={cn(isLarge ? "w-12 h-12" : "w-8 h-8", "animate-spin text-muted-foreground")} />
        </div>
        <p className="text-sm text-muted-foreground">
          Ending session...
        </p>
      </motion.div>
    );
  }

  return null;
};
