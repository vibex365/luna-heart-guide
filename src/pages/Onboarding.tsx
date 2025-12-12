import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Heart, Users, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OnboardingData {
  reason: string;
  status: string;
  outcome: string;
  communication: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    reason: "",
    status: "",
    outcome: "",
    communication: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const steps = [
    {
      title: "What brings you here today?",
      subtitle: "I'm here to listen without judgment.",
      icon: Heart,
      options: [
        { value: "hurt", label: "I'm feeling hurt or confused" },
        { value: "communicate", label: "I want to communicate better" },
        { value: "understand", label: "I need to understand my partner" },
        { value: "heal", label: "I'm healing from something painful" },
        { value: "explore", label: "Just exploring my feelings" },
      ],
      field: "reason" as keyof OnboardingData,
    },
    {
      title: "What's your current situation?",
      subtitle: "This helps me understand your context.",
      icon: Users,
      options: [
        { value: "relationship", label: "In a relationship" },
        { value: "separated", label: "Recently separated" },
        { value: "dating", label: "Dating / Getting to know someone" },
        { value: "single", label: "Single and reflecting" },
        { value: "unsure", label: "It's complicated" },
      ],
      field: "status" as keyof OnboardingData,
    },
    {
      title: "What outcome do you hope for?",
      subtitle: "Let's set a gentle intention together.",
      icon: Sparkles,
      options: [
        { value: "clarity", label: "I want clarity on my feelings" },
        { value: "peace", label: "I want to feel at peace" },
        { value: "script", label: "I need help saying something" },
        { value: "understand", label: "I want to understand patterns" },
        { value: "support", label: "I just need emotional support" },
      ],
      field: "outcome" as keyof OnboardingData,
    },
    {
      title: "How do you prefer to communicate?",
      subtitle: "This helps me match your style.",
      icon: MessageCircle,
      options: [
        { value: "direct", label: "Direct and honest" },
        { value: "gentle", label: "Gentle and supportive" },
        { value: "slow", label: "I like to process slowly" },
        { value: "validation", label: "I need validation first" },
        { value: "actionable", label: "Give me actionable steps" },
      ],
      field: "communication" as keyof OnboardingData,
    },
  ];

  const currentStep = steps[step];

  const handleSelect = (value: string) => {
    setData({ ...data, [currentStep.field]: value });
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          relationship_reason: data.reason,
          relationship_status: data.status,
          desired_outcome: data.outcome,
          communication_style: data.communication,
        }, { onConflict: "user_id" });

      if (error) throw error;
      
      toast({
        title: "Preferences saved! 💜",
        description: "Luna is now personalized for you.",
      });
      navigate("/chat");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Couldn't save preferences",
        description: "We'll try again later. Taking you to chat.",
        variant: "destructive",
      });
      navigate("/chat");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      savePreferences();
    }
  };

  const handleSkip = async () => {
    // Just navigate without saving
    navigate("/chat");
  };

  const canContinue = data[currentStep.field] !== "";

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LunaAvatar size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <LunaAvatar size="sm" showGlow={false} />
          <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
        </div>
      </header>

      {/* Progress */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex gap-2 max-w-md mx-auto">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                index <= step ? "bg-accent" : "bg-border"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full max-w-lg text-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl gradient-luna flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <currentStep.icon className="w-8 h-8 text-accent" />
            </motion.div>

            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
              {currentStep.title}
            </h1>
            <p className="text-muted-foreground mb-8">
              {currentStep.subtitle}
            </p>

            <div className="space-y-3">
              {currentStep.options.map((option, index) => (
                <motion.button
                  key={option.value}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                    data[currentStep.field] === option.value
                      ? "bg-secondary border-accent shadow-luna"
                      : "bg-card border-border hover:border-accent/50 hover:bg-primary/20"
                  }`}
                  onClick={() => handleSelect(option.value)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium text-foreground">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Continue Button */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="peach"
            size="lg"
            onClick={handleNext}
            disabled={!canContinue || saving}
            className="min-w-[200px]"
          >
            {saving ? "Saving..." : step === steps.length - 1 ? "Start Talking to Luna" : "Continue"}
            {!saving && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        </motion.div>

        {/* Skip */}
        <motion.button
          className="mt-4 text-muted-foreground hover:text-accent text-sm transition-colors"
          onClick={handleSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Skip for now
        </motion.button>
      </main>
    </div>
  );
};

export default Onboarding;
