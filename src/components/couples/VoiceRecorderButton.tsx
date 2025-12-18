import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderButtonProps {
  isRecording: boolean;
  isUploading: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceRecorderButton = ({
  isRecording,
  isUploading,
  duration,
  onStartRecording,
  onStopRecording,
  className,
  disabled,
}: VoiceRecorderButtonProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isUploading) {
    return (
      <Button disabled className={cn("gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Sending...
      </Button>
    );
  }

  if (isRecording) {
    return (
      <Button
        onClick={onStopRecording}
        variant="destructive"
        className={cn("gap-2 animate-pulse", className)}
      >
        <Square className="w-4 h-4 fill-current" />
        Stop ({formatTime(duration)})
      </Button>
    );
  }

  return (
    <Button
      onClick={onStartRecording}
      variant="outline"
      className={cn("gap-2", className)}
      disabled={disabled}
    >
      <Mic className="w-4 h-4" />
      Voice Message
    </Button>
  );
};
