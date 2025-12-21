import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Download, Heart, MessageCircle, Sparkles, Users, Moon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import appIcon from "@/assets/app-icon-1024.png";

interface Scene {
  id: string;
  duration: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}

const scenes: Scene[] = [
  {
    id: "intro",
    duration: 3000,
    title: "Luna",
    subtitle: "Your AI Relationship Companion",
    icon: <Moon className="w-16 h-16" />,
    gradient: "from-pink-500 via-purple-500 to-indigo-600",
  },
  {
    id: "chat",
    duration: 4000,
    title: "24/7 AI Support",
    subtitle: "Talk through your feelings anytime",
    icon: <MessageCircle className="w-16 h-16" />,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
  },
  {
    id: "mood",
    duration: 4000,
    title: "Track Your Mood",
    subtitle: "Understand your emotional patterns",
    icon: <TrendingUp className="w-16 h-16" />,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "couples",
    duration: 4000,
    title: "Connect as a Couple",
    subtitle: "Games, challenges & shared moments",
    icon: <Users className="w-16 h-16" />,
    gradient: "from-pink-500 via-rose-500 to-orange-500",
  },
  {
    id: "features",
    duration: 4000,
    title: "Everything You Need",
    subtitle: "Journaling • Breathing • Insights",
    icon: <Sparkles className="w-16 h-16" />,
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    id: "cta",
    duration: 3000,
    title: "Start Your Journey",
    subtitle: "Download Luna Today",
    icon: <Heart className="w-16 h-16 fill-current" />,
    gradient: "from-pink-500 to-purple-600",
  },
];

const PromoVideoTemplate = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);
  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const sceneStartTime = scenes
      .slice(0, currentSceneIndex)
      .reduce((acc, scene) => acc + scene.duration, 0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / totalDuration) * 50;
        
        // Check if we need to advance to next scene
        const currentTime = (newProgress / 100) * totalDuration;
        const nextSceneTime = sceneStartTime + currentScene.duration;
        
        if (currentTime >= nextSceneTime && currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(currentSceneIndex + 1);
        }
        
        if (newProgress >= 100) {
          setIsPlaying(false);
          return 100;
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentSceneIndex, currentScene.duration, totalDuration]);

  const handlePlayPause = () => {
    if (progress >= 100) {
      handleRestart();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setProgress(0);
    setCurrentSceneIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">App Preview Video</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Video Preview Frame */}
        <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-border">
          {/* Phone notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20" />

          {/* Scene content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${currentScene.gradient} flex flex-col items-center justify-center p-8 text-white`}
            >
              {currentScene.id === "intro" ? (
                <>
                  <motion.img
                    src={appIcon}
                    alt="Luna"
                    className="w-28 h-28 rounded-3xl shadow-2xl mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  />
                  <motion.h2
                    className="text-4xl font-bold mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {currentScene.title}
                  </motion.h2>
                  <motion.p
                    className="text-white/80 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {currentScene.subtitle}
                  </motion.p>
                </>
              ) : currentScene.id === "cta" ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    {currentScene.icon}
                  </motion.div>
                  <motion.h2
                    className="text-3xl font-bold mb-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentScene.title}
                  </motion.h2>
                  <motion.p
                    className="text-white/80 text-center mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {currentScene.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-4"
                  >
                    <div className="px-4 py-2 bg-white/20 rounded-lg text-sm">
                      App Store
                    </div>
                    <div className="px-4 py-2 bg-white/20 rounded-lg text-sm">
                      Play Store
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring" }}
                    className="mb-6"
                  >
                    {currentScene.icon}
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold mb-2 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentScene.title}
                  </motion.h2>
                  <motion.p
                    className="text-white/80 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {currentScene.subtitle}
                  </motion.p>
                </>
              )}

              {/* Floating elements for visual interest */}
              <motion.div
                className="absolute top-20 right-8 w-4 h-4 rounded-full bg-white/30"
                animate={{ 
                  y: [0, -20, 0],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-32 left-10 w-6 h-6 rounded-full bg-white/20"
                animate={{ 
                  y: [0, -30, 0],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRestart}
            className="rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="rounded-full w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            disabled
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>

        {/* Scene indicators */}
        <div className="flex justify-center gap-2">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => {
                setCurrentSceneIndex(index);
                const newProgress = (scenes
                  .slice(0, index)
                  .reduce((acc, s) => acc + s.duration, 0) / totalDuration) * 100;
                setProgress(newProgress);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSceneIndex
                  ? "w-6 bg-primary"
                  : index < currentSceneIndex
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold">Export Instructions</h3>
          <p className="text-sm text-muted-foreground">
            To create the actual video for App Store:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Record this preview using screen recording</li>
            <li>Export as 1080x1920 (9:16 ratio) for App Store</li>
            <li>Keep under 30 seconds for best engagement</li>
            <li>Add background music before uploading</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromoVideoTemplate;
