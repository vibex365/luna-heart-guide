import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Sparkles, Sun, Moon, Coffee, MessageCircleHeart, Smile, HandHeart, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface LoveMessageSenderProps {
  partnerLinkId: string | undefined;
  partnerName?: string;
}

const MESSAGE_TYPES = [
  { id: "morning", label: "Good Morning", icon: Sun, color: "from-amber-500 to-orange-500" },
  { id: "midday", label: "Thinking of You", icon: Coffee, color: "from-rose-500 to-pink-500" },
  { id: "evening", label: "Good Evening", icon: Moon, color: "from-indigo-500 to-purple-500" },
  { id: "sweet", label: "Sweet & Romantic", icon: Heart, color: "from-red-500 to-rose-500" },
  { id: "flirty", label: "Playful & Flirty", icon: Smile, color: "from-pink-500 to-fuchsia-500" },
  { id: "supportive", label: "Supportive", icon: HandHeart, color: "from-teal-500 to-emerald-500" },
];

const COIN_COST = 5;

export const LoveMessageSender = ({ partnerLinkId, partnerName = "your partner" }: LoveMessageSenderProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const handleGeneratePreview = async () => {
    if (!selectedType && !customMessage.trim()) {
      toast.error("Please select a message type or write your own");
      return;
    }

    if (customMessage.trim()) {
      setPreviewMessage(customMessage);
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      // Generate preview without sending
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are Luna, a romantic AI assistant. Generate a heartfelt love message. Only output the message itself, no quotes. Keep it under 160 characters."
            },
            {
              role: "user",
              content: `Generate a ${selectedType} message for someone to send to their partner.`
            }
          ],
        }),
      });

      // Note: This is a simplified preview - actual generation happens in edge function
      // For now, show placeholder
      const typeLabel = MESSAGE_TYPES.find(t => t.id === selectedType)?.label || selectedType;
      setPreviewMessage(`✨ Luna will generate a ${typeLabel.toLowerCase()} message just for ${partnerName}!`);
    } catch (error) {
      console.error("Preview error:", error);
      const typeLabel = MESSAGE_TYPES.find(t => t.id === selectedType)?.label || selectedType;
      setPreviewMessage(`✨ Luna will generate a ${typeLabel.toLowerCase()} message for ${partnerName}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!partnerLinkId) {
      toast.error("Partner not linked");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-love-message", {
        body: {
          messageType: selectedType,
          customMessage: customMessage.trim() || undefined,
          partnerLinkId,
        },
      });

      if (error) throw error;

      if (data.error === "Insufficient coins") {
        toast.error(`You need ${data.required} coins. You have ${data.balance}.`);
        return;
      }

      if (data.error) throw new Error(data.error);

      toast.success(`Message sent to ${partnerName}! 💕`);
      queryClient.invalidateQueries({ queryKey: ["user-coins"] });
      
      // Reset state
      setSelectedType(null);
      setCustomMessage("");
      setPreviewMessage(null);
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-pink-500/20 bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-purple-50/50 dark:from-pink-950/20 dark:via-rose-950/10 dark:to-purple-950/20 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <MessageCircleHeart className="w-5 h-5 text-pink-500" />
            Love Messages
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Coins className="w-3 h-3 mr-1" />
            {COIN_COST} coins
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Send Luna-generated love messages directly to {partnerName}'s phone
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Type Selection */}
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedType(isSelected ? null : type.id);
                  setPreviewMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${type.color} text-white border-transparent`
                    : "bg-background/50 border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Custom Message Option */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Or write your own message:</p>
          <Textarea
            placeholder="Write a custom love message..."
            value={customMessage}
            onChange={(e) => {
              setCustomMessage(e.target.value);
              setPreviewMessage(null);
              if (e.target.value.trim()) setSelectedType(null);
            }}
            className="resize-none text-sm"
            rows={2}
          />
          <p className="text-xs text-muted-foreground text-right">
            {customMessage.length}/160 characters
          </p>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {previewMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-gradient-to-br from-pink-100/80 to-rose-100/80 dark:from-pink-900/30 dark:to-rose-900/30 border border-pink-200/50 dark:border-pink-800/50"
            >
              <p className="text-sm italic text-pink-800 dark:text-pink-200">
                "{previewMessage}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!previewMessage ? (
            <Button
              onClick={handleGeneratePreview}
              disabled={isGenerating || (!selectedType && !customMessage.trim())}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Preview Message
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewMessage(null);
                  handleGeneratePreview();
                }}
                disabled={isSending}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send SMS
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
