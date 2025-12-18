import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Shuffle, SkipForward, Heart, Users, Bell, Loader2 } from "lucide-react";
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
  regularNeverHaveIEver,
  spicyNeverHaveIEver,
} from "@/data/spicyGameContent";

interface NeverHaveIEverProps {
  partnerLinkId?: string;
}

interface GameSession {
  id: string;
  partner_link_id: string;
  started_by: string;
  statement_index: number;
  current_statement: string | null;
  is_spicy: boolean;
  answers: Record<string, boolean>;
}

export const NeverHaveIEver = ({ partnerLinkId }: NeverHaveIEverProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { partnerId } = useCouplesAccount();
  
  // Fetch partner's name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-nhie", partnerId],
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
  const [usedStatements, setUsedStatements] = useState<string[]>([]);
  
  const statements = isSpicy ? spicyNeverHaveIEver : regularNeverHaveIEver;

  // Fetch active session
  useEffect(() => {
    if (!partnerLinkId) {
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("never_have_i_ever_sessions")
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
      .channel(`nhie-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "never_have_i_ever_sessions",
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

  const getRandomStatement = () => {
    const currentStatements = isSpicy ? spicyNeverHaveIEver : regularNeverHaveIEver;
    const available = currentStatements.filter(s => !usedStatements.includes(s));
    if (available.length === 0) {
      setUsedStatements([]);
      return currentStatements[Math.floor(Math.random() * currentStatements.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const startGame = async () => {
    if (!partnerLinkId || !user) return;
    setIsCreating(true);

    // Delete any existing session
    await supabase
      .from("never_have_i_ever_sessions")
      .delete()
      .eq("partner_link_id", partnerLinkId);

    const statement = getRandomStatement();
    
    const { data, error } = await supabase
      .from("never_have_i_ever_sessions")
      .insert({
        partner_link_id: partnerLinkId,
        started_by: user.id,
        is_spicy: isSpicy,
        current_statement: statement,
        statement_index: 0,
        answers: {},
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
      setUsedStatements([statement]);
      // Notify partner
      if (partnerId) {
        console.log("Sending game started notification to partner:", partnerId);
        notifyPartner.gameStarted(partnerId, user.user_metadata?.display_name || "Your partner", "Never Have I Ever");
      }
      toast({
        title: "Game Started! 🎮",
        description: "Your partner has been notified",
      });
    }
    setIsCreating(false);
  };

  const submitAnswer = async (answer: boolean) => {
    if (!session || !user) return;

    const newAnswers = { ...session.answers, [user.id]: answer };
    
    await supabase
      .from("never_have_i_ever_sessions")
      .update({ answers: newAnswers })
      .eq("id", session.id);
  };

  const nextStatement = async () => {
    if (!session || !user) return;

    const statement = getRandomStatement();
    setUsedStatements(prev => [...prev, statement]);
    
    await supabase
      .from("never_have_i_ever_sessions")
      .update({
        current_statement: statement,
        statement_index: session.statement_index + 1,
        answers: {},
      })
      .eq("id", session.id);
  };

  const endGame = async () => {
    if (!session) return;

    await supabase
      .from("never_have_i_ever_sessions")
      .delete()
      .eq("id", session.id);

    setSession(null);
    setUsedStatements([]);
  };

  const remindPartner = async () => {
    if (!partnerId) return;
    
    await notifyPartner.gameStarted(
      partnerId,
      user?.user_metadata?.display_name || "Your partner",
      "Never Have I Ever"
    );
    
    toast({
      title: "Reminder Sent! 📱",
      description: `${partnerName || "Your partner"} has been notified`,
    });
  };

  const myAnswer = user ? session?.answers?.[user.id] : undefined;
  const partnerAnswer = partnerId ? session?.answers?.[partnerId] : undefined;
  const bothAnswered = myAnswer !== undefined && partnerAnswer !== undefined;
  const inSync = bothAnswered && myAnswer === partnerAnswer;

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
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hand className="w-5 h-5 text-indigo-500" />
            Never Have I Ever
            {session && (
              <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" /> Live
              </span>
            )}
          </CardTitle>
          {!session && (
            <div className="flex items-center gap-2">
              <Label htmlFor="spicy-nhie" className="text-xs text-muted-foreground">
                🔥 Spicy
              </Label>
              <Switch
                id="spicy-nhie"
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
                Play remotely with your partner!
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
          ) : (
            <motion.div
              key={session.statement_index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Statement Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-pink-500/10 border border-indigo-500/20 text-center">
                <p className="text-lg font-medium">{session.current_statement}</p>
                {session.is_spicy && (
                  <p className="text-xs text-orange-500 mt-2">🔥 Spicy mode</p>
                )}
              </div>

              {/* Answer Buttons */}
              {myAnswer === undefined ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center text-muted-foreground">Your answer:</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => submitAnswer(true)}
                      className="flex-1 border-green-500/30 hover:bg-green-500/10"
                    >
                      I have ✋
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => submitAnswer(false)}
                      className="flex-1"
                    >
                      Never
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full",
                    myAnswer ? "bg-green-500/20 text-green-600" : "bg-muted"
                  )}>
                    You: {myAnswer ? "I have ✋" : "Never"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full",
                    partnerAnswer !== undefined
                      ? partnerAnswer
                        ? "bg-green-500/20 text-green-600"
                        : "bg-muted"
                      : "bg-muted/50 text-muted-foreground"
                  )}>
                    {partnerName || "Partner"}: {
                      partnerAnswer !== undefined
                        ? partnerAnswer ? "They have ✋" : "Never"
                        : "Waiting..."
                    }
                  </div>
                </div>
              )}

              {/* Result */}
              {bothAnswered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg bg-muted/50 text-center"
                >
                  {inSync ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <Heart className="w-5 h-5 fill-current" />
                      <span className="font-medium">You're in sync!</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <span>Different experiences - time to share stories! 📖</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Waiting for partner */}
              {myAnswer !== undefined && partnerAnswer === undefined && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Waiting for {partnerName || "partner"} to answer...
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

              {/* Next Button */}
              {bothAnswered && (
                <Button onClick={nextStatement} className="w-full gap-2">
                  <SkipForward className="w-4 h-4" />
                  Next Statement
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endGame}
                  className="flex-1 text-muted-foreground"
                >
                  End Game
                </Button>
                {!bothAnswered && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextStatement}
                    className="flex-1 gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    Skip
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
