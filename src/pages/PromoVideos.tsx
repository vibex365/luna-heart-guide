import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Heart, MessageCircle, Sparkles, Users, Moon, TrendingUp, Gift, BookHeart, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// General App Promo Scenes
const generalScenes: Scene[] = [
  {
    id: "intro",
    duration: 2500,
    title: "Luna",
    subtitle: "Your AI Relationship Companion",
    icon: <Moon className="w-16 h-16" />,
    gradient: "from-pink-500 via-purple-500 to-indigo-600",
  },
  {
    id: "chat",
    duration: 3500,
    title: "24/7 AI Support",
    subtitle: "Talk through your feelings anytime",
    icon: <MessageCircle className="w-16 h-16" />,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
  },
  {
    id: "mood",
    duration: 3500,
    title: "Track Your Mood",
    subtitle: "Understand your emotional patterns",
    icon: <TrendingUp className="w-16 h-16" />,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "couples",
    duration: 3500,
    title: "Connect as a Couple",
    subtitle: "Games, challenges & shared moments",
    icon: <Users className="w-16 h-16" />,
    gradient: "from-pink-500 via-rose-500 to-orange-500",
  },
  {
    id: "cta",
    duration: 2500,
    title: "Start Your Journey",
    subtitle: "Download Luna Today",
    icon: <Heart className="w-16 h-16 fill-current" />,
    gradient: "from-pink-500 to-purple-600",
  },
];

// Couples Feature Promo Scenes
const couplesScenes: Scene[] = [
  {
    id: "intro",
    duration: 2500,
    title: "Luna for Couples",
    subtitle: "Strengthen Your Bond Together",
    icon: <Heart className="w-16 h-16 fill-current" />,
    gradient: "from-pink-500 via-rose-500 to-red-500",
  },
  {
    id: "games",
    duration: 3000,
    title: "Fun Relationship Games",
    subtitle: "Truth or Dare • Would You Rather",
    icon: <Gamepad2 className="w-16 h-16" />,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
  },
  {
    id: "gifts",
    duration: 3000,
    title: "Send Digital Gifts",
    subtitle: "Surprise your partner with love",
    icon: <Gift className="w-16 h-16" />,
    gradient: "from-rose-500 via-pink-500 to-purple-500",
  },
  {
    id: "journal",
    duration: 3000,
    title: "Daily Journal Together",
    subtitle: "Share your thoughts & feelings",
    icon: <BookHeart className="w-16 h-16" />,
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    id: "cta",
    duration: 2500,
    title: "Reconnect Today",
    subtitle: "One subscription • Two hearts",
    icon: <Users className="w-16 h-16" />,
    gradient: "from-pink-500 to-purple-600",
  },
];

// Quick Hook Scenes for TikTok/Reels
const hookScenes: Scene[] = [
  {
    id: "hook",
    duration: 2000,
    title: "Tired of feeling",
    subtitle: "disconnected from your partner?",
    icon: <Heart className="w-16 h-16" />,
    gradient: "from-pink-600 via-rose-500 to-red-500",
  },
  {
    id: "problem",
    duration: 2500,
    title: "Same arguments",
    subtitle: "on repeat...",
    icon: <MessageCircle className="w-16 h-16" />,
    gradient: "from-purple-600 via-pink-500 to-rose-500",
  },
  {
    id: "solution",
    duration: 2500,
    title: "Luna changes that",
    subtitle: "AI-powered relationship tools",
    icon: <Sparkles className="w-16 h-16" />,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "cta",
    duration: 2000,
    title: "Try it FREE",
    subtitle: "Link in bio 👇",
    icon: <Moon className="w-16 h-16" />,
    gradient: "from-pink-500 to-purple-600",
  },
];

// Singles/Therapy Focus Scenes
const therapyScenes: Scene[] = [
  {
    id: "intro",
    duration: 2500,
    title: "Can't stop overthinking?",
    subtitle: "Luna understands",
    icon: <Moon className="w-16 h-16" />,
    gradient: "from-indigo-600 via-purple-500 to-pink-500",
  },
  {
    id: "support",
    duration: 3000,
    title: "24/7 AI Therapy",
    subtitle: "No judgment • No wait times",
    icon: <MessageCircle className="w-16 h-16" />,
    gradient: "from-purple-500 via-pink-500 to-rose-500",
  },
  {
    id: "features",
    duration: 3000,
    title: "Track • Journal • Breathe",
    subtitle: "Your complete wellness toolkit",
    icon: <Sparkles className="w-16 h-16" />,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "cta",
    duration: 2500,
    title: "Find Your Calm",
    subtitle: "Start free today",
    icon: <Heart className="w-16 h-16 fill-current" />,
    gradient: "from-pink-500 to-purple-600",
  },
];

interface VideoPlayerProps {
  scenes: Scene[];
  aspectRatio: "9/16" | "1/1" | "16/9";
  platformName: string;
}

