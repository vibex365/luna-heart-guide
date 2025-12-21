import { motion } from "framer-motion";
import { ArrowLeft, Download, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import appIcon1024 from "@/assets/app-icon-1024.png";

// Screenshot frame component
const PhoneFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative w-[280px] h-[560px] bg-background rounded-[3rem] border-[8px] border-foreground/20 shadow-2xl overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground/20 rounded-b-2xl z-10" />
      {/* Screen content */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>
    </div>
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
  </div>
);

// App store feature badge
const FeatureBadge = ({ text }: { text: string }) => (
  <div className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30">
    <span className="text-sm font-medium text-foreground">{text}</span>
  </div>
);

const AppStoreAssets = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">App Store Assets</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* App Icon Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">App Icon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">1024x1024</CardTitle>
                <p className="text-xs text-muted-foreground">App Store</p>
              </CardHeader>
              <CardContent>
                <img 
                  src={appIcon1024} 
                  alt="App Icon 1024" 
                  className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
                />
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">512x512</CardTitle>
                <p className="text-xs text-muted-foreground">Play Store</p>
              </CardHeader>
              <CardContent>
                <img 
                  src={appIcon1024} 
                  alt="App Icon 512" 
                  className="w-16 h-16 mx-auto rounded-xl shadow-lg"
                />
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">180x180</CardTitle>
                <p className="text-xs text-muted-foreground">iOS</p>
              </CardHeader>
              <CardContent>
                <img 
                  src={appIcon1024} 
                  alt="App Icon 180" 
                  className="w-12 h-12 mx-auto rounded-lg shadow-lg"
                />
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">192x192</CardTitle>
                <p className="text-xs text-muted-foreground">Android</p>
              </CardHeader>
              <CardContent>
                <img 
                  src={appIcon1024} 
                  alt="App Icon 192" 
                  className="w-12 h-12 mx-auto rounded-lg shadow-lg"
                />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Screenshot Templates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Screenshot Templates</h2>
          <p className="text-muted-foreground">
            Use these templates for App Store and Play Store listings.
          </p>

          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="ios" className="gap-2">
                <Smartphone className="w-4 h-4" />
                iOS
              </TabsTrigger>
              <TabsTrigger value="android" className="gap-2">
                <Monitor className="w-4 h-4" />
                Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Screenshot 1 - Chat */}
                <PhoneFrame title="AI Relationship Therapist">
                  <div className="w-full h-full bg-gradient-to-b from-[#1a0f2e] to-[#0f0a1a] p-4 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                      <span className="text-white font-medium">Luna</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                        <p className="text-white text-xs">I'm here to listen and help you navigate your feelings. What's on your mind today? 💜</p>
                      </div>
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl rounded-tr-sm p-3 max-w-[80%] ml-auto">
                        <p className="text-white text-xs">I've been feeling disconnected from my partner lately...</p>
                      </div>
                    </div>
                    <div className="mt-auto text-center">
                      <span className="text-xs text-white/50">24/7 AI Support</span>
                    </div>
                  </div>
                </PhoneFrame>

                {/* Screenshot 2 - Mood Tracking */}
                <PhoneFrame title="Track Your Emotions">
                  <div className="w-full h-full bg-gradient-to-b from-[#1a0f2e] to-[#0f0a1a] p-4 flex flex-col items-center justify-center">
                    <h3 className="text-white text-lg font-semibold mb-6">How are you feeling?</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {["😊", "😐", "😔", "😰", "😤", "🥰"].map((emoji, i) => (
                        <div 
                          key={i} 
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${i === 5 ? 'bg-gradient-to-br from-pink-500 to-purple-500 scale-110' : 'bg-white/10'}`}
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 w-full">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                      </div>
                      <p className="text-white/50 text-xs mt-2 text-center">7 day streak 🔥</p>
                    </div>
                  </div>
                </PhoneFrame>

                {/* Screenshot 3 - Couples */}
                <PhoneFrame title="Connect With Your Partner">
                  <div className="w-full h-full bg-gradient-to-b from-[#1a0f2e] to-[#0f0a1a] p-4 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="flex -space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-4 border-[#1a0f2e]" />
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-[#1a0f2e]" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 rounded-full p-1">
                        <span className="text-white text-xs">💕</span>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold mb-2">You're Connected!</h3>
                    <p className="text-white/70 text-xs text-center mb-6">Play games, share moods, and grow together</p>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <span className="text-2xl">🎮</span>
                        <p className="text-white text-xs mt-1">Games</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <span className="text-2xl">💬</span>
                        <p className="text-white text-xs mt-1">Chat</p>
                      </div>
                    </div>
                  </div>
                </PhoneFrame>
              </div>
            </TabsContent>

            <TabsContent value="android" className="mt-6">
              <p className="text-muted-foreground text-center py-8">
                Android screenshots use the same templates. Export as 1080x1920 for Play Store.
              </p>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Feature Badges for Store Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Marketing Keywords</h2>
          <div className="flex flex-wrap gap-2">
            <FeatureBadge text="AI Therapy" />
            <FeatureBadge text="Mood Tracking" />
            <FeatureBadge text="Couples Games" />
            <FeatureBadge text="Relationship Health" />
            <FeatureBadge text="Daily Check-ins" />
            <FeatureBadge text="Private & Secure" />
            <FeatureBadge text="24/7 Support" />
            <FeatureBadge text="Love Languages" />
          </div>
        </motion.section>

        {/* Store Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Store Description</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Short Description (80 chars)</h3>
                <p className="text-muted-foreground text-sm bg-muted p-3 rounded-lg">
                  AI relationship therapist for emotional wellness & couples connection 💜
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Full Description</h3>
                <div className="text-muted-foreground text-sm bg-muted p-3 rounded-lg space-y-2">
                  <p>Luna is your personal AI companion for emotional wellness and relationship health. Whether you're navigating complex feelings, strengthening your bond with a partner, or seeking daily emotional support, Luna is here 24/7.</p>
                  <p><strong>✨ Features:</strong></p>
                  <p>• AI-powered conversations that truly listen and understand<br/>
                  • Mood tracking with personalized insights<br/>
                  • Guided journaling for emotional processing<br/>
                  • Breathing exercises for stress relief<br/>
                  • Couples mode: Link with your partner for shared activities<br/>
                  • Fun relationship games to deepen your connection<br/>
                  • Daily challenges to strengthen your bond<br/>
                  • Relationship health scores and progress tracking</p>
                  <p><strong>💜 Why Luna?</strong></p>
                  <p>Luna provides a judgment-free space for emotional exploration. Our AI is trained to be empathetic, supportive, and helpful—never preachy or dismissive.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default AppStoreAssets;
