import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Heart, 
  Bell, 
  Trophy,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  thisOrThatQuestions, 
  categoryColors,
  categoryIcons,
  ThisOrThatQuestion 
} from "@/data/thisOrThatQuestions";
import { notifyPartner } from "@/utils/smsNotifications";

interface ThisOrThatProps {
  partnerLinkId?: string;
}

interface PlayerAnswers {
  [questionIndex: number]: "A" | "B";
}

export const ThisOrThat = ({ partnerLinkId }: ThisOrThatProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<PlayerAnswers>({});
  const [partnerAnswers, setPartnerAnswers] = useState<PlayerAnswers>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<ThisOrThatQuestion[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const totalQuestions = 20;

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
      .channel(`this-or-that-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "this_or_that_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const answers = newData.player_answers || {};
          
          if (partnerId && answers[partnerId]) {
            setPartnerAnswers(answers[partnerId]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, partnerId]);

  const shuffleQuestions = useCallback(() => {
    const shuffled = [...thisOrThatQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalQuestions);
    setShuffledQuestions(shuffled);
    return shuffled;
  }, []);

  const startGame = async () => {
    if (!partnerLinkId || !user) return;

    try {
      // Delete any existing session
      await supabase
        .from("this_or_that_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId);

      const questions = shuffleQuestions();

      // Create new session
      const { data, error } = await supabase
        .from("this_or_that_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          current_question_index: 0,
          player_answers: {},
          total_questions: totalQuestions,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setIsPlaying(true);
      setCurrentIndex(0);
      setMyAnswers({});
      setPartnerAnswers({});
      setIsComplete(false);

      // Notify partner
      if (partnerId) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        const myName = myProfile?.display_name || "Your partner";
        await notifyPartner.gameStarted(partnerId, myName, "This or That");
      }

      toast.success("Game started! Answer quickly!");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const selectOption = async (option: "A" | "B") => {
    if (!sessionId || !user) return;

    const newAnswers = { ...myAnswers, [currentIndex]: option };
    setMyAnswers(newAnswers);

    try {
      // Get current session
      const { data: session } = await supabase
        .from("this_or_that_sessions")
        .select("player_answers")
        .eq("id", sessionId)
        .single();

      const currentAnswers = (session?.player_answers as Record<string, Record<number, string>>) || {};
      const updatedAnswers: Record<string, Record<number, string>> = {
        ...currentAnswers,
        [user.id]: newAnswers as Record<number, string>,
      };

      await supabase
        .from("this_or_that_sessions")
        .update({ 
          player_answers: updatedAnswers,
          current_question_index: currentIndex + 1,
        })
        .eq("id", sessionId);

      // Move to next question or complete
      if (currentIndex >= totalQuestions - 1) {
        setIsComplete(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error saving answer:", error);
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
    await notifyPartner.gameStarted(partnerId, myName, "This or That");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  const calculateCompatibility = () => {
    if (Object.keys(partnerAnswers).length === 0) return null;
    
    let matches = 0;
    const answeredByBoth = Object.keys(myAnswers).filter(
      key => partnerAnswers[parseInt(key)] !== undefined
    );
    
    answeredByBoth.forEach(key => {
      const idx = parseInt(key);
      if (myAnswers[idx] === partnerAnswers[idx]) {
        matches++;
      }
    });
    
    if (answeredByBoth.length === 0) return null;
    return Math.round((matches / answeredByBoth.length) * 100);
  };

  const compatibility = calculateCompatibility();
  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  if (!isPlaying) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            This or That
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Quick-fire choices! Pick between two options and discover how 
            compatible your preferences are with your partner. ⚡
          </p>
          <Button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center space-y-4"
          >
            {compatibility !== null ? (
              <>
                <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {compatibility}%
                </div>
                <p className="text-muted-foreground">
                  {compatibility >= 80 
                    ? "Amazing! You two think alike! 🔥" 
                    : compatibility >= 60 
                    ? "Great compatibility! 💕"
                    : compatibility >= 40
                    ? "Interesting differences! 🌟"
                    : "Opposites attract! 😊"}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Waiting for {partnerName} to complete their answers...
                </p>
                <Button onClick={remindPartner} variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Remind {partnerName}
                </Button>
              </div>
            )}
          </motion.div>

          <Button
            onClick={() => {
              setIsPlaying(false);
              setIsComplete(false);
            }}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-400" />
            This or That
          </CardTitle>
          <Badge variant="outline" className="text-amber-300 border-amber-500/30">
            {currentIndex + 1}/{totalQuestions}
          </Badge>
        </div>
        <Progress value={progress} className="h-1 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <Badge className={categoryColors[currentQuestion.category]}>
                  {categoryIcons[currentQuestion.category]} {currentQuestion.category}
                </Badge>
              </div>

              <div className="grid gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectOption("A")}
                  className="p-6 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-center hover:from-pink-500/30 hover:to-rose-500/30 transition-all"
                >
                  <span className="text-lg font-medium">{currentQuestion.optionA}</span>
                </motion.button>

                <div className="flex items-center justify-center">
                  <span className="text-sm text-muted-foreground px-4 py-1 bg-background/50 rounded-full">
                    or
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectOption("B")}
                  className="p-6 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-center hover:from-purple-500/30 hover:to-indigo-500/30 transition-all"
                >
                  <span className="text-lg font-medium">{currentQuestion.optionB}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
