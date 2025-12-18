import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Flame, Star, Heart, Eye, Shuffle, Bell, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { rateFantasyScenarios, categoryColors } from "@/data/intimateGameContent";
import { notifyPartner } from "@/utils/smsNotifications";

interface RateTheFantasyProps {
  partnerLinkId?: string;
}

export const RateTheFantasy = ({ partnerLinkId }: RateTheFantasyProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [myRating, setMyRating] = useState(5);
  const [partnerRating, setPartnerRating] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<{ match: boolean; diff: number }[]>([]);

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
      .channel(`rate-fantasy-${sessionId}`)
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
          
          // Update partner rating
          if (partnerId && responses[partnerId] !== undefined) {
            setPartnerRating(responses[partnerId]);
          }
          
          // Update revealed state
          if (newData.revealed) {
            setIsRevealed(true);
          }
          
          // Update scenario index
          if (newData.current_prompt_index !== currentScenarioIndex) {
            setCurrentScenarioIndex(newData.current_prompt_index);
            setMyRating(5);
            setPartnerRating(null);
            setIsRevealed(false);
            setHasSubmitted(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, partnerId, currentScenarioIndex]);

  const startGame = async () => {
    if (!partnerLinkId || !user) return;

    try {
      // Delete any existing session
      await supabase
        .from("intimate_game_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "rate_fantasy");

      // Create new session
      const randomIndex = Math.floor(Math.random() * rateFantasyScenarios.length);
      const { data, error } = await supabase
        .from("intimate_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          game_type: "rate_fantasy",
          current_prompt_index: randomIndex,
          player_responses: {},
          revealed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setCurrentScenarioIndex(randomIndex);
      setIsPlaying(true);
      setMyRating(5);
      setPartnerRating(null);
      setIsRevealed(false);
      setHasSubmitted(false);
      setMatchHistory([]);

      // Notify partner - get current user's name for notification
      if (partnerId) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        const myName = myProfile?.display_name || "Your partner";
        await notifyPartner.gameStarted(partnerId, myName, "Rate the Fantasy");
      }

      toast.success("Game started! Your partner has been notified.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const submitRating = async () => {
    if (!sessionId || !user) return;

    try {
      // Get current responses
      const { data: session } = await supabase
        .from("intimate_game_sessions")
        .select("player_responses")
        .eq("id", sessionId)
        .single();

      const currentResponses = (session?.player_responses as Record<string, number>) || {};
      const updatedResponses = {
        ...currentResponses,
        [user.id]: myRating,
      };

      await supabase
        .from("intimate_game_sessions")
        .update({ player_responses: updatedResponses })
        .eq("id", sessionId);

      setHasSubmitted(true);
      toast.success("Rating submitted!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    }
  };

  const revealRatings = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from("intimate_game_sessions")
        .update({ revealed: true })
        .eq("id", sessionId);

      setIsRevealed(true);
      
      // Update match history
      if (partnerRating !== null) {
        const diff = Math.abs(myRating - partnerRating);
        setMatchHistory(prev => [...prev, { match: diff <= 2, diff }]);
      }
    } catch (error) {
      console.error("Error revealing ratings:", error);
    }
  };

  const nextScenario = async () => {
    if (!sessionId) return;

    const newIndex = Math.floor(Math.random() * rateFantasyScenarios.length);
    
    try {
      await supabase
        .from("intimate_game_sessions")
        .update({
          current_prompt_index: newIndex,
          player_responses: {},
          revealed: false,
        })
        .eq("id", sessionId);

      setCurrentScenarioIndex(newIndex);
      setMyRating(5);
      setPartnerRating(null);
      setIsRevealed(false);
      setHasSubmitted(false);
    } catch (error) {
      console.error("Error going to next scenario:", error);
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
    await notifyPartner.gameStarted(partnerId, myName, "Rate the Fantasy");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  const bothSubmitted = partnerRating !== null && hasSubmitted;
  const matches = matchHistory.filter(h => h.match).length;
  const currentScenario = rateFantasyScenarios[currentScenarioIndex];

  if (!isPlaying) {
    return (
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            Rate the Fantasy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Rate romantic and intimate scenarios 1-10, then compare with your partner. 
            Discover shared fantasies and new ideas! 🔥
          </p>
          <Button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500"
          >
            <Flame className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getMatchMessage = () => {
    if (partnerRating === null) return null;
    const diff = Math.abs(myRating - partnerRating);
    if (diff === 0) return { text: "Perfect match! 🔥", color: "text-green-400" };
    if (diff <= 2) return { text: "Great minds think alike! 💕", color: "text-green-300" };
    if (diff <= 4) return { text: "Some alignment here! 💫", color: "text-yellow-300" };
    return { text: "Different vibes, that's okay! 💭", color: "text-muted-foreground" };
  };

  return (
    <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            Rate the Fantasy
          </div>
          {matchHistory.length > 0 && (
            <Badge variant="outline" className="text-orange-300 border-orange-500/30">
              <Star className="w-3 h-3 mr-1 fill-orange-400" />
              {matches}/{matchHistory.length} matches
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Scenario */}
        <motion.div
          key={currentScenarioIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-background/50 rounded-lg border border-red-500/20 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{currentScenario.title}</h3>
            <Badge className={categoryColors[currentScenario.category]}>
              {currentScenario.category}
            </Badge>
          </div>
          <p className="text-muted-foreground">{currentScenario.description}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="rating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Rating Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Your rating:</label>
                  <span className="text-2xl font-bold text-red-400">{myRating}/10</span>
                </div>
                <Slider
                  value={[myRating]}
                  onValueChange={(value) => setMyRating(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  disabled={hasSubmitted}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Not for me</span>
                  <span>🔥 Yes please!</span>
                </div>
                
                {!hasSubmitted && (
                  <Button
                    onClick={submitRating}
                    className="w-full"
                    variant="secondary"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Lock In Rating
                  </Button>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm">
                <span className={hasSubmitted ? "text-green-400" : "text-muted-foreground"}>
                  {hasSubmitted ? "✓ You rated" : "Waiting for your rating..."}
                </span>
                <span className={partnerRating !== null ? "text-green-400" : "text-muted-foreground"}>
                  {partnerRating !== null ? `✓ ${partnerName} rated` : `Waiting for ${partnerName}...`}
                </span>
              </div>

              {/* Reveal or Remind */}
              <div className="flex gap-2">
                {bothSubmitted ? (
                  <Button
                    onClick={revealRatings}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-500"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Ratings
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
              {/* Revealed Ratings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
                  <p className="text-xs text-red-300 mb-1">You</p>
                  <p className="text-3xl font-bold">{myRating}</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
                  <p className="text-xs text-orange-300 mb-1">{partnerName}</p>
                  <p className="text-3xl font-bold">{partnerRating ?? "?"}</p>
                </div>
              </div>

              {/* Match Message */}
              {getMatchMessage() && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <p className={`text-lg font-medium ${getMatchMessage()?.color}`}>
                    {getMatchMessage()?.text}
                  </p>
                </motion.div>
              )}

              {/* Next Scenario */}
              <Button
                onClick={nextScenario}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Next Fantasy
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
