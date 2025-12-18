import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, Sparkles, RefreshCw, Users, Bell, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyPartner } from "@/utils/smsNotifications";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useQuery } from "@tanstack/react-query";
import {
  regularTruths,
  regularDares,
  spicyTruths,
  spicyDares,
} from "@/data/spicyGameContent";

interface TruthOrDareProps {
  partnerLinkId?: string;
}

interface GameSession {
  id: string;
  partner_link_id: string;
  started_by: string;
  mode: string | null;
  is_spicy: boolean;
  current_card_index: number;
  current_prompt: string | null;
  player_ready: Record<string, boolean>;
}

export const TruthOrDare = ({ partnerLinkId }: TruthOrDareProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { partnerId } = useCouplesAccount();
  
  // Fetch partner's name
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
  
  const partnerName = partnerProfile?.display_name || "Partner";
  
  const [session, setSession] = useState<GameSession | null>(null);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const truths = isSpicy ? spicyTruths : regularTruths;
  const dares = isSpicy ? spicyDares : regularDares;

  // Fetch active session
  useEffect(() => {
    if (!partnerLinkId) {
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("truth_or_dare_sessions")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSession(data as GameSession);
        setIsSpicy(data.is_spicy);
      }
      setIsLoading(false);
    };

    fetchSession();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`tod-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "truth_or_dare_sessions",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setSession(null);
          } else {
            setSession(payload.new as GameSession);
            setIsSpicy((payload.new as GameSession).is_spicy);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId]);

  const getRandomPrompt = (type: "truth" | "dare") => {
    const cards = type === "truth" ? truths : dares;
    return cards[Math.floor(Math.random() * cards.length)];
  };

  const startGame = async () => {
    if (!partnerLinkId || !user) return;
    setIsCreating(true);

    // Delete any existing session
    await supabase
      .from("truth_or_dare_sessions")
      .delete()
      .eq("partner_link_id", partnerLinkId);

    const { data, error } = await supabase
      .from("truth_or_dare_sessions")
      .insert({
        partner_link_id: partnerLinkId,
        started_by: user.id,
        is_spicy: isSpicy,
        mode: null,
        current_prompt: null,
        player_ready: {},
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    } else {
      setSession(data as GameSession);
      // Notify partner
      if (partnerId) {
        console.log("Sending game started notification to partner:", partnerId);
        notifyPartner.gameStarted(partnerId, user.user_metadata?.display_name || "Your partner", "Truth or Dare");
      }
      toast({
        title: "Game Started! 🎮",
        description: "Your partner has been notified",
      });
    }
    setIsCreating(false);
  };

  const selectMode = async (type: "truth" | "dare") => {
    if (!session || !user) return;

    const prompt = getRandomPrompt(type);
    
    await supabase
      .from("truth_or_dare_sessions")
      .update({
        mode: type,
        current_prompt: prompt,
        player_ready: { [user.id]: true },
      })
      .eq("id", session.id);
  };

  const markReady = async () => {
    if (!session || !user) return;

    const newReady = { ...session.player_ready, [user.id]: true };
    
    await supabase
      .from("truth_or_dare_sessions")
      .update({ player_ready: newReady })
      .eq("id", session.id);
  };

  const nextCard = async () => {
    if (!session || !session.mode || !user) return;

    const prompt = getRandomPrompt(session.mode as "truth" | "dare");
    
    await supabase
      .from("truth_or_dare_sessions")
      .update({
        current_prompt: prompt,
        current_card_index: session.current_card_index + 1,
        player_ready: { [user.id]: true },
      })
      .eq("id", session.id);
  };

  const switchMode = async () => {
    if (!session) return;

    await supabase
      .from("truth_or_dare_sessions")
      .update({
        mode: null,
        current_prompt: null,
        player_ready: {},
      })
      .eq("id", session.id);
  };

  const endGame = async () => {
    if (!session) return;

    await supabase
      .from("truth_or_dare_sessions")
      .delete()
      .eq("id", session.id);

    setSession(null);
  };

  const remindPartner = async () => {
    if (!partnerId) return;
    
    await notifyPartner.gameStarted(
      partnerId,
      user?.user_metadata?.display_name || "Your partner",
      "Truth or Dare"
    );
    
    toast({
      title: "Reminder Sent! 📱",
      description: `${partnerName || "Your partner"} has been notified`,
    });
  };

  const isMyTurn = session?.started_by === user?.id || !session?.mode;
  const amIReady = session?.player_ready?.[user?.id || ""] || false;
  const isPartnerReady = partnerId ? session?.player_ready?.[partnerId] || false : false;
  const bothReady = amIReady && isPartnerReady;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Truth or Dare
            {session && (
              <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" /> Live
              </span>
            )}
          </CardTitle>
          {!session && (
            <div className="flex items-center gap-2">
              <Label htmlFor="spicy-mode" className="text-xs text-muted-foreground">
                🔥 Spicy
              </Label>
              <Switch
                id="spicy-mode"
                checked={isSpicy}
                onCheckedChange={setIsSpicy}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {!session ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground text-center">
                Start a remote game with your partner!
                {isSpicy && " 🔥 Spicy mode enabled"}
              </p>
              <Button
                onClick={startGame}
                disabled={isCreating || !partnerLinkId}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Start Game Together
              </Button>
            </motion.div>
          ) : !session.mode ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  {isMyTurn ? "Choose your challenge!" : `Waiting for ${partnerName || "partner"} to choose...`}
                </p>
                {session.is_spicy && (
                  <p className="text-xs text-orange-500">🔥 Spicy mode</p>
                )}
              </div>
              
              {isMyTurn ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => selectMode("truth")}
                    variant="outline"
                    className="h-24 flex-col gap-2 border-2 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500"
                  >
                    <Heart className="w-8 h-8 text-pink-500" />
                    <span className="font-semibold">Truth</span>
                  </Button>
                  <Button
                    onClick={() => selectMode("dare")}
                    variant="outline"
                    className="h-24 flex-col gap-2 border-2 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500"
                  >
                    <Sparkles className="w-8 h-8 text-orange-500" />
                    <span className="font-semibold">Dare</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={remindPartner}
                    className="gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Remind Partner
                  </Button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={endGame}
                className="w-full text-muted-foreground"
              >
                End Game
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className="space-y-4"
            >
              <div
                className={cn(
                  "p-6 rounded-xl border-2 min-h-[120px] flex items-center justify-center text-center",
                  session.mode === "truth"
                    ? "bg-pink-500/10 border-pink-500/30"
                    : "bg-orange-500/10 border-orange-500/30"
                )}
              >
                <p className="text-lg font-medium">{session.current_prompt}</p>
              </div>

              {/* Ready status */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full",
                  amIReady ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    amIReady ? "bg-green-500" : "bg-muted-foreground"
                  )} />
                  You {amIReady ? "Ready" : ""}
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full",
                  isPartnerReady ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isPartnerReady ? "bg-green-500" : "bg-muted-foreground"
                  )} />
                  {partnerName || "Partner"} {isPartnerReady ? "Ready" : ""}
                </div>
              </div>

              {!amIReady && (
                <Button onClick={markReady} className="w-full">
                  I'm Ready ✓
                </Button>
              )}

              {amIReady && !isPartnerReady && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Waiting for {partnerName || "partner"}...
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={remindPartner}
                    className="gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Remind Partner
                  </Button>
                </div>
              )}

              {bothReady && (
                <div className="flex gap-2">
                  <Button
                    onClick={nextCard}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Next {session.mode === "truth" ? "Truth" : "Dare"}
                  </Button>
                  <Button
                    onClick={switchMode}
                    variant="ghost"
                    className="gap-2"
                  >
                    Switch
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
