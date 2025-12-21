import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wine, Beer, Flame, ArrowRight, RotateCcw, AlertTriangle, Users, Bell, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GameCard } from "./cards/GameCard";
import { useAgeGateEnabled } from "@/hooks/useGameQuestions";
import { AgeGateModal } from "./AgeGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyPartner } from "@/utils/smsNotifications";
import {
  DrinkingPrompt,
  getPromptsByCategory,
} from "@/data/drinkingGameContent";

interface DrinkingGameProps {
  partnerLinkId?: string;
}

type GameMode = "drink_if" | "sip_or_skip" | "never_have_i_ever" | "truth_or_drink";

interface GameSession {
  id: string;
  partner_link_id: string;
  started_by: string;
  game_state: {
    mode: GameMode;
    is_spicy: boolean;
    current_prompt: string;
    prompt_index: number;
    drink_counts: Record<string, number>;
    revealed: boolean;
  };
}

const gameModes: { id: GameMode; name: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: "drink_if", 
    name: "Drink If...", 
    icon: <Beer className="w-5 h-5" />, 
    description: "Drink if the statement applies to you" 
  },
  { 
    id: "sip_or_skip", 
    name: "Sip or Skip", 
    icon: <Wine className="w-5 h-5" />, 
    description: "Answer honestly or take a sip" 
  },
  { 
    id: "never_have_i_ever", 
    name: "Never Have I Ever", 
    icon: <Users className="w-5 h-5" />, 
    description: "Drink if you've done it" 
  },
  { 
    id: "truth_or_drink", 
    name: "Truth or Drink", 
    icon: <Flame className="w-5 h-5" />, 
    description: "Tell the truth or take a drink" 
  },
];