const VideoPlayer = ({ scenes, aspectRatio, platformName }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);
  const currentScene = scenes[currentSceneIndex];

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

  // Animation effect
  useState(() => {
    if (!isPlaying) return;

    const sceneStartTime = scenes
      .slice(0, currentSceneIndex)
      .reduce((acc, scene) => acc + scene.duration, 0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / totalDuration) * 50;
        
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
  });

  const aspectClasses = {
    "9/16": "aspect-[9/16] max-w-[280px]",
    "1/1": "aspect-square max-w-[320px]",
    "16/9": "aspect-video max-w-[480px]",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Badge variant="secondary">{platformName}</Badge>
      
      {/* Video Frame */}
      <div className={`relative ${aspectClasses[aspectRatio]} w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-border`}>
        {/* Phone notch for vertical videos */}
        {aspectRatio === "9/16" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl z-20" />
        )}

        {/* Scene content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${currentScene.gradient} flex flex-col items-center justify-center p-6 text-white`}
          >
            {currentScene.id === "intro" ? (
              <>
                <motion.img
                  src={appIcon}
                  alt="Luna"
                  className="w-20 h-20 rounded-2xl shadow-2xl mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                />
                <motion.h2
                  className="text-2xl font-bold mb-1 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentScene.title}
                </motion.h2>
                <motion.p
                  className="text-white/80 text-center text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {currentScene.subtitle}
                </motion.p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring" }}
                  className="mb-4"
                >
                  {currentScene.icon}
                </motion.div>
                <motion.h2
                  className="text-xl font-bold mb-1 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentScene.title}
                </motion.h2>
                <motion.p
                  className="text-white/80 text-center text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentScene.subtitle}
                </motion.p>
              </>
            )}

            {/* Floating elements */}
            <motion.div
              className="absolute top-16 right-6 w-3 h-3 rounded-full bg-white/30"
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-24 left-8 w-4 h-4 rounded-full bg-white/20"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          className="rounded-full h-10 w-10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          onClick={handlePlayPause}
          className="rounded-full h-12 w-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Scene indicators */}
      <div className="flex gap-1.5">
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
            className={`h-1.5 rounded-full transition-all ${
              index === currentSceneIndex
                ? "w-4 bg-primary"
                : index < currentSceneIndex
                ? "w-1.5 bg-primary/50"
                : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const PromoVideos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Promo Videos</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Platform-Specific Promo Videos</h2>
          <p className="text-muted-foreground">
            Screen record these previews and add music for your marketing campaigns
          </p>
        </div>

        <Tabs defaultValue="tiktok" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            <TabsTrigger value="reels">IG Reels</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="square">Square</TabsTrigger>
          </TabsList>

          <TabsContent value="tiktok" className="mt-8">
            <div className="grid md:grid-cols-2 gap-8 justify-items-center">
              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Quick Hook Video</CardTitle>
                  <CardDescription>9:16 ratio • ~9 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={hookScenes} 
                    aspectRatio="9/16" 
                    platformName="TikTok / Reels"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Couples Feature</CardTitle>
                  <CardDescription>9:16 ratio • ~14 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={couplesScenes} 
                    aspectRatio="9/16" 
                    platformName="Couples Promo"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reels" className="mt-8">
            <div className="grid md:grid-cols-2 gap-8 justify-items-center">
              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Therapy/Wellness Focus</CardTitle>
                  <CardDescription>9:16 ratio • ~11 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={therapyScenes} 
                    aspectRatio="9/16" 
                    platformName="Instagram Reels"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Full App Overview</CardTitle>
                  <CardDescription>9:16 ratio • ~16 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={generalScenes} 
                    aspectRatio="9/16" 
                    platformName="App Overview"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="youtube" className="mt-8">
            <div className="flex flex-col items-center gap-8">
              <Card className="max-w-2xl w-full">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">YouTube Pre-Roll / Shorts</CardTitle>
                  <CardDescription>16:9 ratio • ~16 seconds • Great for YouTube ads</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={generalScenes} 
                    aspectRatio="16/9" 
                    platformName="YouTube"
                  />
                </CardContent>
              </Card>

              <Card className="max-w-2xl w-full">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Couples YouTube Ad</CardTitle>
                  <CardDescription>16:9 ratio • ~14 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={couplesScenes} 
                    aspectRatio="16/9" 
                    platformName="Couples Ad"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="square" className="mt-8">
            <div className="grid md:grid-cols-2 gap-8 justify-items-center">
              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Instagram Feed Post</CardTitle>
                  <CardDescription>1:1 ratio • ~16 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={generalScenes} 
                    aspectRatio="1/1" 
                    platformName="Instagram Feed"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Facebook Ad</CardTitle>
                  <CardDescription>1:1 ratio • ~14 seconds</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <VideoPlayer 
                    scenes={couplesScenes} 
                    aspectRatio="1/1" 
                    platformName="Facebook"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Instructions */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">📱 How to Export Videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Use screen recording on your device to capture the video</li>
              <li>Export sizes:
                <ul className="ml-6 mt-1 space-y-1 list-disc">
                  <li><strong>TikTok/Reels:</strong> 1080×1920 (9:16)</li>
                  <li><strong>YouTube:</strong> 1920×1080 (16:9)</li>
                  <li><strong>Instagram Feed:</strong> 1080×1080 (1:1)</li>
                </ul>
              </li>
              <li>Add trending music or voiceover in your video editor</li>
              <li>Keep videos under 15-30 seconds for best engagement</li>
              <li>Add captions for accessibility</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromoVideos;
