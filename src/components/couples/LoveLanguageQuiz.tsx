import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Gift, Clock, MessageCircle, Hand, ChevronRight, Trophy, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    language: LoveLanguage;
  }[];
}

type LoveLanguage = "words" | "quality_time" | "gifts" | "acts" | "touch";

interface LoveLanguageResult {
  id: string;
  user_id: string;
  primary_language: string;
  secondary_language: string;
  scores: Record<LoveLanguage, number>;
  completed_at: string;
}

const loveLanguageInfo: Record<LoveLanguage, { name: string; icon: React.ElementType; color: string; description: string; tips: string[] }> = {
  words: {
    name: "Words of Affirmation",
    icon: MessageCircle,
    color: "text-blue-500",
    description: "You feel most loved when receiving verbal compliments, encouragement, and expressions of appreciation.",
    tips: [
      "Leave loving notes for your partner",
      "Verbally express gratitude daily",
      "Send encouraging texts throughout the day",
      "Compliment your partner sincerely",
    ],
  },
  quality_time: {
    name: "Quality Time",
    icon: Clock,
    color: "text-green-500",
    description: "You feel most loved when someone gives you their undivided attention and spends meaningful time together.",
    tips: [
      "Schedule regular date nights",
      "Put phones away during meals",
      "Take walks together without distractions",
      "Plan activities you both enjoy",
    ],
  },
  gifts: {
    name: "Receiving Gifts",
    icon: Gift,
    color: "text-purple-500",
    description: "You feel most loved when receiving thoughtful gifts that show someone was thinking of you.",
    tips: [
      "Bring home small surprises occasionally",
      "Remember special occasions",
      "Notice things they mention wanting",
      "Give thoughtful, personalized gifts",
    ],
  },
  acts: {
    name: "Acts of Service",
    icon: Sparkles,
    color: "text-orange-500",
    description: "You feel most loved when someone does helpful things for you, easing your responsibilities.",
    tips: [
      "Help with chores without being asked",
      "Take over tasks when they're stressed",
      "Offer to run errands for them",
      "Cook meals or prepare their favorite things",
    ],
  },
  touch: {
    name: "Physical Touch",
    icon: Hand,
    color: "text-pink-500",
    description: "You feel most loved through physical affection like hugs, holding hands, and other forms of touch.",
    tips: [
      "Hold hands when walking together",
      "Give hugs and kisses throughout the day",
      "Cuddle while watching TV",
      "Offer massages after a long day",
    ],
  },
};

const questions: Question[] = [
  {
    id: 1,
    text: "After a long day, I would most appreciate my partner...",
    options: [
      { text: "Telling me how much they value me", language: "words" },
      { text: "Spending uninterrupted time together", language: "quality_time" },
      { text: "Surprising me with a small gift", language: "gifts" },
      { text: "Helping me with chores or tasks", language: "acts" },
      { text: "Giving me a warm hug", language: "touch" },
    ],
  },
  {
    id: 2,
    text: "I feel most connected to my partner when...",
    options: [
      { text: "They write me a heartfelt note", language: "words" },
      { text: "We have a dedicated date night", language: "quality_time" },
      { text: "They bring me something special", language: "gifts" },
      { text: "They take care of something I was dreading", language: "acts" },
      { text: "We're cuddling together", language: "touch" },
    ],
  },
  {
    id: 3,
    text: "I would be most hurt if my partner...",
    options: [
      { text: "Rarely said 'I love you' or gave compliments", language: "words" },
      { text: "Was always too busy for us to spend time together", language: "quality_time" },
      { text: "Forgot special occasions or never got me anything", language: "gifts" },
      { text: "Never helped out around the house", language: "acts" },
      { text: "Rarely showed physical affection", language: "touch" },
    ],
  },
  {
    id: 4,
    text: "The perfect anniversary gift would be...",
    options: [
      { text: "A love letter expressing their feelings", language: "words" },
      { text: "A weekend trip just the two of us", language: "quality_time" },
      { text: "Something meaningful they picked out", language: "gifts" },
      { text: "Them planning and doing everything", language: "acts" },
      { text: "A couples massage or spa day", language: "touch" },
    ],
  },
  {
    id: 5,
    text: "When I'm feeling down, I want my partner to...",
    options: [
      { text: "Tell me everything will be okay and they're proud of me", language: "words" },
      { text: "Drop everything and just be with me", language: "quality_time" },
      { text: "Bring me my favorite treat or flowers", language: "gifts" },
      { text: "Take care of things so I can rest", language: "acts" },
      { text: "Hold me and provide comfort", language: "touch" },
    ],
  },
];

