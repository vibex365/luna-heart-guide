import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Moon, Send, Eye, Shuffle, Heart, Bell, Loader2, Stars, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyPartner } from "@/utils/smsNotifications";

// Tonight's Plans prompts - romantic and spicy scenarios
const tonightsPlansPrompts = [
  // Romantic
  { prompt: "If we were together right now, the first thing I'd do is...", category: "romantic" },
  { prompt: "Tonight, I would love to...", category: "romantic" },
  { prompt: "The perfect evening with you would include...", category: "romantic" },
  { prompt: "If I could plan the perfect date night, we would...", category: "romantic" },
  { prompt: "When we're finally together, I want to start by...", category: "romantic" },
  
  // Intimate
  { prompt: "The way I'd greet you at the door would be...", category: "intimate" },
  { prompt: "Before anything else, I'd want to...", category: "intimate" },
  { prompt: "The mood I'd set for us tonight involves...", category: "intimate" },
  { prompt: "If we had all night with no interruptions, I would...", category: "intimate" },
  { prompt: "The surprise I'd have waiting for you is...", category: "intimate" },
  
  // Playful
  { prompt: "Tonight's dress code for you would be...", category: "playful" },
  { prompt: "The game I'd want to play with you is...", category: "playful" },
  { prompt: "The soundtrack to our evening would be...", category: "playful" },
  { prompt: "I'd tease you by...", category: "playful" },
  { prompt: "The adventure I'd take you on tonight is...", category: "playful" },
  
  // Spicy
  { prompt: "The thing I've been wanting to try with you is...", category: "spicy" },
  { prompt: "I'd whisper in your ear that...", category: "spicy" },
  { prompt: "The way I'd make you feel tonight is...", category: "spicy" },
  { prompt: "If we only had one hour together, I would spend it...", category: "spicy" },
  { prompt: "The fantasy I'd want to act out is...", category: "spicy" },
];

const categoryColors: Record<string, string> = {
  romantic: "bg-pink-500/20 text-pink-300",
  intimate: "bg-purple-500/20 text-purple-300",
  playful: "bg-amber-500/20 text-amber-300",
  spicy: "bg-red-500/20 text-red-300",
};

interface TonightsPlansProps {
  partnerLinkId?: string;
}

