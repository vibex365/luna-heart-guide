import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw,
  Target,
  Users,
  Heart,
  MessageSquare,
  Loader2,
  Wand2,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdVariant {
  headline: string;
  subheadline: string;
  cta: string;
  painPoint: string;
}

const STATIC_TEMPLATES = {
  male: {
    singles: [
      {
        headline: "Stop Overthinking. Start Understanding.",
        subheadline: "Luna helps you cut through the noise and get clarity on your relationships.",
        cta: "Get Clear",
        painPoint: "You're stuck in your head about her",
      },
      {
        headline: "What She Really Means",
        subheadline: "AI-powered insights to decode mixed signals and communicate better.",
        cta: "Decode Now",
        painPoint: "Mixed signals driving you crazy",
      },
    ],
    couples: [
      {
        headline: "Be the Partner She Deserves",
        subheadline: "Luna for Couples helps you both grow — together.",
        cta: "Start Together",
        painPoint: "Want to step up your relationship game",
      },
    ],
  },
  female: {
    singles: [
      {
        headline: "You Deserve to Be Heard",
        subheadline: "Luna understands what you're going through — 24/7, judgment-free.",
        cta: "Talk to Luna",
        painPoint: "Feeling unheard and unseen",
      },
      {
        headline: "Your Feelings Are Valid",
        subheadline: "Process emotions, gain clarity, and find peace with AI support.",
        cta: "Start Healing",
        painPoint: "Tired of being told to 'just get over it'",
      },
    ],
    couples: [
      {
        headline: "Finally Feel Connected Again",
        subheadline: "Luna for Couples helps you rediscover each other.",
        cta: "Reconnect",
        painPoint: "Feeling like roommates, not partners",
      },
    ],
  },
  neutral: {
    singles: [
      {
        headline: "Clarity for Your Heart",
        subheadline: "AI-powered emotional support, available whenever you need it.",
        cta: "Start Free",
        painPoint: "Processing complex emotions alone",
      },
    ],
    couples: [
      {
        headline: "Grow Together, Not Apart",
        subheadline: "Luna for Couples: One subscription, two hearts, infinite growth.",
        cta: "Start Together",
        painPoint: "Love each other but struggling to connect",
      },
    ],
  },
};