export const LoveLanguageQuiz = () => {
  const { user } = useAuth();
  const { partnerLink, partnerId, isLinked } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<LoveLanguage[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Fetch existing results
  const { data: existingResults } = useQuery({
    queryKey: ["love-language-results", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return null;

      const { data, error } = await supabase
        .from("love_language_results")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        scores: item.scores as Record<LoveLanguage, number>
      })) as LoveLanguageResult[];
    },
    enabled: !!partnerLink,
  });

  // Fetch partner profile
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-quiz", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .maybeSingle();

      return data;
    },
    enabled: !!partnerId,
  });

  const myResult = existingResults?.find(r => r.user_id === user?.id);
  const partnerResult = existingResults?.find(r => r.user_id === partnerId);

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (results: { primary: LoveLanguage; secondary: LoveLanguage; scores: Record<LoveLanguage, number> }) => {
      if (!user || !partnerLink) throw new Error("Not connected");

      // Check if user already has a result
      const existing = existingResults?.find(r => r.user_id === user.id);

      if (existing) {
        const { error } = await supabase
          .from("love_language_results")
          .update({
            primary_language: results.primary,
            secondary_language: results.secondary,
            scores: results.scores,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("love_language_results")
          .insert({
            partner_link_id: partnerLink.id,
            user_id: user.id,
            primary_language: results.primary,
            secondary_language: results.secondary,
            scores: results.scores,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["love-language-results"] });
      toast({
        title: "Results Saved! 💜",
        description: "Your partner can now see your love language.",
      });
    },
  });

  const handleAnswer = (language: LoveLanguage) => {
    const newAnswers = [...answers, language];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const results = calculateResults(newAnswers);
      saveResultsMutation.mutate(results);
      setShowResults(true);
    }
  };

  const calculateResults = (ans: LoveLanguage[] = answers): { primary: LoveLanguage; secondary: LoveLanguage; scores: Record<LoveLanguage, number> } => {
    const scores: Record<LoveLanguage, number> = {
      words: 0,
      quality_time: 0,
      gifts: 0,
      acts: 0,
      touch: 0,
    };

    ans.forEach((answer) => {
      scores[answer]++;
    });

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return {
      primary: sorted[0][0] as LoveLanguage,
      secondary: sorted[1][0] as LoveLanguage,
      scores,
    };
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setIsStarted(false);
  };

  // Show saved results if both have completed
  if (myResult && partnerResult && !isStarted && !showResults) {
    const myPrimary = myResult.primary_language as LoveLanguage;
    const partnerPrimary = partnerResult.primary_language as LoveLanguage;
    const myInfo = loveLanguageInfo[myPrimary];
    const partnerInfo = loveLanguageInfo[partnerPrimary];
    const partnerName = partnerProfile?.display_name || "Your Partner";

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              Love Languages
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
              <Users className="w-3 h-3 mr-1" />
              Both Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comparison View */}
          <div className="grid grid-cols-2 gap-3">
            {/* Your Result */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">You</p>
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <myInfo.icon className={`w-5 h-5 ${myInfo.color}`} />
              </div>
              <p className="text-xs font-medium">{myInfo.name}</p>
            </div>

            {/* Partner Result */}
            <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">{partnerName}</p>
              <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center mb-1">
                <partnerInfo.icon className={`w-5 h-5 ${partnerInfo.color}`} />
              </div>
              <p className="text-xs font-medium">{partnerInfo.name}</p>
            </div>
          </div>

          {/* Tips for Partner's Love Language */}
          <div className="p-3 rounded-xl bg-background border border-border">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Tips for loving {partnerName}
            </p>
            <ul className="space-y-1">
              {partnerInfo.tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-pink-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsStarted(true)} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show waiting state if only I completed
  if (myResult && !partnerResult && !isStarted && !showResults) {
    const myPrimary = myResult.primary_language as LoveLanguage;
    const myInfo = loveLanguageInfo[myPrimary];
    const partnerName = partnerProfile?.display_name || "Your partner";

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Love Language Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <myInfo.icon className={`w-7 h-7 ${myInfo.color}`} />
            </div>
            <div>
              <p className="font-medium">{myInfo.name}</p>
              <p className="text-sm text-muted-foreground">Your primary love language</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Waiting for {partnerName} to complete the quiz...
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsStarted(true)} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isStarted && !showResults) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Love Language Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex justify-center gap-2">
              {Object.values(loveLanguageInfo).map((info, i) => (
                <motion.div
                  key={info.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <info.icon className={`w-6 h-6 ${info.color}`} />
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Discover how you prefer to give and receive love. Take this quick quiz together with your partner!
            </p>
            <Button
              onClick={() => setIsStarted(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            >
              Start Quiz
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const results = calculateResults();
    const primaryInfo = loveLanguageInfo[results.primary];
    const secondaryInfo = loveLanguageInfo[results.secondary];

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
              <primaryInfo.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{primaryInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{primaryInfo.description}</p>
            </div>
          </motion.div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium">All Scores</p>
            {Object.entries(results.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([lang, score]) => {
                const info = loveLanguageInfo[lang as LoveLanguage];
                return (
                  <div key={lang} className="flex items-center gap-2">
                    <info.icon className={`w-4 h-4 ${info.color}`} />
                    <span className="text-xs flex-1 truncate">{info.name}</span>
                    <Progress value={(score / questions.length) * 100} className="w-16 h-2" />
                    <span className="text-xs font-medium w-6">{score}/{questions.length}</span>
                  </div>
                );
              })}
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Secondary: <span className="font-medium">{secondaryInfo.name}</span>
            </p>
            <Button variant="outline" size="sm" onClick={resetQuiz} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Question {currentQuestion + 1}/{questions.length}
          </CardTitle>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium">{question.text}</p>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAnswer(option.language)}
                  className="w-full p-3 text-left text-sm rounded-xl border border-border bg-background hover:bg-secondary hover:border-primary/30 transition-all"
                >
                  {option.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};