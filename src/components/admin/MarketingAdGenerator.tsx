import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw,
  Target,
  Users,
  Heart,
  MessageSquare
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdVariant {
  headline: string;
  subheadline: string;
  cta: string;
  painPoint: string;
}

const AD_TEMPLATES = {
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
      {
        headline: "Better Communication. Better Relationships.",
        subheadline: "Learn to express what you mean without the drama.",
        cta: "Start Now",
        painPoint: "Tired of arguments that go nowhere",
      },
    ],
    couples: [
      {
        headline: "Be the Partner She Deserves",
        subheadline: "Luna for Couples helps you both grow — together.",
        cta: "Start Together",
        painPoint: "Want to step up your relationship game",
      },
      {
        headline: "Fix It Before It Breaks",
        subheadline: "Tools to strengthen your relationship, not just react to problems.",
        cta: "Build Stronger",
        painPoint: "You know things could be better",
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
      {
        headline: "Untangle the Thoughts at 2am",
        subheadline: "When your mind won't stop, Luna listens without judgment.",
        cta: "Find Peace",
        painPoint: "Can't stop overthinking at night",
      },
    ],
    couples: [
      {
        headline: "Finally Feel Connected Again",
        subheadline: "Luna for Couples helps you rediscover each other.",
        cta: "Reconnect",
        painPoint: "Feeling like roommates, not partners",
      },
      {
        headline: "He'll Never Understand — Unless...",
        subheadline: "Tools that help both of you communicate and grow together.",
        cta: "Try Together",
        painPoint: "Wishing he could see your perspective",
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
      {
        headline: "Your Safe Space to Process",
        subheadline: "No judgment. No advice you didn't ask for. Just understanding.",
        cta: "Talk Now",
        painPoint: "Need someone who just listens",
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
  const [customHeadline, setCustomHeadline] = useState("");
  const [customSubheadline, setCustomSubheadline] = useState("");
  const [customCta, setCustomCta] = useState("");

  // Fetch gender distribution for targeting insights
  const { data: demographics } = useQuery({
    queryKey: ["ad-demographics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("gender");
      
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        const gender = p.gender || "unknown";
        counts[gender] = (counts[gender] || 0) + 1;
      });

      return counts;
    },
  });

  const currentTemplates = AD_TEMPLATES[targetGender][targetType];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const downloadAdCopy = (ad: AdVariant) => {
    const content = `
HEADLINE: ${ad.headline}

SUBHEADLINE: ${ad.subheadline}

CTA BUTTON: ${ad.cta}

TARGET PAIN POINT: ${ad.painPoint}

---
Target: ${targetGender.toUpperCase()} | ${targetType.toUpperCase()}
Generated: ${new Date().toISOString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-copy-${targetGender}-${targetType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Ad copy downloaded" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Ad Generator
          </h2>
          <p className="text-muted-foreground">
            Clean, minimalist ad copy targeted by demographic
          </p>
        </div>
      </div>

      {/* Targeting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Target Audience
          </CardTitle>
          <CardDescription>Select your target demographic for tailored ad copy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
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
              <Label>Product Type</Label>
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
              <Label>User Distribution</Label>
              <div className="flex items-center gap-2 h-10">
                {demographics && (
                  <div className="flex gap-1 text-xs">
                    <Badge variant="outline">♂ {demographics.male || 0}</Badge>
                    <Badge variant="outline">♀ {demographics.female || 0}</Badge>
                    <Badge variant="outline">⚧ {demographics["non-binary"] || 0}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Ad Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Copy</TabsTrigger>
          <TabsTrigger value="preview">Visual Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTemplates.map((ad, index) => (
              <Card key={index} className="overflow-hidden">
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
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>Pain Point:</strong> {ad.painPoint}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.subheadline}\n\n[${ad.cta}]`)}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAdCopy(ad)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Custom Ad Copy</CardTitle>
              <CardDescription>Write your own ad copy with demographic targeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Textarea
                  placeholder="Your attention-grabbing headline..."
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Textarea
                  placeholder="Supporting message..."
                  value={customSubheadline}
                  onChange={(e) => setCustomSubheadline(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Textarea
                  placeholder="Start Free, Try Now, etc."
                  value={customCta}
                  onChange={(e) => setCustomCta(e.target.value)}
                  className="min-h-[40px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(`${customHeadline}\n\n${customSubheadline}\n\n[${customCta}]`)}
                  disabled={!customHeadline}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Ad Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomHeadline("");
                    setCustomSubheadline("");
                    setCustomCta("");
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Instagram Story Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instagram Story</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-gradient-to-br from-background to-muted rounded-xl overflow-hidden border shadow-lg">
                  <div className="h-full flex flex-col justify-center items-center p-6 text-center">
                    <Heart className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-lg font-bold tracking-tight mb-2">
                      {customHeadline || currentTemplates[0]?.headline}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      {customSubheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button size="sm" className="w-full max-w-[200px]">
                      {customCta || currentTemplates[0]?.cta}
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-4">Swipe Up</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Post Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feed Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square max-w-[320px] mx-auto bg-gradient-to-br from-background to-muted rounded-xl overflow-hidden border shadow-lg">
                  <div className="h-full flex flex-col justify-center items-center p-8 text-center">
                    <MessageSquare className="w-16 h-16 text-primary mb-6" />
                    <h3 className="text-2xl font-bold tracking-tight mb-3">
                      {customHeadline || currentTemplates[0]?.headline}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8">
                      {customSubheadline || currentTemplates[0]?.subheadline}
                    </p>
                    <Button className="w-full max-w-[240px]">
                      {customCta || currentTemplates[0]?.cta}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Targeting Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Target age: 18-45 for singles, 25-45 for couples</li>
                <li>• Interests: Relationship advice, self-improvement, mental health</li>
                <li>• Exclude: Dating apps, hookup culture content</li>
                <li>• Best times: 8-10pm (overthinking hours), 7-9am (morning reflection)</li>
                <li>• Platform optimization: Stories for urgency, Feed for consideration</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