export const DrinkingGame = ({ partnerLinkId }: DrinkingGameProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const [spicyMode, setSpicyMode] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: ageGateEnabled } = useAgeGateEnabled();
  
  // Fetch partner name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-drinking", partnerId],
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
        .eq("game_type", "drinking_game")
        .maybeSingle();

      if (data) {
        const gameState = data.game_state as GameSession["game_state"];
        setSession({
          id: data.id,
          partner_link_id: data.partner_link_id,
          started_by: data.started_by,
          game_state: gameState,
        });
        setSpicyMode(gameState.is_spicy);
      }
    };

    fetchSession();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`drinking-${partnerLinkId}`)
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
            if ((payload.old as any).game_type === "drinking_game") {
              setSession(null);
            }
          } else {
            const data = payload.new as any;
            if (data.game_type === "drinking_game") {
              const gameState = data.game_state as GameSession["game_state"];
              setSession({
                id: data.id,
                partner_link_id: data.partner_link_id,
                started_by: data.started_by,
                game_state: gameState,
              });
              setSpicyMode(gameState.is_spicy);
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

  const handleSpicyToggle = (checked: boolean) => {
    if (checked && ageGateEnabled && !ageVerified) {
      setShowAgeGate(true);
    } else {
      setSpicyMode(checked);
    }
  };

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    setSpicyMode(true);
    setShowAgeGate(false);
  };

  const getRandomPrompt = (mode: GameMode): string => {
    const prompts = getPromptsByCategory(mode, spicyMode);
    const availablePrompts = prompts.filter(p => !usedPrompts.has(p.text));

    if (availablePrompts.length === 0) {
      setUsedPrompts(new Set());
      return prompts[Math.floor(Math.random() * prompts.length)].text;
    } else {
      const randomPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
      setUsedPrompts(prev => new Set([...prev, randomPrompt.text]));
      return randomPrompt.text;
    }
  };

  const startGame = async (mode: GameMode) => {
    if (!partnerLinkId || !user) return;
    setIsLoading(true);

    try {
      // Delete any existing session
      await supabase
        .from("couples_game_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "drinking_game");

      const prompt = getRandomPrompt(mode);

      const { data, error } = await supabase
        .from("couples_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          game_type: "drinking_game",
          game_state: {
            mode,
            is_spicy: spicyMode,
            current_prompt: prompt,
            prompt_index: 0,
            drink_counts: { [user.id]: 0 },
            revealed: false,
          },
        })
        .select()
        .single();

      if (error) throw error;

      const gameState = data.game_state as GameSession["game_state"];
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
        await notifyPartner.gameStarted(partnerId, myName, "Couples Drinking Game");
      }

      toast.success("Game started! Your partner has been notified.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  const revealCard = async () => {
    if (!session) return;

    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: {
          ...session.game_state,
          revealed: true,
        },
      })
      .eq("id", session.id);

    setIsCardFlipped(true);
  };

  const drawNextCard = async () => {
    if (!session) return;

    const prompt = getRandomPrompt(session.game_state.mode);

    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: {
          ...session.game_state,
          current_prompt: prompt,
          prompt_index: session.game_state.prompt_index + 1,
          revealed: false,
        },
      })
      .eq("id", session.id);

    setIsCardFlipped(false);
  };

  const addDrink = async (playerId: string) => {
    if (!session) return;

    const currentCounts = session.game_state.drink_counts || {};
    const newCounts = {
      ...currentCounts,
      [playerId]: (currentCounts[playerId] || 0) + 1,
    };

    await supabase
      .from("couples_game_sessions")
      .update({
        game_state: {
          ...session.game_state,
          drink_counts: newCounts,
        },
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
    setIsCardFlipped(false);
  };

  const remindPartner = async () => {
    if (!partnerId || !user) return;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    const myName = myProfile?.display_name || "Your partner";
    await notifyPartner.gameStarted(partnerId, myName, "Couples Drinking Game");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  const isPlaying = !!session;
  const myDrinks = session?.game_state.drink_counts?.[user?.id || ""] || 0;
  const partnerDrinks = session?.game_state.drink_counts?.[partnerId || ""] || 0;

  return (
    <>
      <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Wine className="w-5 h-5 text-white" />
              </div>
              Couples Drinking Game
              <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-500">
                21+
              </Badge>
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
                {/* Responsible drinking warning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Please drink responsibly. Know your limits and always have a safe way home.
                  </p>
                </div>

                {!isPlaying ? (
                  <>
                    {/* Spicy mode toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Spicy Mode</span>
                      </div>
                      <Switch checked={spicyMode} onCheckedChange={handleSpicyToggle} />
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Play remotely with your partner! 🍻
                    </p>

                    {/* Game mode selection */}
                    <div className="grid grid-cols-2 gap-3">
                      {gameModes.map((mode) => (
                        <motion.button
                          key={mode.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startGame(mode.id)}
                          disabled={isLoading || !partnerLinkId}
                          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all text-left disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                              {mode.icon}
                            </div>
                          </div>
                          <h4 className="font-semibold text-sm">{mode.name}</h4>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Game header */}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        {gameModes.find(m => m.id === session.game_state.mode)?.name}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={resetGame}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        End Game
                      </Button>
                    </div>

                    {/* Drink counters */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => user && addDrink(user.id)}
                        className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-center"
                      >
                        <p className="text-2xl font-bold text-pink-500">{myDrinks}</p>
                        <p className="text-xs text-muted-foreground">You took drinks</p>
                      </button>
                      <button
                        onClick={() => partnerId && addDrink(partnerId)}
                        className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center"
                      >
                        <p className="text-2xl font-bold text-blue-500">{partnerDrinks}</p>
                        <p className="text-xs text-muted-foreground">{partnerName} took drinks</p>
                      </button>
                    </div>

                    {/* Current card */}
                    {session.game_state.current_prompt && (
                      <div className="flex justify-center">
                        <div className="w-64">
                          <GameCard
                            theme="drinking"
                            isFlipped={isCardFlipped}
                            onFlip={revealCard}
                            showFlipHint={!isCardFlipped}
                            category={gameModes.find(m => m.id === session.game_state.mode)?.name || ""}
                            frontContent={
                              <div className="text-center p-4">
                                <p className="text-lg font-medium text-foreground leading-relaxed">
                                  {session.game_state.current_prompt}
                                </p>
                                {session.game_state.is_spicy && (
                                  <div className="flex items-center justify-center gap-1 mt-3">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span className="text-xs text-orange-500">Spicy</span>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Next card button */}
                    {isCardFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Button
                          onClick={drawNextCard}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          Next Card
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
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

export default DrinkingGame;