export const TonightsPlans = ({ partnerLinkId }: TonightsPlansProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [myPlan, setMyPlan] = useState("");
  const [partnerPlan, setPartnerPlan] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turn, setTurn] = useState<"me" | "partner">("me");

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

  const partnerName = partnerProfile?.display_name || "Partner";

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId || !user) return;

    const channel = supabase
      .channel(`tonights-plans-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "intimate_game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const responses = newData.player_responses || {};
          
          // Update partner's plan
          if (partnerId && responses[partnerId]) {
            setPartnerPlan(responses[partnerId]);
          }
          
          // Update revealed state
          if (newData.revealed) {
            setIsRevealed(true);
          }
          
          // Update prompt index
          if (newData.current_prompt_index !== currentPromptIndex) {
            setCurrentPromptIndex(newData.current_prompt_index);
            setMyPlan("");
            setPartnerPlan(null);
            setIsRevealed(false);
            // Alternate turns
            setTurn(prev => prev === "me" ? "partner" : "me");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, partnerId, currentPromptIndex]);

  const startGame = async () => {
    if (!partnerLinkId || !user) return;

    try {
      // Delete any existing session
      await supabase
        .from("intimate_game_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "tonights_plans");

      // Create new session
      const randomIndex = Math.floor(Math.random() * tonightsPlansPrompts.length);
      const { data, error } = await supabase
        .from("intimate_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          game_type: "tonights_plans",
          current_prompt_index: randomIndex,
          player_responses: {},
          revealed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setCurrentPromptIndex(randomIndex);
      setIsPlaying(true);
      setMyPlan("");
      setPartnerPlan(null);
      setIsRevealed(false);
      setTurn("me");

      // Notify partner
      if (partnerId) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        const myName = myProfile?.display_name || "Your partner";
        await notifyPartner.gameStarted(partnerId, myName, "Tonight's Plans");
      }

      toast.success("Game started! Your partner has been notified.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const submitPlan = async () => {
    if (!sessionId || !user || !myPlan.trim()) return;

    setIsSubmitting(true);
    try {
      // Get current responses
      const { data: session } = await supabase
        .from("intimate_game_sessions")
        .select("player_responses")
        .eq("id", sessionId)
        .single();

      const currentResponses = (session?.player_responses as Record<string, string>) || {};
      const updatedResponses = {
        ...currentResponses,
        [user.id]: myPlan.trim(),
      };

      await supabase
        .from("intimate_game_sessions")
        .update({ player_responses: updatedResponses })
        .eq("id", sessionId);

      toast.success("Your plan submitted! 💕");
    } catch (error) {
      console.error("Error submitting plan:", error);
      toast.error("Failed to submit plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const revealPlans = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from("intimate_game_sessions")
        .update({ revealed: true })
        .eq("id", sessionId);

      setIsRevealed(true);
    } catch (error) {
      console.error("Error revealing plans:", error);
    }
  };

  const nextPrompt = async () => {
    if (!sessionId) return;

    const newIndex = Math.floor(Math.random() * tonightsPlansPrompts.length);
    
    try {
      await supabase
        .from("intimate_game_sessions")
        .update({
          current_prompt_index: newIndex,
          player_responses: {},
          revealed: false,
        })
        .eq("id", sessionId);

      setCurrentPromptIndex(newIndex);
      setMyPlan("");
      setPartnerPlan(null);
      setIsRevealed(false);
      setTurn(prev => prev === "me" ? "partner" : "me");
    } catch (error) {
      console.error("Error going to next prompt:", error);
    }
  };

  const remindPartner = async () => {
    if (!partnerId || !user) return;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    const myName = myProfile?.display_name || "Your partner";
    await notifyPartner.gameStarted(partnerId, myName, "Tonight's Plans");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  const hasSubmitted = myPlan.trim().length > 0;
  const bothSubmitted = partnerPlan !== null && hasSubmitted;
  const currentPrompt = tonightsPlansPrompts[currentPromptIndex];

  if (!isPlaying) {
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            Tonight's Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Take turns describing what you'd do if you were together tonight. 
            Share your desires and discover each other's fantasies! 🌙
          </p>
          <Button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            <Moon className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            Tonight's Plans
          </div>
          <Badge className={categoryColors[currentPrompt?.category || "romantic"]}>
            <Stars className="w-3 h-3 mr-1" />
            {currentPrompt?.category}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Turn indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {turn === "me" ? "Your turn to describe..." : `${partnerName}'s turn...`}
          </span>
        </div>

        {/* Current Prompt */}
        <motion.div
          key={currentPromptIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-background/50 rounded-lg border border-indigo-500/20"
        >
          <p className="text-lg font-medium text-center italic">
            "{currentPrompt?.prompt}"
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* My Plan Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <label className="text-sm text-muted-foreground">Your plan:</label>
                </div>
                <Textarea
                  value={myPlan}
                  onChange={(e) => setMyPlan(e.target.value)}
                  placeholder="Describe what you'd do..."
                  className="min-h-[100px] bg-background/50"
                />
                <Button
                  onClick={submitPlan}
                  disabled={!myPlan.trim() || isSubmitting}
                  className="w-full"
                  variant="secondary"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit My Plan
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm">
                <span className={hasSubmitted ? "text-green-400" : "text-muted-foreground"}>
                  {hasSubmitted ? "✓ You submitted" : "Waiting for your plan..."}
                </span>
                <span className={partnerPlan ? "text-green-400" : "text-muted-foreground"}>
                  {partnerPlan ? `✓ ${partnerName} submitted` : `Waiting for ${partnerName}...`}
                </span>
              </div>

              {/* Reveal or Remind */}
              <div className="flex gap-2">
                {bothSubmitted ? (
                  <Button
                    onClick={revealPlans}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Plans
                  </Button>
                ) : (
                  <Button
                    onClick={remindPartner}
                    variant="outline"
                    className="flex-1"
                    disabled={!partnerId}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Remind {partnerName}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Revealed Plans */}
              <div className="grid gap-3">
                <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <p className="text-xs text-indigo-300 mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-indigo-300" />
                    Your plan:
                  </p>
                  <p className="text-sm leading-relaxed">"{myPlan}"</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-xs text-purple-300 mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-purple-300" />
                    {partnerName}'s plan:
                  </p>
                  <p className="text-sm leading-relaxed">"{partnerPlan || "No plan yet"}"</p>
                </div>
              </div>

              {/* Encouragement */}
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground italic">
                  💕 Keep the anticipation building...
                </p>
              </div>

              {/* Next Prompt */}
              <Button
                onClick={nextPrompt}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Next Scenario
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End Game */}
        <Button
          onClick={() => setIsPlaying(false)}
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
        >
          End Game
        </Button>
      </CardContent>
    </Card>
  );
};
