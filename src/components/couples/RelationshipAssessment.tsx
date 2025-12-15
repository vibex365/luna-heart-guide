import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ClipboardCheck, ChevronRight, ChevronLeft, Heart, 
  MessageCircle, Shield, Sparkles, Check, Loader2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { notifyPartner } from "@/utils/smsNotifications";

interface Question {
  id: string;
  text: string;
  category: "communication" | "trust" | "intimacy" | "conflict";
}

const questions: Question[] = [
  // Communication (5 questions)
  { id: "c1", text: "My partner and I can discuss difficult topics without escalating into arguments.", category: "communication" },
  { id: "c2", text: "I feel heard and understood when I share my feelings with my partner.", category: "communication" },
  { id: "c3", text: "We regularly check in with each other about how we are feeling.", category: "communication" },
  { id: "c4", text: "My partner and I can express disagreement respectfully.", category: "communication" },
  { id: "c5", text: "I feel comfortable bringing up concerns with my partner.", category: "communication" },
  
  // Trust (5 questions)
  { id: "t1", text: "I trust my partner to be honest with me, even when it is difficult.", category: "trust" },
  { id: "t2", text: "My partner follows through on their commitments and promises.", category: "trust" },
  { id: "t3", text: "I feel secure in my relationship and do not worry about betrayal.", category: "trust" },
  { id: "t4", text: "My partner respects my privacy and boundaries.", category: "trust" },
  { id: "t5", text: "I can be vulnerable with my partner without fear of judgment.", category: "trust" },
  
  // Intimacy (5 questions)
  { id: "i1", text: "I feel emotionally connected to my partner.", category: "intimacy" },
  { id: "i2", text: "We make time for quality moments together.", category: "intimacy" },
  { id: "i3", text: "I feel appreciated and valued by my partner.", category: "intimacy" },
  { id: "i4", text: "My partner knows my needs and tries to meet them.", category: "intimacy" },
  { id: "i5", text: "We share our hopes, dreams, and fears with each other.", category: "intimacy" },
  
  // Conflict Resolution (5 questions)
  { id: "r1", text: "When we disagree, we focus on solving the problem rather than winning.", category: "conflict" },
  { id: "r2", text: "We can take breaks during heated moments and return to discuss calmly.", category: "conflict" },
  { id: "r3", text: "After conflicts, we repair and reconnect with each other.", category: "conflict" },
  { id: "r4", text: "My partner and I take responsibility for our own mistakes.", category: "conflict" },
  { id: "r5", text: "We do not bring up past issues during current disagreements.", category: "conflict" },
];

