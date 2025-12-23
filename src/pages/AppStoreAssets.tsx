import { motion } from "framer-motion";
import { ArrowLeft, Download, Smartphone, Monitor, Tablet, Video, Image, FileText, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import appIcon1024 from "@/assets/app-icon-1024.png";
import lunaIcon from "@/assets/luna-icon-512.png";
import ogImage from "@/assets/luna-og-image.png";
import InteractiveDemo from "@/components/InteractiveDemo";

// Screenshot frame component with download capability
const PhoneFrame = ({ children, title, screenshotId }: { children: React.ReactNode; title: string; screenshotId: string }) => {
  const frameRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!frameRef.current) return;
    
    try {
      toast.info("Generating screenshot...");
      
      // Get the screen content element (skip the frame border)
      const screenContent = frameRef.current.querySelector('.screen-content') as HTMLElement;
      if (!screenContent) return;
      
      const canvas = await html2canvas(screenContent, {
        scale: 3, // High resolution
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `luna-screenshot-${screenshotId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Screenshot downloaded!");
    } catch (error) {
      console.error("Screenshot error:", error);
      toast.error("Failed to generate screenshot");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={frameRef} className="relative w-[280px] h-[560px] bg-background rounded-[3rem] border-[8px] border-foreground/20 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground/20 rounded-b-2xl z-10" />
        {/* Screen content */}
        <div className="screen-content w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1">
        <Download className="w-3 h-3" />
        Download
      </Button>
    </div>
  );
};

// App store feature badge
const FeatureBadge = ({ text }: { text: string }) => (
  <div className="px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30">
    <span className="text-sm font-medium text-foreground">{text}</span>
  </div>
);

// Download card component
const DownloadCard = ({ title, description, icon: Icon, downloadUrl, fileName }: { 
  title: string; 
  description: string; 
  icon: any; 
  downloadUrl: string;
  fileName: string;
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardContent>
    </Card>
  );
};

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

        {/* Real App Screenshots */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">App Screenshots</h2>
          <p className="text-muted-foreground">
            Real screenshots from the app for App Store and Play Store listings.
          </p>

          <Tabs defaultValue="iphone" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="iphone" className="gap-2">
                <Smartphone className="w-4 h-4" />
                iPhone
              </TabsTrigger>
              <TabsTrigger value="ipad" className="gap-2">
                <Tablet className="w-4 h-4" />
                iPad
              </TabsTrigger>
              <TabsTrigger value="android" className="gap-2">
                <Monitor className="w-4 h-4" />
                Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iphone" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ios-chat-screenshot.png" 
                      alt="Luna AI Chat" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ios-chat-screenshot.png" 
                      download="luna-ios-chat.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Mood Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ios-mood-screenshot.png" 
                      alt="Mood Tracking" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ios-mood-screenshot.png" 
                      download="luna-ios-mood.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Couples Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ios-couples-screenshot.png" 
                      alt="Couples Mode" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ios-couples-screenshot.png" 
                      download="luna-ios-couples.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ipad" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ipad-chat-screenshot.png" 
                      alt="Luna AI Chat - iPad" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ipad-chat-screenshot.png" 
                      download="luna-ipad-chat.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Mood Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ipad-mood-screenshot.png" 
                      alt="Mood Tracking - iPad" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ipad-mood-screenshot.png" 
                      download="luna-ipad-mood.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Couples Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <img 
                      src="/screenshots/ipad-couples-screenshot.png" 
                      alt="Couples Mode - iPad" 
                      className="w-full rounded-lg shadow-lg"
                    />
                    <a 
                      href="/screenshots/ipad-couples-screenshot.png" 
                      download="luna-ipad-couples.png"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="android" className="mt-6">
              <p className="text-muted-foreground text-center py-8">
                Use the iPhone screenshots for Android. Export/resize as 1080x1920 for Play Store.
              </p>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Interactive Demo Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Interactive Demo</h2>
          <p className="text-muted-foreground">
            Embed this interactive demo on your landing page or use it for app preview videos.
          </p>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <InteractiveDemo />
            </CardContent>
          </Card>
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
                  • Relationship health scores and progress tracking<br/>
                  • Daily Questions to spark meaningful conversations<br/>
                  • Virtual Love Coins economy for fun gifts</p>
                  <p><strong>💜 Why Luna?</strong></p>
                  <p>Luna provides a judgment-free space for emotional exploration. Our AI is trained to be empathetic, supportive, and helpful—never preachy or dismissive.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Downloadable Assets */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Downloadable Assets</h2>
          <p className="text-muted-foreground">Click to download marketing assets for your campaigns.</p>
          
          <div className="grid gap-3">
            <DownloadCard
              title="App Icon (1024x1024)"
              description="High-res icon for App Store & marketing"
              icon={Image}
              downloadUrl={appIcon1024}
              fileName="luna-app-icon-1024.png"
            />
            <DownloadCard
              title="Luna Avatar"
              description="512x512 Luna character icon"
              icon={Image}
              downloadUrl={lunaIcon}
              fileName="luna-avatar-512.png"
            />
            <DownloadCard
              title="Open Graph Image"
              description="Social media preview image"
              icon={Image}
              downloadUrl={ogImage}
              fileName="luna-og-image.png"
            />
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Promo Video Template</h4>
                    <p className="text-xs text-muted-foreground">View the promo video page</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/promo-video')}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">All App Icons (ZIP)</h4>
                    <p className="text-xs text-muted-foreground">Multiple sizes for iOS & Android</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  // Download individual icons
                  const icons = [
                    { url: '/icons/icon-72x72.png', name: 'icon-72x72.png' },
                    { url: '/icons/icon-96x96.png', name: 'icon-96x96.png' },
                    { url: '/icons/icon-128x128.png', name: 'icon-128x128.png' },
                    { url: '/icons/icon-192x192.png', name: 'icon-192x192.png' },
                    { url: '/icons/icon-512x512.png', name: 'icon-512x512.png' },
                  ];
                  icons.forEach((icon, i) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = icon.url;
                      link.download = icon.name;
                      link.click();
                    }, i * 300);
                  });
                }}>
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AppStoreAssets;
