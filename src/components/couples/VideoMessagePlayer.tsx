import { useState, useRef } from "react";
import { Play, Pause, Maximize2, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoMessagePlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  className?: string;
}

export const VideoMessagePlayer = ({
  videoUrl,
  thumbnailUrl,
  duration,
  className,
}: VideoMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const toggleFullscreenPlay = () => {
    if (!fullscreenVideoRef.current) return;

    if (isPlaying) {
      fullscreenVideoRef.current.pause();
    } else {
      fullscreenVideoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Inline player */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden bg-black/10 cursor-pointer group",
          className
        )}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          // @ts-ignore - webkit-playsinline for older iOS
          webkit-playsinline="true"
        />

        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black" />
            ) : (
              <Play className="w-5 h-5 text-black ml-0.5" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Duration badge */}
        {duration && !isPlaying && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs">
            {formatTime(duration)}
          </div>
        )}

        {/* Fullscreen button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 w-8 h-8 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            openFullscreen();
          }}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={closeFullscreen}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 z-10 text-white hover:bg-white/20"
              onClick={closeFullscreen}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            {/* Video */}
            <video
              ref={fullscreenVideoRef}
              src={videoUrl}
              className="max-w-full max-h-full object-contain"
              playsInline
              muted={isMuted}
              autoPlay
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreenPlay();
              }}
              onEnded={() => setIsPlaying(false)}
              // @ts-ignore - webkit-playsinline for older iOS
              webkit-playsinline="true"
            />

            {/* Play/pause overlay */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
