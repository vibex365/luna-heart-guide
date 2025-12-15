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
  Image as ImageIcon,
  Calendar,
  TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdVariant {
  headline: string;
  subheadline: string;
  cta: string;
  painPoint: string;
  accentWords?: string[]; // Words to highlight in pink
}

type AdStyle = "dark" | "light" | "calendar" | "timeline";

const STATIC_TEMPLATES = {
  male: {
    singles: [
      {
        headline: "Stop Overthinking. Start Understanding.",
        subheadline: "Luna helps you cut through the noise and get clarity on your relationships.",
        cta: "Get Clear",
        painPoint: "You're stuck in your head about her",
        accentWords: ["Understanding"],
      },
      {
        headline: "What She Really Means",
        subheadline: "AI-powered insights to decode mixed signals and communicate better.",
        cta: "Decode Now",
        painPoint: "Mixed signals driving you crazy",
        accentWords: ["Really"],
      },
    ],
    couples: [
      {
        headline: "Be the Partner She Deserves",
        subheadline: "Luna for Couples helps you both grow — together.",
        cta: "Start Together",
        painPoint: "Want to step up your relationship game",
        accentWords: ["Deserves"],
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
        accentWords: ["Heard"],
      },
      {
        headline: "Your Feelings Are Valid",
        subheadline: "Process emotions, gain clarity, and find peace with AI support.",
        cta: "Start Healing",
        painPoint: "Tired of being told to 'just get over it'",
        accentWords: ["Valid"],
      },
      {
        headline: "Start Healing Monday",
        subheadline: "Build a healthier routine with Luna",
        cta: "Begin Now",
        painPoint: "Need to start fresh",
        accentWords: ["Monday"],
      },
    ],
    couples: [
      {
        headline: "Finally Feel Connected Again",
        subheadline: "Luna for Couples helps you rediscover each other.",
        cta: "Reconnect",
        painPoint: "Feeling like roommates, not partners",
        accentWords: ["Connected"],
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
        accentWords: ["Heart"],
      },
      {
        headline: "Your Timeline to Thriving",
        subheadline: "30 days from now, you won't recognize yourself",
        cta: "Start Today",
        painPoint: "Ready for transformation",
        accentWords: ["Timeline"],
      },
    ],
    couples: [
      {
        headline: "Grow Together, Not Apart",
        subheadline: "Luna for Couples: One subscription, two hearts, infinite growth.",
        cta: "Start Together",
        painPoint: "Love each other but struggling to connect",
        accentWords: ["Together"],
      },
    ],
  },
};