export const MarketingAdGenerator = () => {
  const [targetGender, setTargetGender] = useState<"male" | "female" | "neutral">("female");
  const [targetType, setTargetType] = useState<"singles" | "couples">("singles");
  const [painPoint, setPainPoint] = useState("");
  const [tone, setTone] = useState("empathetic and empowering");
  const [aiGeneratedAds, setAiGeneratedAds] = useState<AdVariant[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdVariant | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch demographics for AI context
  const { data: demographics } = useQuery({
    queryKey: ["ad-demographics"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("gender");
      const { data: analytics } = await supabase.from("conversation_analytics").select("module_activated").limit(500);
      
      const genderCounts: Record<string, number> = {};
      profiles?.forEach((p) => {
        const g = p.gender || "unknown";
        genderCounts[g] = (genderCounts[g] || 0) + 1;
      });

      const moduleCounts: Record<string, number> = {};
      analytics?.forEach((a) => {
        moduleCounts[a.module_activated] = (moduleCounts[a.module_activated] || 0) + 1;
      });
      const topModules = Object.entries(moduleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k);

      return {
        maleCount: genderCounts.male || 0,
        femaleCount: genderCounts.female || 0,
        topModules,
      };
    },
  });

  // AI generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-ad-copy", {
        body: { targetGender, targetType, painPoint, tone, demographics },
      });
      if (error) throw error;
      return data.variations as AdVariant[];
    },
    onSuccess: (variations) => {
      setAiGeneratedAds(variations);
      toast({ title: "AI generated 3 ad variations!" });
    },
    onError: (error) => {
      console.error("AI generation error:", error);
      toast({ 
        title: "Generation failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    },
  });

  const currentTemplates = STATIC_TEMPLATES[targetGender][targetType];
  const allAds = [...currentTemplates, ...aiGeneratedAds];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Generate downloadable image
  const downloadAsImage = (ad: AdVariant, format: "story" | "feed") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions based on format
    const isStory = format === "story";
    canvas.width = isStory ? 1080 : 1080;
    canvas.height = isStory ? 1920 : 1080;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern overlay
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 100 + 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // Icon placeholder (heart)
    const iconY = isStory ? 600 : 280;
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, iconY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Heart shape
    ctx.fillStyle = "#fff";
    ctx.font = "900 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("♥", canvas.width / 2, iconY + 16);

    // Headline - Extra bold for impact
    const headlineY = isStory ? 800 : 420;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    
    // Word wrap headline
    const headlineWords = ad.headline.split(" ");
    let headlineLine = "";
    let headlineLines: string[] = [];
    headlineWords.forEach((word) => {
      const testLine = headlineLine + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 100) {
        headlineLines.push(headlineLine.trim());
        headlineLine = word + " ";
      } else {
        headlineLine = testLine;
      }
    });
    headlineLines.push(headlineLine.trim());
    
    headlineLines.forEach((line, i) => {
      // Add text shadow for depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(line.toUpperCase(), canvas.width / 2, headlineY + i * 100);
    });
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Subheadline
    const subY = headlineY + headlineLines.length * 100 + 50;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "500 36px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    
    const subWords = ad.subheadline.split(" ");
    let subLine = "";
    let subLines: string[] = [];
    subWords.forEach((word) => {
      const testLine = subLine + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 140) {
        subLines.push(subLine.trim());
        subLine = word + " ";
      } else {
        subLine = testLine;
      }
    });
    subLines.push(subLine.trim());
    
    subLines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, subY + i * 50);
    });

    // CTA Button
    const ctaY = isStory ? 1500 : 850;
    ctx.font = "800 32px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    const ctaWidth = ctx.measureText(ad.cta).width + 100;
    const ctaHeight = 80;
    const ctaX = (canvas.width - ctaWidth) / 2;

    // Button background
    const btnGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
    btnGradient.addColorStop(0, "#ec4899");
    btnGradient.addColorStop(1, "#a855f7");
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 40);
    ctx.fill();

    // Button text
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 32px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(ad.cta.toUpperCase(), canvas.width / 2, ctaY + 52);

    // Target badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "18px -apple-system, BlinkMacSystemFont, sans-serif";
    const targetText = `${targetGender === "male" ? "♂" : targetGender === "female" ? "♀" : "⚧"} ${targetType === "couples" ? "Couples" : "Singles"}`;
    ctx.fillText(targetText, canvas.width / 2, isStory ? 1800 : 980);

    // Download
    const link = document.createElement("a");
    link.download = `luna-ad-${format}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({ title: `${format === "story" ? "Story" : "Feed"} image downloaded!` });
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Ad Generator
          </h2>
          <p className="text-muted-foreground">
            Generate and download targeted ad creatives
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Wand2 className="w-3 h-3" /> AI-Powered
        </Badge>
      </div>

      {/* Targeting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Target Audience & AI Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Target Gender</Label>
              <Select value={targetGender} onValueChange={(v) => setTargetGender(v as typeof targetGender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Women</SelectItem>
                  <SelectItem value="male">Men</SelectItem>
                  <SelectItem value="neutral">All Genders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as typeof targetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Luna (Singles)</SelectItem>
                  <SelectItem value="couples">Luna for Couples</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pain Point Focus</Label>
              <Input 
                placeholder="e.g., overthinking at night"
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empathetic and empowering">Empathetic</SelectItem>
                  <SelectItem value="direct and action-oriented">Direct</SelectItem>
                  <SelectItem value="warm and nurturing">Nurturing</SelectItem>
                  <SelectItem value="bold and confident">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <Button 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Generate AI Ads
            </Button>
            {demographics && (
              <div className="text-xs text-muted-foreground">
                Using data from {demographics.maleCount + demographics.femaleCount} users
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Ad Grid</TabsTrigger>
          <TabsTrigger value="preview">Visual Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAds.map((ad, index) => (
              <Card 
                key={index} 
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedAd === ad ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAd(ad)}
              >
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                  <h3 className="text-xl font-bold tracking-tight mb-2">{ad.headline}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{ad.subheadline}</p>
                  <Button size="sm" className="w-full">{ad.cta}</Button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {targetGender === "male" ? "♂ Men" : targetGender === "female" ? "♀ Women" : "All"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {targetType === "couples" ? "💑 Couples" : "👤 Singles"}
                    </Badge>
                    {index >= currentTemplates.length && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Wand2 className="w-2 h-2" /> AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>Pain Point:</strong> {ad.painPoint}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(`${ad.headline}\n\n${ad.subheadline}\n\n[${ad.cta}]`);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAsImage(ad, "story");
                      }}
                    >
                      <ImageIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Story Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Instagram Story (9:16)</span>
                  <Button 
                    size="sm" 
                    onClick={() => selectedAd && downloadAsImage(selectedAd, "story")}
                    disabled={!selectedAd}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-xl overflow-hidden border shadow-lg">
                  <div className="h-full flex flex-col justify-center items-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center mb-6">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-2 text-white">
                      {selectedAd?.headline || currentTemplates[0]?.headline}
                    </h3>
                    <p className="text-xs text-white/70 mb-6">
                      {selectedAd?.subheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button size="sm" className="w-full max-w-[200px] bg-gradient-to-r from-primary to-pink-500">
                      {selectedAd?.cta || currentTemplates[0]?.cta}
                    </Button>
                    <p className="text-[10px] text-white/40 mt-4">Swipe Up</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Feed Post (1:1)</span>
                  <Button 
                    size="sm" 
                    onClick={() => selectedAd && downloadAsImage(selectedAd, "feed")}
                    disabled={!selectedAd}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square max-w-[320px] mx-auto bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-xl overflow-hidden border shadow-lg">
                  <div className="h-full flex flex-col justify-center items-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/80 flex items-center justify-center mb-8">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-3 text-white">
                      {selectedAd?.headline || currentTemplates[0]?.headline}
                    </h3>
                    <p className="text-sm text-white/70 mb-8">
                      {selectedAd?.subheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button className="w-full max-w-[240px] bg-gradient-to-r from-primary to-pink-500">
                      {selectedAd?.cta || currentTemplates[0]?.cta}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!selectedAd && (
            <p className="text-center text-muted-foreground text-sm">
              Click on an ad in the grid to preview and download
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
