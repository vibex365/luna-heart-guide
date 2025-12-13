import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Heart, Users, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { toast } from "sonner";

interface Question {
  optionA: string;
  optionB: string;
  category: "romantic" | "fun" | "deep" | "adventure";
}

const questions: Question[] = [
  // Romantic
  { optionA: "Receive breakfast in bed every morning", optionB: "Get a love note every day", category: "romantic" },
  { optionA: "Have a surprise date night planned for you", optionB: "Plan the perfect date for your partner", category: "romantic" },
  { optionA: "Always hold hands in public", optionB: "Always get a goodbye kiss", category: "romantic" },
  { optionA: "Slow dance in the kitchen", optionB: "Watch the sunset together", category: "romantic" },
  
  // Fun
  { optionA: "Only communicate through song lyrics for a day", optionB: "Only communicate through movie quotes for a day", category: "fun" },
  { optionA: "Have a food fight", optionB: "Have a pillow fight", category: "fun" },
  { optionA: "Do karaoke together in public", optionB: "Take a dance class together", category: "fun" },
  { optionA: "Binge-watch your partner's favorite show", optionB: "Let your partner pick all meals for a week", category: "fun" },
  
  // Deep
  { optionA: "Know exactly what your partner is thinking", optionB: "Always know how to make them feel better", category: "deep" },
  { optionA: "Relive your first date", optionB: "Fast-forward to your 50th anniversary", category: "deep" },
  { optionA: "Never argue again", optionB: "Always resolve arguments within an hour", category: "deep" },
  { optionA: "Have your partner's full support in any career change", optionB: "Have your partner's full attention whenever you need to talk", category: "deep" },
  
  // Adventure
  { optionA: "Travel the world together for a year", optionB: "Build your dream home together", category: "adventure" },
  { optionA: "Go skydiving together", optionB: "Go scuba diving together", category: "adventure" },
  { optionA: "Live in a new country for a year", optionB: "Take a month-long road trip", category: "adventure" },
  { optionA: "Climb a mountain together", optionB: "Sail across an ocean together", category: "adventure" },
];

const categoryColors = {
  romantic: "text-pink-500",
  fun: "text-yellow-500",
  deep: "text-purple-500",
  adventure: "text-green-500",
};

interface WouldYouRatherProps {
  partnerLinkId?: string;
}