const answerOptions = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const categoryInfo = {
  communication: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  trust: { icon: Shield, color: "text-green-500", bg: "bg-green-500/10" },
  intimacy: { icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
  conflict: { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
};

export const RelationshipAssessment = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user already completed today
  const { data: todayAssessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ["today-assessment", user?.id, partnerLink?.id],
    queryFn: async () => {
      if (!user || !partnerLink) return null;
      
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("relationship_assessments")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .eq("user_id", user.id)
        .eq("assessment_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!partnerLink,
  });

  // Get partner ID
  const partnerId = partnerLink?.user_id === user?.id ? partnerLink?.partner_id : partnerLink?.user_id;

  // Check if partner completed today and get their scores
  const { data: partnerAssessment } = useQuery({
    queryKey: ["partner-assessment", partnerLink?.id, user?.id],
    queryFn: async () => {
      if (!user || !partnerLink || !partnerId) return null;
      
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("relationship_assessments")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .eq("user_id", partnerId)
        .eq("assessment_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!partnerLink && !!partnerId,
  });

  // Real-time subscription for partner's assessment
  useEffect(() => {
    if (!partnerLink?.id || !partnerId) return;

    const channel = supabase
      .channel(`assessment-${partnerLink.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "relationship_assessments",
          filter: `partner_link_id=eq.${partnerLink.id}`,
        },
        (payload) => {
          // Only react to partner's assessment, not our own
          if (payload.new && payload.new.user_id === partnerId) {
            queryClient.invalidateQueries({ queryKey: ["partner-assessment"] });
            queryClient.invalidateQueries({ queryKey: ["health-score"] });
            toast({
              title: "Partner Completed Assessment! 💜",
              description: "Your relationship health scores have been updated.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLink?.id, partnerId, queryClient, toast]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !partnerLink) throw new Error("Not connected");

      // Calculate scores per category
      const categoryScores = {
        communication: [] as number[],
        trust: [] as number[],
        intimacy: [] as number[],
        conflict: [] as number[],
      };

      questions.forEach(q => {
        if (answers[q.id]) {
          categoryScores[q.category].push(answers[q.id]);
        }
      });

      const calcScore = (arr: number[]) => 
        Math.round((arr.reduce((a, b) => a + b, 0) / (arr.length * 5)) * 100);

      const communicationScore = calcScore(categoryScores.communication);
      const trustScore = calcScore(categoryScores.trust);
      const intimacyScore = calcScore(categoryScores.intimacy);
      const conflictScore = calcScore(categoryScores.conflict);

      const { error } = await supabase
        .from("relationship_assessments")
        .insert({
          partner_link_id: partnerLink.id,
          user_id: user.id,
          communication_answers: categoryScores.communication,
          trust_answers: categoryScores.trust,
          intimacy_answers: categoryScores.intimacy,
          conflict_answers: categoryScores.conflict,
          communication_score: communicationScore,
          trust_score: trustScore,
          intimacy_score: intimacyScore,
          conflict_score: conflictScore,
        });

      if (error) throw error;

      return { communicationScore, trustScore, intimacyScore, conflictScore };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["health-score"] });
      
      // Send SMS notification to partner
      if (partnerId) {
        notifyPartner.assessmentComplete(partnerId);
      }
      
      toast({
        title: "Assessment Complete! 💜",
        description: partnerAssessment 
          ? "Your relationship health scores have been updated!" 
          : "Waiting for your partner to complete their assessment.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const canProceed = answers[currentQuestion?.id] !== undefined;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: parseInt(value) }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  if (isLoadingAssessment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already completed today
  if (todayAssessment) {
    const categories = [
      { key: "communication", label: "Communication", myScore: todayAssessment.communication_score, partnerScore: partnerAssessment?.communication_score, color: "text-blue-500", bg: "bg-blue-500" },
      { key: "trust", label: "Trust", myScore: todayAssessment.trust_score, partnerScore: partnerAssessment?.trust_score, color: "text-green-500", bg: "bg-green-500" },
      { key: "intimacy", label: "Intimacy", myScore: todayAssessment.intimacy_score, partnerScore: partnerAssessment?.intimacy_score, color: "text-pink-500", bg: "bg-pink-500" },
      { key: "conflict", label: "Conflict", myScore: todayAssessment.conflict_score, partnerScore: partnerAssessment?.conflict_score, color: "text-purple-500", bg: "bg-purple-500" },
    ];

    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Assessment Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partnerAssessment ? (
            <>
              <p className="text-sm text-muted-foreground">
                Compare your scores with your partner's below.
              </p>
              
              {/* Side-by-side comparison header */}
              <div className="flex items-center justify-between px-3 text-xs font-medium text-muted-foreground">
                <span>You</span>
                <span>Partner</span>
              </div>
              
              {/* Category scores side-by-side */}
              <div className="space-y-3">
                {categories.map(item => (
                  <div key={item.key} className="p-3 bg-background rounded-lg border border-border">
                    <p className={`text-xs font-medium ${item.color} mb-2 text-center`}>{item.label}</p>
                    <div className="flex items-center justify-between gap-3">
                      {/* My score */}
                      <div className="flex-1 text-center">
                        <p className={`text-xl font-bold ${item.color}`}>{item.myScore}%</p>
                      </div>
                      
                      {/* Visual comparison bar */}
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                        <div 
                          className={`absolute left-0 top-0 h-full ${item.bg} opacity-60`} 
                          style={{ width: `${item.myScore}%` }}
                        />
                        <div 
                          className={`absolute left-0 top-0 h-1 ${item.bg} mt-0.5`} 
                          style={{ width: `${item.partnerScore}%` }}
                        />
                      </div>
                      
                      {/* Partner score */}
                      <div className="flex-1 text-center">
                        <p className={`text-xl font-bold ${item.color}`}>{item.partnerScore}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Both partners completed - scores updated!
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You have completed today's relationship assessment.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {categories.map(item => (
                  <div key={item.key} className="p-3 bg-background rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>{item.myScore}%</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
                <Users className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Waiting for your partner to complete their assessment
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Not started yet
  if (!isStarted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Relationship Health Check
          </CardTitle>
          <CardDescription>
            Answer 20 questions to assess your relationship health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(categoryInfo).map(([key, info]) => {
              const Icon = info.icon;
              const labels: Record<string, string> = {
                communication: "Communication",
                trust: "Trust",
                intimacy: "Intimacy",
                conflict: "Conflict Resolution",
              };
              return (
                <div key={key} className={`p-3 rounded-lg ${info.bg} flex items-center gap-2`}>
                  <Icon className={`w-4 h-4 ${info.color}`} />
                  <span className="text-sm font-medium">{labels[key]}</span>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            When both you and your partner complete the assessment, your relationship 
            health scores will be updated based on the combined results.
          </p>

          <Button onClick={() => setIsStarted(true)} className="w-full">
            Start Assessment
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Assessment in progress
  const CategoryIcon = categoryInfo[currentQuestion.category].icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${categoryInfo[currentQuestion.category].bg}`}>
            <CategoryIcon className={`w-4 h-4 ${categoryInfo[currentQuestion.category].color}`} />
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-base font-medium leading-relaxed">
              {currentQuestion.text}
            </p>

            <RadioGroup
              value={answers[currentQuestion.id]?.toString()}
              onValueChange={handleAnswer}
              className="space-y-2"
            >
              {answerOptions.map(option => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    answers[currentQuestion.id] === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleAnswer(option.value.toString())}
                >
                  <RadioGroupItem value={option.value.toString()} id={`q-${option.value}`} />
                  <Label htmlFor={`q-${option.value}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className="flex-1"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Submit
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
