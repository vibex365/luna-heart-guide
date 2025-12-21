import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, ArrowRight, RotateCcw, Thermometer, Users, Bell, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { GameCard } from "./cards/GameCard";
import { useAgeGateEnabled } from "@/hooks/useGameQuestions";
import { AgeGateModal } from "./AgeGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyPartner } from "@/utils/smsNotifications";

interface HotColdGameProps {
  partnerLinkId?: string;
}

type IntensityLevel = "cold" | "warm" | "hot" | "burning";

interface HotColdCard {
  text: string;
  type: "action" | "question";
  intensity: IntensityLevel;
}

interface GameSession {
  id: string;
  partner_link_id: string;
  started_by: string;
  game_state: {
    intensity: IntensityLevel;
    current_card: HotColdCard | null;
    round_count: number;
    revealed: boolean;
    player_completed: Record<string, boolean>;
    player_responses: Record<string, string>;
  };
}

const coldCards: HotColdCard[] = [
  { text: "Give your partner a genuine compliment about their personality", type: "action", intensity: "cold" },
  { text: "What's your favorite memory together?", type: "question", intensity: "cold" },
  { text: "Hold hands for the next 2 rounds", type: "action", intensity: "cold" },
  { text: "What made you first notice your partner?", type: "question", intensity: "cold" },
  { text: "Share a song that reminds you of your partner", type: "action", intensity: "cold" },
  { text: "What's something your partner does that always makes you smile?", type: "question", intensity: "cold" },
  { text: "Give your partner a forehead kiss", type: "action", intensity: "cold" },
  { text: "What's a dream you have for your future together?", type: "question", intensity: "cold" },
];

const warmCards: HotColdCard[] = [
  { text: "Whisper something sweet in your partner's ear", type: "action", intensity: "warm" },
  { text: "What's the most romantic thing your partner has done for you?", type: "question", intensity: "warm" },
  { text: "Give your partner a 30-second shoulder massage", type: "action", intensity: "warm" },
  { text: "Describe your ideal date night", type: "question", intensity: "warm" },
  { text: "Look into each other's eyes without speaking for 30 seconds", type: "action", intensity: "warm" },
  { text: "What's something new you'd like to try together?", type: "question", intensity: "warm" },
  { text: "Give your partner a slow, meaningful hug", type: "action", intensity: "warm" },
  { text: "What do you find most attractive about your partner?", type: "question", intensity: "warm" },
];

const hotCards: HotColdCard[] = [
  { text: "Give your partner a kiss that lasts at least 10 seconds", type: "action", intensity: "hot" },
  { text: "What's a fantasy you've never shared before?", type: "question", intensity: "hot" },
  { text: "Trace your finger slowly along your partner's arm", type: "action", intensity: "hot" },
  { text: "Where do you most like to be touched?", type: "question", intensity: "hot" },
  { text: "Give your partner a neck kiss", type: "action", intensity: "hot" },
  { text: "What's the most passionate moment we've shared?", type: "question", intensity: "hot" },
  { text: "Run your fingers through your partner's hair", type: "action", intensity: "hot" },
  { text: "What's something that instantly puts you in the mood?", type: "question", intensity: "hot" },
];

const burningCards: HotColdCard[] = [
  { text: "Describe in detail what you want to do to your partner later", type: "action", intensity: "burning" },
  { text: "What's your biggest intimate fantasy with your partner?", type: "question", intensity: "burning" },
  { text: "Kiss your partner's most sensitive spot (that's visible)", type: "action", intensity: "burning" },
  { text: "What's the boldest thing you want to try together?", type: "question", intensity: "burning" },
  { text: "Whisper your deepest desire to your partner", type: "action", intensity: "burning" },
  { text: "What drives you absolutely wild about your partner?", type: "question", intensity: "burning" },
  { text: "Show your partner exactly how you like to be kissed", type: "action", intensity: "burning" },
  { text: "Describe your perfect intimate evening together", type: "question", intensity: "burning" },
];

