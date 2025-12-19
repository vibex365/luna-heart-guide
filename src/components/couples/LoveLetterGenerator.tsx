import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  PenLine, 
  Shuffle, 
  Copy, 
  Send, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { 
  loveLetterTemplates, 
  loveQuotes, 
  categoryColors,
  LetterTemplate 
} from "@/data/loveLetterTemplates";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notifyPartner } from "@/utils/smsNotifications";

interface LoveLetterGeneratorProps {
  partnerLinkId?: string;
}

type Step = "category" | "template" | "compose" | "preview";

export const LoveLetterGenerator = ({ partnerLinkId }: LoveLetterGeneratorProps) => {
  const { partnerId } = useCouplesAccount();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [opening, setOpening] = useState("");
  const [body, setBody] = useState("");
  const [closing, setClosing] = useState("");
  const [copied, setCopied] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // Fetch partner name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .single();
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch current user's name
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-letter", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const myName = myProfile?.display_name || "Your love";
  const partnerName = partnerProfile?.display_name || "Love";

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async () => {
      if (!partnerId) throw new Error("No partner linked");
      const letterContent = getFullLetter();
      const success = await notifyPartner.loveLetter(partnerId, myName, letterContent);
      if (!success) throw new Error("SMS not sent - partner may not have SMS enabled");
      return success;
    },
    onSuccess: () => {
      setSmsSent(true);
      toast.success("Love letter sent via SMS! 💕", {
        description: `${partnerName} will receive your letter on their phone.`,
      });
      setTimeout(() => setSmsSent(false), 3000);
    },
    onError: (error) => {
      toast.error("Couldn't send SMS", {
        description: error instanceof Error ? error.message : "Partner may not have SMS notifications enabled.",
      });
    },
  });

  const categories = [...new Set(loveLetterTemplates.map(t => t.category))];
  const templatesInCategory = loveLetterTemplates.filter(t => t.category === selectedCategory);

  const getRandomPrompt = (prompts: string[]) => {
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const getRandomQuote = () => {
    return loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setStep("template");
  };

  const handleSelectTemplate = (template: LetterTemplate) => {
    setSelectedTemplate(template);
    setOpening(template.openings[0].replace("[Name]", partnerName));
    setBody("");
    setClosing(template.closings[0]);
    setStep("compose");
  };

  const shuffleOpening = () => {
    if (!selectedTemplate) return;
    const newOpening = getRandomPrompt(selectedTemplate.openings).replace("[Name]", partnerName);
    setOpening(newOpening);
  };

  const shuffleClosing = () => {
    if (!selectedTemplate) return;
    setClosing(getRandomPrompt(selectedTemplate.closings));
  };

  const insertPrompt = () => {
    if (!selectedTemplate) return;
    const prompt = getRandomPrompt(selectedTemplate.bodyPrompts);
    setBody(prev => prev + (prev ? "\n\n" : "") + prompt);
  };

  const insertQuote = () => {
    const quote = getRandomQuote();
    setBody(prev => prev + (prev ? "\n\n" : "") + `"${quote}"`);
  };

  const getFullLetter = () => {
    return `${opening}\n\n${body}\n\n${closing}`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getFullLetter());
    setCopied(true);
    toast.success("Love letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLetter = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "A Love Letter For You",
          text: getFullLetter(),
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const resetGenerator = () => {
    setStep("category");
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setOpening("");
    setBody("");
    setClosing("");
  };

  return (
    <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-rose-400" />
          Love Letter Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Choose the type of letter you want to write:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    className={`h-auto py-3 flex flex-col items-center gap-1 ${categoryColors[category]}`}
                    onClick={() => handleSelectCategory(category)}
                  >
                    <span className="capitalize font-medium">{category.replace("-", " ")}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Template Selection */}
          {step === "template" && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("category")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground capitalize">
                  {selectedCategory?.replace("-", " ")} Letters
                </span>
              </div>
              <div className="space-y-2">
                {templatesInCategory.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="w-full justify-between h-auto py-3"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <span>{template.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Compose Letter */}
          {step === "compose" && selectedTemplate && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("template")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Badge className={categoryColors[selectedTemplate.category]}>
                  {selectedTemplate.name}
                </Badge>
              </div>

              {/* Opening */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Opening</label>
                  <Button variant="ghost" size="sm" onClick={shuffleOpening}>
                    <Shuffle className="w-3 h-3 mr-1" />
                    Shuffle
                  </Button>
                </div>
                <Textarea
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  className="min-h-[60px] bg-background/50"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Message</label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={insertPrompt}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Prompt
                    </Button>
                    <Button variant="ghost" size="sm" onClick={insertQuote}>
                      <Heart className="w-3 h-3 mr-1" />
                      Quote
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write from the heart... Use the buttons above for inspiration!"
                  className="min-h-[150px] bg-background/50"
                />
              </div>

              {/* Closing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Closing</label>
                  <Button variant="ghost" size="sm" onClick={shuffleClosing}>
                    <Shuffle className="w-3 h-3 mr-1" />
                    Shuffle
                  </Button>
                </div>
                <Textarea
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  className="min-h-[60px] bg-background/50"
                />
              </div>

              <Button
                onClick={() => setStep("preview")}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500"
                disabled={!body.trim()}
              >
                Preview Letter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Preview & Share */}
          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("compose")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>

              <ScrollArea className="h-[300px] rounded-lg border border-rose-500/20 bg-background/50 p-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="italic text-rose-300">{opening}</p>
                  <div className="my-4 whitespace-pre-wrap">{body}</div>
                  <p className="italic text-rose-300">{closing}</p>
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  onClick={shareLetter}
                  variant="outline"
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {partnerId && (
                <Button
                  onClick={() => sendSmsMutation.mutate()}
                  disabled={sendSmsMutation.isPending || smsSent}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500"
                >
                  {smsSent ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Sent to {partnerName}!
                    </>
                  ) : sendSmsMutation.isPending ? (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send via SMS to {partnerName}
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={resetGenerator}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
              >
                Write Another Letter
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
