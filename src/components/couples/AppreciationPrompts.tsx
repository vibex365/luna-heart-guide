import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Sparkles, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { toast } from "sonner";
import { format, isToday, startOfDay } from "date-fns";

const appreciationPrompts = [
  "What's one thing your partner did recently that made you smile?",
  "Describe a quality you admire most about your partner.",
  "What's something your partner does that makes you feel loved?",
  "Share a favorite memory you've made together recently.",
  "What are you grateful for about your relationship today?",
  "What's something your partner does that you never want them to stop?",
  "Describe a moment when your partner made you feel truly understood.",
  "What's one way your partner has helped you grow as a person?",
  "What made you fall in love with your partner?",
  "What's something small your partner does that means a lot to you?",
  "Share a compliment you've been meaning to give your partner.",
  "What's your favorite thing about coming home to your partner?",
  "Describe how your partner makes ordinary days special.",
  "What strength does your partner have that you wish you had more of?",
  "What's one thing you appreciate about how your partner handles challenges?",
];

const getDailyPrompt = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return appreciationPrompts[dayOfYear % appreciationPrompts.length];
};

interface AppreciationEntry {
  id: string;
  user_id: string;
  prompt_text: string;
  appreciation_text: string;
  is_visible_to_partner: boolean;
  created_at: string;
}

interface AppreciationPromptsProps {
  partnerLinkId?: string;
}

export const AppreciationPrompts = ({ partnerLinkId }: AppreciationPromptsProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const queryClient = useQueryClient();
  const [currentPrompt, setCurrentPrompt] = useState(getDailyPrompt());
  const [appreciationText, setAppreciationText] = useState("");
  const [isVisibleToPartner, setIsVisibleToPartner] = useState(true);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  // Fetch today's entries
  const { data: todayEntries } = useQuery({
    queryKey: ["appreciation-today", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];
      const todayStart = startOfDay(new Date()).toISOString();
      const { data, error } = await supabase
        .from("appreciation_entries")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .gte("created_at", todayStart)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AppreciationEntry[];
    },
    enabled: !!partnerLinkId,
  });

  // Fetch recent partner entries
  const { data: recentPartnerEntries } = useQuery({
    queryKey: ["appreciation-partner", partnerLinkId, partnerId],
    queryFn: async () => {
      if (!partnerLinkId || !partnerId) return [];
      const { data, error } = await supabase
        .from("appreciation_entries")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .eq("user_id", partnerId)
        .eq("is_visible_to_partner", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as AppreciationEntry[];
    },
    enabled: !!partnerLinkId && !!partnerId,
  });

  // Check if user submitted today
  useEffect(() => {
    if (todayEntries && user) {
      const userEntryToday = todayEntries.find((e) => e.user_id === user.id);
      setHasSubmittedToday(!!userEntryToday);
    }
  }, [todayEntries, user]);

  // Real-time subscription for partner entries
  useEffect(() => {
    if (!partnerLinkId || !partnerId) return;

    const channel = supabase
      .channel(`appreciation-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appreciation_entries",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          const entry = payload.new as AppreciationEntry;
          if (entry.user_id === partnerId && entry.is_visible_to_partner) {
            toast.success("Your partner shared appreciation for you! 💕");
            queryClient.invalidateQueries({ queryKey: ["appreciation-partner"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, partnerId, queryClient]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!partnerLinkId || !user) throw new Error("Missing data");
      const { error } = await supabase.from("appreciation_entries").insert({
        partner_link_id: partnerLinkId,
        user_id: user.id,
        prompt_text: currentPrompt,
        appreciation_text: appreciationText,
        is_visible_to_partner: isVisibleToPartner,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appreciation-today"] });
      setAppreciationText("");
      setHasSubmittedToday(true);
      toast.success(isVisibleToPartner ? "Shared with your partner! 💕" : "Appreciation saved!");
    },
    onError: () => toast.error("Failed to save"),
  });

  const shufflePrompt = () => {
    const randomIndex = Math.floor(Math.random() * appreciationPrompts.length);
    setCurrentPrompt(appreciationPrompts[randomIndex]);
  };

  const myEntryToday = todayEntries?.find((e) => e.user_id === user?.id);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-rose-500/5 to-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          Daily Appreciation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Prompt */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground/90">{currentPrompt}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={shufflePrompt}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {hasSubmittedToday && myEntryToday ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
            >
              <p className="text-sm text-foreground/80">{myEntryToday.appreciation_text}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                {myEntryToday.is_visible_to_partner ? (
                  <>
                    <Eye className="w-3 h-3" /> Shared with partner
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" /> Private
                  </>
                )}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Share your appreciation..."
                value={appreciationText}
                onChange={(e) => setAppreciationText(e.target.value)}
                className="min-h-[80px] text-sm"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="visible"
                    checked={isVisibleToPartner}
                    onCheckedChange={setIsVisibleToPartner}
                  />
                  <Label htmlFor="visible" className="text-xs text-muted-foreground">
                    Share with partner
                  </Label>
                </div>

                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!appreciationText.trim() || submitMutation.isPending || !partnerLinkId}
                  size="sm"
                  className="bg-gradient-to-r from-rose-500 to-orange-500"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Partner's Recent Appreciations */}
        <AnimatePresence>
          {recentPartnerEntries && recentPartnerEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2 pt-3 border-t"
            >
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                From your partner
              </h4>
              {recentPartnerEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-card border"
                >
                  <p className="text-sm">{entry.appreciation_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isToday(new Date(entry.created_at))
                      ? "Today"
                      : format(new Date(entry.created_at), "MMM d")}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!partnerLinkId && (
          <p className="text-xs text-center text-muted-foreground">
            Link with a partner to share appreciation!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
