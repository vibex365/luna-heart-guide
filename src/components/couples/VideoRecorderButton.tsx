import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Video, Square, Loader2, X, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoRecorderButtonProps {
  isRecording: boolean;
  isUploading: boolean;
  isPreviewing: boolean;
  duration: number;
  stream: MediaStream | null;
  previewUrl: string | null;
  onStartCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSend: () => void;
  onRetake: () => void;
  onCancel: () => void;
  className?: string;
  disabled?: boolean;
}

export const VideoRecorderButton = ({
  isRecording,
  isUploading,
  isPreviewing,
  duration,
  stream,
  previewUrl,
  onStartCamera,
  onStartRecording,
  onStopRecording,
  onSend,
  onRetake,
  onCancel,
  className,
  disabled,
}: VideoRecorderButtonProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      // Explicit play call for iOS Safari
      video.play().catch((error) => {
        console.error("Error playing video stream:", error);
      });
    }
  }, [stream]);

  // Handle preview video playback for iOS
  useEffect(() => {
    const previewVideo = previewVideoRef.current;
    if (previewVideo && previewUrl && isPreviewing) {
      previewVideo.load();
      previewVideo.play().catch((error) => {
        console.error("Error playing preview video:", error);
      });
    }
  }, [previewUrl, isPreviewing]);

  if (isUploading) {
    return (
      <Button disabled className={cn("gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Sending...
      </Button>
    );
  }

  // Show camera/recording/preview modal - use Portal to escape parent stacking contexts
  if (stream || isPreviewing) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          {/* Close button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Timer */}
          {(isRecording || isPreviewing) && (
            <div className="absolute top-4 right-4 z-10">
              <div className={cn(
                "px-3 py-1 rounded-full text-white font-mono text-lg",
                isRecording ? "bg-red-500 animate-pulse" : "bg-black/50"
              )}>
                {formatTime(duration)}
              </div>
            </div>
          )}

          {/* Video display */}
          <div className="flex-1 flex items-center justify-center">
            {isPreviewing && previewUrl ? (
              <video
                ref={previewVideoRef}
                src={previewUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                muted
                controls={false}
                // @ts-ignore - webkit-playsinline for older iOS
                webkit-playsinline="true"
                x-webkit-airplay="allow"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
                // @ts-ignore - webkit-playsinline for older iOS
                webkit-playsinline="true"
              />
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {isPreviewing ? (
              // Preview controls
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onRetake}
                  className="text-white hover:bg-white/20 flex flex-col gap-1 h-auto py-2"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span className="text-xs">Retake</span>
                </Button>
                <Button
                  size="lg"
                  onClick={onSend}
                  className="bg-primary hover:bg-primary/90 rounded-full w-16 h-16"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            ) : isRecording ? (
              // Recording controls
              <div className="flex items-center justify-center">
                <Button
                  onClick={onStopRecording}
                  className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 border-4 border-white"
                >
                  <Square className="w-8 h-8 fill-white text-white" />
                </Button>
              </div>
            ) : (
              // Ready to record
              <div className="flex items-center justify-center">
                <Button
                  onClick={onStartRecording}
                  className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 border-4 border-white"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  // Default button to start camera
  return (
    <Button
      onClick={onStartCamera}
      variant="ghost"
      size="icon"
      className={cn("text-pink-500", className)}
      disabled={disabled}
    >
      <Video className="w-5 h-5" />
    </Button>
  );
};