export const MarketingAdGenerator = () => {
  const [targetGender, setTargetGender] = useState<"male" | "female" | "neutral">("female");
  const [targetType, setTargetType] = useState<"singles" | "couples">("singles");
  const [painPoint, setPainPoint] = useState("");
  const [tone, setTone] = useState("empathetic and empowering");
  const [adStyle, setAdStyle] = useState<AdStyle>("dark");
  const [aiGeneratedAds, setAiGeneratedAds] = useState<AdVariant[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdVariant | null>(null);
  const [watermarkText, setWatermarkText] = useState("Talks With Luna");
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-center" | "bottom-left" | "bottom-right" | "top-center">("bottom-center");
  const [watermarkFontSize, setWatermarkFontSize] = useState<"small" | "medium" | "large">("medium");
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
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to call AI function");
      }
      
      if (!data) {
        throw new Error("No response from AI function");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.variations || !Array.isArray(data.variations)) {
        throw new Error("Invalid response format from AI");
      }
      
      return data.variations as AdVariant[];
    },
    onSuccess: (variations) => {
      // Add accent words to AI generated ads
      const withAccents = variations.map(v => ({
        ...v,
        accentWords: v.headline.split(" ").slice(-1), // Last word as accent
      }));
      setAiGeneratedAds(withAccents);
      toast({ title: "AI generated 3 ad variations!" });
    },
    onError: (error) => {
      console.error("AI generation error:", error);
      toast({ 
        title: "Generation failed", 
        description: error instanceof Error ? error.message : "Please try again later",
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

  // Draw calendar graphic
  const drawCalendar = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const dates = [7, 8, 9, 10, 11, 12, 13];
    const cellWidth = width / 7;
    const cellHeight = 60;
    
    // Draw day headers
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 24px 'Inter', sans-serif";
    ctx.textAlign = "center";
    days.forEach((day, i) => {
      ctx.fillText(day, x + cellWidth * i + cellWidth / 2, y);
    });
    
    // Draw date cells
    dates.forEach((date, i) => {
      const cellX = x + cellWidth * i;
      const cellY = y + 20;
      
      if (i === 1) { // Highlighted day (Monday)
        // Pink gradient background
        const gradient = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth - 10, cellY + cellHeight);
        gradient.addColorStop(0, "#f9a8d4");
        gradient.addColorStop(1, "#ec4899");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(cellX + 5, cellY, cellWidth - 10, cellHeight, 12);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
      } else {
        ctx.fillStyle = "#6b7280";
      }
      
      ctx.font = "600 28px 'Inter', sans-serif";
      ctx.fillText(date.toString(), cellX + cellWidth / 2, cellY + 42);
    });
  };

  // Draw timeline graphic
  const drawTimeline = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
    const stages = [
      { day: "Day 1", label: "crying", emoji: "😢" },
      { day: "Day 15", label: "thinking less", emoji: "🤔" },
      { day: "Day 30", label: "thriving", emoji: "✨" },
    ];
    
    const stageWidth = width / 3;
    
    // Draw connecting line
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 30);
    ctx.lineTo(x + width - 40, y + 30);
    ctx.stroke();
    
    stages.forEach((stage, i) => {
      const stageX = x + stageWidth * i + stageWidth / 2;
      
      // Circle
      const isLast = i === stages.length - 1;
      if (isLast) {
        const gradient = ctx.createRadialGradient(stageX, y + 30, 0, stageX, y + 30, 35);
        gradient.addColorStop(0, "#ec4899");
        gradient.addColorStop(1, "#be185d");
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "#374151";
      }
      ctx.beginPath();
      ctx.arc(stageX, y + 30, 35, 0, Math.PI * 2);
      ctx.fill();
      
      // Emoji
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText(stage.emoji, stageX, y + 42);
      
      // Day label
      ctx.fillStyle = "#9ca3af";
      ctx.font = "500 20px 'Inter', sans-serif";
      ctx.fillText(stage.day, stageX, y + 90);
      
      // Status label
      ctx.fillStyle = "#ffffff";
      ctx.font = "400 22px 'Inter', sans-serif";
      ctx.fillText(stage.label, stageX, y + 120);
    });
  };

  // Draw text with accent word highlighting
  const drawAccentHeadline = (
    ctx: CanvasRenderingContext2D, 
    headline: string, 
    accentWords: string[], 
    x: number, 
    y: number, 
    maxWidth: number,
    isLightMode: boolean
  ) => {
    const words = headline.split(" ");
    const lines: { word: string; isAccent: boolean }[][] = [];
    let currentLine: { word: string; isAccent: boolean }[] = [];
    
    ctx.font = "900 104px 'Inter', 'SF Pro Display', -apple-system, sans-serif";
    
    words.forEach((word) => {
      const testLine = currentLine.map(w => w.word).join(" ") + (currentLine.length ? " " : "") + word;
      const metrics = ctx.measureText(testLine.toUpperCase());
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
      
      const isAccent = accentWords.some(a => word.toLowerCase().includes(a.toLowerCase()));
      currentLine.push({ word, isAccent });
    });
    if (currentLine.length) lines.push(currentLine);
    
    lines.forEach((line, lineIndex) => {
      const lineText = line.map(w => w.word).join(" ").toUpperCase();
      const lineWidth = ctx.measureText(lineText).width;
      let currentX = x - lineWidth / 2;
      
      line.forEach((wordObj, wordIndex) => {
        const wordText = wordObj.word.toUpperCase() + (wordIndex < line.length - 1 ? " " : "");
        
        if (wordObj.isAccent) {
          ctx.fillStyle = "#ec4899"; // Pink accent
        } else {
          ctx.fillStyle = isLightMode ? "#1f2937" : "#ffffff";
        }
        
        ctx.shadowColor = isLightMode ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(wordText, currentX + ctx.measureText(wordText).width / 2, y + lineIndex * 120);
        currentX += ctx.measureText(wordText).width;
      });
    });
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    return lines.length;
  };

  // Generate downloadable image with style variants
  const downloadAsImage = (ad: AdVariant, format: "story" | "feed", style: AdStyle = adStyle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isStory = format === "story";
    canvas.width = isStory ? 1080 : 1080;
    canvas.height = isStory ? 1920 : 1080;
    
    const isLightMode = style === "light" || style === "calendar";

    // Background based on style
    if (isLightMode) {
      // Light mode - soft pink/white gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#fdf2f8");
      gradient.addColorStop(0.5, "#fce7f3");
      gradient.addColorStop(1, "#fbcfe8");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (style === "timeline") {
      // Dark gradient with red/pink tint
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f0f0f");
      gradient.addColorStop(0.5, "#1a0a14");
      gradient.addColorStop(1, "#2d0a1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Default dark mode
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f0f23");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Style-specific graphics
    if (style === "calendar") {
      const calendarY = isStory ? 400 : 180;
      drawCalendar(ctx, canvas.width / 2 - 280, calendarY, 560);
    } else if (style === "timeline") {
      const timelineY = isStory ? 350 : 150;
      drawTimeline(ctx, 80, timelineY, canvas.width - 160);
    } else {
      // Heart icon for default styles
      const iconY = isStory ? 500 : 220;
      const gradient = ctx.createRadialGradient(canvas.width / 2, iconY, 0, canvas.width / 2, iconY, 60);
      gradient.addColorStop(0, "#ec4899");
      gradient.addColorStop(1, "#a855f7");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, iconY, 60, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.font = "900 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("♥", canvas.width / 2, iconY + 16);
    }

    // Headline with accent words
    const headlineY = style === "calendar" ? (isStory ? 720 : 420) : 
                      style === "timeline" ? (isStory ? 700 : 450) : 
                      (isStory ? 700 : 380);
    
    ctx.textAlign = "center";
    const accentWords = ad.accentWords || [];
    const linesCount = drawAccentHeadline(
      ctx, 
      ad.headline, 
      accentWords, 
      canvas.width / 2, 
      headlineY, 
      canvas.width - 100,
      isLightMode
    );

    // Subheadline
    const subY = headlineY + linesCount * 120 + 60;
    ctx.fillStyle = isLightMode ? "rgba(107, 114, 128, 1)" : "rgba(255, 255, 255, 0.85)";
    ctx.font = "600 48px 'Inter', -apple-system, sans-serif";
    ctx.textAlign = "center";
    
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
      ctx.fillText(line, canvas.width / 2, subY + i * 60);
    });

    // CTA Button
    const ctaY = isStory ? 1500 : 850;
    ctx.font = "900 44px 'Inter', -apple-system, sans-serif";
    const ctaWidth = ctx.measureText(ad.cta.toUpperCase()).width + 120;
    const ctaHeight = 96;
    const ctaX = (canvas.width - ctaWidth) / 2;

    const btnGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
    btnGradient.addColorStop(0, "#ec4899");
    btnGradient.addColorStop(1, "#a855f7");
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 48);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 44px 'Inter', -apple-system, sans-serif";
    ctx.fillText(ad.cta.toUpperCase(), canvas.width / 2, ctaY + 62);

    // Brand watermark with customization
    const wmFontSizes = { small: 28, medium: 40, large: 52 };
    const wmSize = wmFontSizes[watermarkFontSize];
    ctx.fillStyle = isLightMode ? "rgba(107, 114, 128, 0.6)" : "rgba(255, 255, 255, 0.4)";
    ctx.font = `700 ${wmSize}px 'Inter', sans-serif`;
    
    // Calculate watermark position
    let wmX = canvas.width / 2;
    let wmY = isStory ? 1820 : 1020;
    ctx.textAlign = "center";
    
    if (watermarkPosition === "bottom-left") {
      wmX = 80;
      ctx.textAlign = "left";
    } else if (watermarkPosition === "bottom-right") {
      wmX = canvas.width - 80;
      ctx.textAlign = "right";
    } else if (watermarkPosition === "top-center") {
      wmY = isStory ? 100 : 60;
    }
    
    ctx.fillText(watermarkText, wmX, wmY);

    // Download
    const link = document.createElement("a");
    link.download = `luna-ad-${style}-${format}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({ title: `${style} ${format} image downloaded!` });
  };

  // Render headline with accent highlighting for preview
  const renderAccentHeadline = (headline: string, accentWords: string[] = []) => {
    const words = headline.split(" ");
    return words.map((word, i) => {
      const isAccent = accentWords.some(a => word.toLowerCase().includes(a.toLowerCase()));
      return (
        <span key={i} className={isAccent ? "text-pink-500" : ""}>
          {word}{i < words.length - 1 ? " " : ""}
        </span>
      );
    });
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
            Generate and download targeted ad creatives with multiple styles
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
            Target Audience & Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
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
              <Label>Ad Style</Label>
              <Select value={adStyle} onValueChange={(v) => setAdStyle(v as AdStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="calendar">Calendar Style</SelectItem>
                  <SelectItem value="timeline">Timeline Style</SelectItem>
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
          
          {/* Watermark Customization */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-medium mb-3 block">Brand Watermark</Label>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Watermark Text</Label>
                <Input 
                  placeholder="Talks With Luna"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Position</Label>
                <Select value={watermarkPosition} onValueChange={(v) => setWatermarkPosition(v as typeof watermarkPosition)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <Select value={watermarkFontSize} onValueChange={(v) => setWatermarkFontSize(v as typeof watermarkFontSize)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (28px)</SelectItem>
                    <SelectItem value="medium">Medium (40px)</SelectItem>
                    <SelectItem value="large">Large (52px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <div className={`p-6 ${
                  adStyle === "light" || adStyle === "calendar" 
                    ? "bg-gradient-to-br from-pink-50 to-pink-100" 
                    : "bg-gradient-to-br from-slate-900 to-slate-800"
                }`}>
                  <h3 className={`text-xl font-black tracking-tight mb-2 ${
                    adStyle === "light" || adStyle === "calendar" ? "text-slate-900" : "text-white"
                  }`}>
                    {renderAccentHeadline(ad.headline, ad.accentWords)}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    adStyle === "light" || adStyle === "calendar" ? "text-slate-600" : "text-white/70"
                  }`}>
                    {ad.subheadline}
                  </p>
                  <Button size="sm" className="w-full bg-gradient-to-r from-pink-500 to-purple-500">
                    {ad.cta}
                  </Button>
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
          {/* Style selector for preview */}
          <div className="flex gap-2 flex-wrap">
            {(["dark", "light", "calendar", "timeline"] as AdStyle[]).map((style) => (
              <Button
                key={style}
                size="sm"
                variant={adStyle === style ? "default" : "outline"}
                onClick={() => setAdStyle(style)}
                className="capitalize"
              >
                {style === "calendar" && <Calendar className="w-3 h-3 mr-1" />}
                {style === "timeline" && <TrendingUp className="w-3 h-3 mr-1" />}
                {style}
              </Button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Story Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Instagram Story (9:16)</span>
                  <Button 
                    size="sm" 
                    onClick={() => downloadAsImage(selectedAd || currentTemplates[0], "story")}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`aspect-[9/16] max-w-[280px] mx-auto rounded-xl overflow-hidden border shadow-lg relative ${
                  adStyle === "light" || adStyle === "calendar"
                    ? "bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200"
                    : adStyle === "timeline"
                    ? "bg-gradient-to-b from-[#0f0f0f] via-[#1a0a14] to-[#2d0a1a]"
                    : "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]"
                }`}>
                  <div className="h-full flex flex-col justify-center items-center p-6 text-center">
                    {adStyle === "calendar" && (
                      <div className="flex gap-1 mb-4">
                        {["S", "M", "T", "W", "T", "F"].map((d, i) => (
                          <div key={i} className={`w-8 h-10 rounded-lg flex items-center justify-center text-xs font-semibold ${
                            i === 1 ? "bg-gradient-to-b from-pink-300 to-pink-500 text-white" : "bg-white/60 text-gray-500"
                          }`}>
                            {7 + i}
                          </div>
                        ))}
                      </div>
                    )}
                    {adStyle === "timeline" && (
                      <div className="flex items-center gap-2 mb-4">
                        {["😢", "🤔", "✨"].map((emoji, i) => (
                          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            i === 2 ? "bg-pink-500" : "bg-gray-700"
                          }`}>
                            {emoji}
                          </div>
                        ))}
                      </div>
                    )}
                    {(adStyle === "dark" || adStyle === "light") && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-4">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h3 className={`text-base font-black tracking-tight mb-2 ${
                      adStyle === "light" || adStyle === "calendar" ? "text-slate-900" : "text-white"
                    }`}>
                      {renderAccentHeadline(
                        selectedAd?.headline || currentTemplates[0]?.headline,
                        selectedAd?.accentWords || currentTemplates[0]?.accentWords
                      )}
                    </h3>
                    <p className={`text-xs mb-4 ${
                      adStyle === "light" || adStyle === "calendar" ? "text-gray-600" : "text-white/70"
                    }`}>
                      {selectedAd?.subheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button size="sm" className="w-full max-w-[180px] bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-bold">
                      {selectedAd?.cta || currentTemplates[0]?.cta}
                    </Button>
                  </div>
                  {/* Watermark Preview */}
                  <div className={`absolute px-3 font-bold ${
                    adStyle === "light" || adStyle === "calendar" ? "text-gray-500/60" : "text-white/40"
                  } ${
                    watermarkFontSize === "small" ? "text-[8px]" : watermarkFontSize === "medium" ? "text-[10px]" : "text-xs"
                  } ${
                    watermarkPosition === "bottom-center" ? "bottom-2 left-0 right-0 text-center" :
                    watermarkPosition === "bottom-left" ? "bottom-2 left-3 text-left" :
                    watermarkPosition === "bottom-right" ? "bottom-2 right-3 text-right" :
                    "top-2 left-0 right-0 text-center"
                  }`}>
                    {watermarkText}
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
                    onClick={() => downloadAsImage(selectedAd || currentTemplates[0], "feed")}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`aspect-square max-w-[320px] mx-auto rounded-xl overflow-hidden border shadow-lg relative ${
                  adStyle === "light" || adStyle === "calendar"
                    ? "bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200"
                    : adStyle === "timeline"
                    ? "bg-gradient-to-b from-[#0f0f0f] via-[#1a0a14] to-[#2d0a1a]"
                    : "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]"
                }`}>
                  <div className="h-full flex flex-col justify-center items-center p-6 text-center">
                    {adStyle === "calendar" && (
                      <div className="flex gap-1 mb-6">
                        {["S", "M", "T", "W", "T", "F"].map((d, i) => (
                          <div key={i} className={`w-10 h-12 rounded-lg flex items-center justify-center text-sm font-semibold ${
                            i === 1 ? "bg-gradient-to-b from-pink-300 to-pink-500 text-white" : "bg-white/60 text-gray-500"
                          }`}>
                            {7 + i}
                          </div>
                        ))}
                      </div>
                    )}
                    {adStyle === "timeline" && (
                      <div className="flex items-center gap-3 mb-6">
                        {["😢", "🤔", "✨"].map((emoji, i) => (
                          <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                            i === 2 ? "bg-pink-500" : "bg-gray-700"
                          }`}>
                            {emoji}
                          </div>
                        ))}
                      </div>
                    )}
                    {(adStyle === "dark" || adStyle === "light") && (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-6">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <h3 className={`text-xl font-black tracking-tight mb-3 ${
                      adStyle === "light" || adStyle === "calendar" ? "text-slate-900" : "text-white"
                    }`}>
                      {renderAccentHeadline(
                        selectedAd?.headline || currentTemplates[0]?.headline,
                        selectedAd?.accentWords || currentTemplates[0]?.accentWords
                      )}
                    </h3>
                    <p className={`text-sm mb-6 ${
                      adStyle === "light" || adStyle === "calendar" ? "text-gray-600" : "text-white/70"
                    }`}>
                      {selectedAd?.subheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button className="w-full max-w-[220px] bg-gradient-to-r from-pink-500 to-purple-500 font-bold">
                      {selectedAd?.cta || currentTemplates[0]?.cta}
                    </Button>
                  </div>
                  {/* Watermark Preview */}
                  <div className={`absolute px-3 font-bold ${
                    adStyle === "light" || adStyle === "calendar" ? "text-gray-500/60" : "text-white/40"
                  } ${
                    watermarkFontSize === "small" ? "text-[10px]" : watermarkFontSize === "medium" ? "text-xs" : "text-sm"
                  } ${
                    watermarkPosition === "bottom-center" ? "bottom-3 left-0 right-0 text-center" :
                    watermarkPosition === "bottom-left" ? "bottom-3 left-3 text-left" :
                    watermarkPosition === "bottom-right" ? "bottom-3 right-3 text-right" :
                    "top-3 left-0 right-0 text-center"
                  }`}>
                    {watermarkText}
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