export const WouldYouRather = ({ partnerLinkId }: WouldYouRatherProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const [partnerSelected, setPartnerSelected] = useState<"A" | "B" | null>(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);

  const currentQuestion = questions[currentIndex];
  const showResult = selectedOption !== null && partnerSelected !== null;

  // Subscribe to real-time answers
  useEffect(() => {
    if (!partnerLinkId || !partnerId) return;

    const channel = supabase
      .channel(`wyr-${partnerLinkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'would_you_rather_answers',
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          const answer = payload.new as { user_id: string; question_index: number; selected_option: string };
          
          // Only process partner's answers for current question
          if (answer.user_id === partnerId && answer.question_index === currentIndex) {
            setPartnerSelected(answer.selected_option as "A" | "B");
            setWaitingForPartner(false);
            toast.success("Your partner answered!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, partnerId, currentIndex]);

  // Check for existing answers when question changes
  useEffect(() => {
    if (!partnerLinkId) return;

    const checkExistingAnswers = async () => {
      const { data } = await supabase
        .from('would_you_rather_answers')
        .select('*')
        .eq('partner_link_id', partnerLinkId)
        .eq('question_index', currentIndex);

      if (data) {
        data.forEach((answer) => {
          if (answer.user_id === user?.id) {
            setSelectedOption(answer.selected_option as "A" | "B");
            setWaitingForPartner(true);
          } else if (answer.user_id === partnerId) {
            setPartnerSelected(answer.selected_option as "A" | "B");
          }
        });
      }
    };

    checkExistingAnswers();
  }, [partnerLinkId, currentIndex, user?.id, partnerId]);

  // Update match count when both have answered
  useEffect(() => {
    if (selectedOption && partnerSelected) {
      setTotalPlayed(prev => prev + 1);
      if (selectedOption === partnerSelected) {
        setMatchCount(prev => prev + 1);
      }
    }
  }, [selectedOption, partnerSelected]);

  const handleSelect = async (option: "A" | "B") => {
    if (!partnerLinkId || !user?.id) {
      toast.error("You need to be linked with a partner to play");
      return;
    }

    setSelectedOption(option);
    setWaitingForPartner(true);

    // Save answer to database
    const { error } = await supabase
      .from('would_you_rather_answers')
      .insert({
        partner_link_id: partnerLinkId,
        user_id: user.id,
        question_index: currentIndex,
        selected_option: option,
      });

    if (error) {
      console.error('Error saving answer:', error);
      toast.error("Failed to save your answer");
      setSelectedOption(null);
      setWaitingForPartner(false);
    }
  };

  const nextQuestion = async () => {
    // Clear old answers from database
    if (partnerLinkId && user?.id) {
      await supabase
        .from('would_you_rather_answers')
        .delete()
        .eq('partner_link_id', partnerLinkId)
        .eq('question_index', currentIndex);
    }

    setSelectedOption(null);
    setPartnerSelected(null);
    setWaitingForPartner(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const shuffleQuestion = async () => {
    // Clear current answers
    if (partnerLinkId && user?.id) {
      await supabase
        .from('would_you_rather_answers')
        .delete()
        .eq('partner_link_id', partnerLinkId)
        .eq('question_index', currentIndex);
    }

    setSelectedOption(null);
    setPartnerSelected(null);
    setWaitingForPartner(false);
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentIndex(randomIndex);
  };

  const isMatch = selectedOption === partnerSelected;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Would You Rather
          </CardTitle>
          {totalPlayed > 0 && (
            <span className="text-xs text-muted-foreground">
              {matchCount}/{totalPlayed} matches
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium capitalize ${categoryColors[currentQuestion.category]}`}>
                  {currentQuestion.category}
                </span>
                <Button variant="ghost" size="sm" onClick={shuffleQuestion} className="h-8" disabled={waitingForPartner}>
                  <Shuffle className="w-4 h-4 mr-1" />
                  Shuffle
                </Button>
              </div>

              <p className="text-sm font-medium text-center text-muted-foreground">
                Would you rather...
              </p>

              {waitingForPartner ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 space-y-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Waiting for your partner to answer...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You chose: <span className="font-medium">{selectedOption === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span>
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect("A")}
                    disabled={!partnerLinkId}
                    className="w-full p-4 text-left text-sm rounded-xl border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium text-primary mr-2">A:</span>
                    {currentQuestion.optionA}
                  </motion.button>

                  <div className="text-center text-xs text-muted-foreground font-medium">OR</div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect("B")}
                    disabled={!partnerLinkId}
                    className="w-full p-4 text-left text-sm rounded-xl border-2 border-pink-500/20 bg-background hover:bg-pink-500/5 hover:border-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium text-pink-500 mr-2">B:</span>
                    {currentQuestion.optionB}
                  </motion.button>
                </div>
              )}

              {!partnerLinkId && (
                <p className="text-xs text-center text-muted-foreground">
                  Link with a partner to play together!
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              {isMatch ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">You matched!</p>
                  <p className="text-sm text-muted-foreground">
                    You both chose: <span className="font-medium">{selectedOption === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <p className="font-semibold">Different choices!</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>You chose: <span className="font-medium">{selectedOption === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span></p>
                    <p>Partner chose: <span className="font-medium">{partnerSelected === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Differences make relationships interesting!
                  </p>
                </motion.div>
              )}

              <Button onClick={nextQuestion} className="mt-4">
                Next Question
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