const intensityStyles: Record<IntensityLevel, { color: string; icon: React.ReactNode; label: string }> = {
  cold: { color: "from-blue-400 to-cyan-500", icon: <Snowflake className="w-4 h-4" />, label: "Cold" },
  warm: { color: "from-yellow-400 to-orange-400", icon: <Thermometer className="w-4 h-4" />, label: "Warm" },
  hot: { color: "from-orange-500 to-red-500", icon: <Flame className="w-4 h-4" />, label: "Hot" },
  burning: { color: "from-red-500 to-rose-600", icon: <Flame className="w-4 h-4" />, label: "🔥 Burning" },
};

const getAllCardsForIntensity = (intensity: IntensityLevel): HotColdCard[] => {
  switch (intensity) {
    case "cold": return coldCards;
    case "warm": return warmCards;
    case "hot": return hotCards;
    case "burning": return burningCards;
  }
};

export const HotColdGame = ({ partnerLinkId }: HotColdGameProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>("warm");
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [myResponse, setMyResponse] = useState("");

  const { data: ageGateEnabled } = useAgeGateEnabled();

  // Fetch partner name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-hotcold", partnerId],
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

  // Fetch active session
  useEffect(() => {
    if (!partnerLinkId) return;

    const fetchSession = async () => {
      const { data } = await supabase
        .from("couples_game_sessions")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "hot_cold_game")
        .maybeSingle();

      if (data) {
        const gameState = data.game_state as unknown as GameSession["game_state"];
        setSession({
          id: data.id,
          partner_link_id: data.partner_link_id,
          started_by: data.started_by,
          game_state: gameState,
        });
        setSelectedIntensity(gameState.intensity);
        setIsCardFlipped(gameState.revealed);
      }
    };

    fetchSession();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`hotcold-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples_game_sessions",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            if ((payload.old as any).game_type === "hot_cold_game") {
              setSession(null);
            }
          } else {
            const data = payload.new as any;
            if (data.game_type === "hot_cold_game") {
              const gameState = data.game_state as unknown as GameSession["game_state"];
              setSession({
                id: data.id,
                partner_link_id: data.partner_link_id,
                started_by: data.started_by,
                game_state: gameState,
              });
              setSelectedIntensity(gameState.intensity);
              setIsCardFlipped(gameState.revealed);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId]);

  const handleIntensitySelect = (intensity: IntensityLevel) => {
    if ((intensity === "hot" || intensity === "burning") && ageGateEnabled && !ageVerified) {
      setSelectedIntensity(intensity);
      setShowAgeGate(true);
    } else {
      setSelectedIntensity(intensity);
      if (session) {
        drawCard(intensity);
      }
    }
  };

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    setShowAgeGate(false);
    if (session) {
      drawCard(selectedIntensity);
    }
  };

  const getRandomCard = (intensity: IntensityLevel): HotColdCard => {
    const cards = getAllCardsForIntensity(intensity);
    const availableCards = cards.filter(c => !usedCards.has(c.text));

    if (availableCards.length === 0) {
      setUsedCards(new Set());
      return cards[Math.floor(Math.random() * cards.length)];
    } else {
      const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setUsedCards(prev => new Set([...prev, selectedCard.text]));
      return selectedCard;
    }
  };

  const startGame = async () => {
    if (!partnerLinkId || !user) return;
    setIsLoading(true);

    try {
      // Delete any existing session
      await supabase
        .from("couples_game_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "hot_cold_game");

      const card = getRandomCard(selectedIntensity);

      const gameStateData = {
        intensity: selectedIntensity,
        current_card: card,
        round_count: 1,
        revealed: false,
        player_completed: {},
        player_responses: {},
      };

      const { data, error } = await supabase
        .from("couples_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          game_type: "hot_cold_game",
          game_state: JSON.parse(JSON.stringify(gameStateData)),
        })
        .select()
        .single();

      if (error) throw error;

      const gameState = data.game_state as unknown as GameSession["game_state"];
      setSession({
        id: data.id,
        partner_link_id: data.partner_link_id,
        started_by: data.started_by,
        game_state: gameState,
      });

      // Notify partner
      if (partnerId) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        const myName = myProfile?.display_name || "Your partner";
        await notifyPartner.gameStarted(partnerId, myName, "Hot & Cold Cards");
      }

      toast.success("Game started! Your partner has been notified.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  const drawCard = async (intensity?: IntensityLevel) => {
    if (!session) return;

    const currentIntensity = intensity || selectedIntensity;
    const card = getRandomCard(currentIntensity);

    const newGameState = {
      ...session.game_state,
      intensity: currentIntensity,
      current_card: card,
      round_count: session.game_state.round_count + 1,
      revealed: false,
      player_completed: {},
      player_responses: {},
    };

    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: JSON.parse(JSON.stringify(newGameState)),
      })
      .eq("id", session.id);

    setIsCardFlipped(false);
    setMyResponse("");
  };

  const revealCard = async () => {
    if (!session) return;

    const updatedState = { ...session.game_state, revealed: true };
    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: JSON.parse(JSON.stringify(updatedState)),
      })
      .eq("id", session.id);

    setIsCardFlipped(true);
  };

  const submitResponse = async () => {
    if (!session || !user || !myResponse.trim()) return;

    const newResponses = {
      ...session.game_state.player_responses,
      [user.id]: myResponse.trim(),
    };

    const newCompleted = {
      ...session.game_state.player_completed,
      [user.id]: true,
    };

    const updatedState = { 
      ...session.game_state, 
      player_responses: newResponses,
      player_completed: newCompleted 
    };
    
    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: JSON.parse(JSON.stringify(updatedState)),
      })
      .eq("id", session.id);

    toast.success("Response sent!");
  };

  const markComplete = async () => {
    if (!session || !user) return;

    const newCompleted = {
      ...session.game_state.player_completed,
      [user.id]: true,
    };

    const updatedState = { ...session.game_state, player_completed: newCompleted };
    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: JSON.parse(JSON.stringify(updatedState)),
      })
      .eq("id", session.id);
  };

  const resetGame = async () => {
    if (!session) return;

    await supabase
      .from("couples_game_sessions")
      .delete()
      .eq("id", session.id);

    setSession(null);
    setUsedCards(new Set());
    setIsCardFlipped(false);
    setMyResponse("");
  };

  const remindPartner = async () => {
    if (!partnerId || !user) return;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    const myName = myProfile?.display_name || "Your partner";
    await notifyPartner.gameStarted(partnerId, myName, "Hot & Cold Cards");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  const isPlaying = !!session;
  const currentCard = session?.game_state.current_card;
  const bothCompleted = session?.game_state.player_completed?.[user?.id || ""] && 
                       session?.game_state.player_completed?.[partnerId || ""];

  return (
    <>
      <Card className="overflow-hidden border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-orange-500/5">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-orange-500 to-red-500 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              Hot & Cold Cards
              {isPlaying && (
                <Badge variant="outline" className="ml-1 border-green-500/50 text-green-500">
                  <Users className="w-3 h-3 mr-1" /> Live
                </Badge>
              )}
            </CardTitle>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-4">
                {!isPlaying ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      Draw cards with varying intensity levels - play remotely with your partner! 🔥
                    </p>

                    {/* Intensity selector */}
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.entries(intensityStyles) as [IntensityLevel, typeof intensityStyles["cold"]][]).map(([level, style]) => (
                        <button
                          key={level}
                          onClick={() => handleIntensitySelect(level)}
                          className={`p-2 rounded-lg text-center transition-all ${
                            selectedIntensity === level
                              ? `bg-gradient-to-r ${style.color} text-white`
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex justify-center mb-1">{style.icon}</div>
                          <span className="text-xs font-medium">{style.label}</span>
                        </button>
                      ))}
                    </div>

                    <Button 
                      onClick={startGame} 
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
                      disabled={isLoading || !partnerLinkId}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Start Drawing Cards
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Game header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`bg-gradient-to-r ${intensityStyles[selectedIntensity].color} text-white`}>
                          {intensityStyles[selectedIntensity].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Round {session.game_state.round_count}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={resetGame}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        End
                      </Button>
                    </div>

                    {/* Intensity quick-switch */}
                    <div className="flex justify-center gap-1">
                      {(Object.entries(intensityStyles) as [IntensityLevel, typeof intensityStyles["cold"]][]).map(([level, style]) => (
                        <button
                          key={level}
                          onClick={() => handleIntensitySelect(level)}
                          className={`p-2 rounded-lg transition-all ${
                            selectedIntensity === level
                              ? `bg-gradient-to-r ${style.color} text-white`
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {style.icon}
                        </button>
                      ))}
                    </div>

                    {/* Current card */}
                    {currentCard && (
                      <div className="flex justify-center">
                        <div className="w-64">
                          <GameCard
                            theme={currentCard.intensity === "cold" ? "adventure" : 
                                   currentCard.intensity === "warm" ? "romance" :
                                   currentCard.intensity === "hot" ? "spicy" : "intimate"}
                            isFlipped={isCardFlipped}
                            onFlip={revealCard}
                            showFlipHint={!isCardFlipped}
                            category={currentCard.type === "action" ? "Action" : "Question"}
                            frontContent={
                              <div className="text-center p-4">
                                <Badge className={`mb-3 bg-gradient-to-r ${intensityStyles[currentCard.intensity].color} text-white`}>
                                  {intensityStyles[currentCard.intensity].icon}
                                  <span className="ml-1">{intensityStyles[currentCard.intensity].label}</span>
                                </Badge>
                                <p className="text-lg font-medium text-foreground leading-relaxed">
                                  {currentCard.text}
                                </p>
                              </div>
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Completion status */}
                    {isCardFlipped && (
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <span className={session.game_state.player_completed?.[user?.id || ""] 
                          ? "text-green-500" 
                          : "text-muted-foreground"
                        }>
                          {session.game_state.player_completed?.[user?.id || ""] ? "✓ You completed" : "Mark as done"}
                        </span>
                        <span className={session.game_state.player_completed?.[partnerId || ""] 
                          ? "text-green-500" 
                          : "text-muted-foreground"
                        }>
                          {session.game_state.player_completed?.[partnerId || ""] 
                            ? `✓ ${partnerName} completed` 
                            : `Waiting for ${partnerName}...`}
                        </span>
                      </div>
                    )}

                    {/* Response input for questions */}
                    {isCardFlipped && currentCard?.type === "question" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {!session.game_state.player_responses?.[user?.id || ""] ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Type your answer here..."
                              value={myResponse}
                              onChange={(e) => setMyResponse(e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <Button
                              onClick={submitResponse}
                              disabled={!myResponse.trim()}
                              className="w-full"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Response
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <p className="text-sm text-green-600 font-medium mb-1">Your answer:</p>
                            <p className="text-sm">{session.game_state.player_responses[user?.id || ""]}</p>
                          </div>
                        )}

                        {/* Partner's response */}
                        {session.game_state.player_responses?.[partnerId || ""] && (
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <p className="text-sm text-blue-600 font-medium mb-1">{partnerName}'s answer:</p>
                            <p className="text-sm">{session.game_state.player_responses[partnerId || ""]}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Actions for action cards */}
                    {isCardFlipped && currentCard?.type === "action" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {!session.game_state.player_completed?.[user?.id || ""] && (
                          <Button
                            onClick={markComplete}
                            variant="outline"
                            className="w-full"
                          >
                            ✓ I Did It!
                          </Button>
                        )}
                      </motion.div>
                    )}

                    {/* Draw next card */}
                    {isCardFlipped && (
                      <Button
                        onClick={() => drawCard()}
                        className={`w-full bg-gradient-to-r ${intensityStyles[selectedIntensity].color}`}
                      >
                        Draw Next Card
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                    {/* Remind partner */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={remindPartner}
                      className="w-full gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Remind {partnerName}
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <AgeGateModal
        open={showAgeGate}
        onCancel={() => setShowAgeGate(false)}
        onConfirm={handleAgeConfirm}
      />
    </>
  );
};

export default HotColdGame;
