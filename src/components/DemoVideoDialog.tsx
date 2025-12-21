import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, MessageCircle, Heart, Wind, BookOpen, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import LunaAvatar from "./LunaAvatar";

interface DemoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoSteps = [
  {
    title: "Start a Conversation",
    description: "Share what's on your mind with Luna. She listens without judgment.",
    icon: MessageCircle,
    messages: [
      { role: "user", content: "I've been feeling anxious about my relationship lately..." },
      { role: "luna", content: "I hear you. Relationship anxiety is really common. Can you tell me more about what's making you feel this way?" }
    ]
  },
  {
    title: "Track Your Mood",
    description: "Log your emotions daily and discover patterns over time.",
    icon: Sparkles,
    messages: [
      { role: "system", content: "How are you feeling today?" },
      { role: "mood", content: "😌 Calm" },
      { role: "luna", content: "That's wonderful! You've felt calm 3 days in a row. Keep nurturing this peace." }
    ]
  },
  {
    title: "Practice Breathing",
    description: "Access calming techniques whenever you need to center yourself.",
    icon: Wind,
    messages: [
      { role: "luna", content: "Let's try a 4-7-8 breathing exercise. Inhale for 4 seconds..." },
      { role: "system", content: "Breathe in... Hold... Breathe out..." },
      { role: "luna", content: "Great job! How do you feel now?" }
    ]
  },
  {
    title: "Journal Your Thoughts",
    description: "Write freely with thoughtful prompts that help you reflect.",
    icon: BookOpen,
    messages: [
      { role: "luna", content: "Today's prompt: What are you grateful for right now?" },
      { role: "user", content: "I'm grateful for the quiet morning and my morning coffee..." },
      { role: "luna", content: "Beautiful reflection. Gratitude can shift our whole perspective. 💕" }
    ]
  },
  {
    title: "Connect with Partner",
    description: "Couples mode brings you closer with games, gifts, and daily check-ins.",
    icon: Users,
    messages: [
      { role: "system", content: "🎁 Your partner sent you a gift!" },
      { role: "partner", content: "Thinking of you today ❤️" },
      { role: "luna", content: "Your connection streak is now 14 days! 🔥" }
    ]
  }
];

const DemoVideoDialog = ({ open, onOpenChange }: DemoVideoDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);

  const step = demoSteps[currentStep];

  // Auto-play messages when step changes
  useEffect(() => {
    if (!isPlaying) return;
    
    setVisibleMessages(0);
    const messages = step.messages;
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < messages.length) {
        setVisibleMessages(messageIndex + 1);
        messageIndex++;
      } else {
        clearInterval(interval);
        // Move to next step after delay
        setTimeout(() => {
          if (currentStep < demoSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            setIsPlaying(false);
            setCurrentStep(0);
          }
        }, 2000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentStep, isPlaying, step.messages]);

  const handlePlay = () => {
    setCurrentStep(0);
    setVisibleMessages(0);
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setVisibleMessages(0);
    onOpenChange(false);
  };

  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-accent/20">
        <DialogHeader className="sr-only">
          <DialogTitle>Luna Interactive Demo</DialogTitle>
        </DialogHeader>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-accent/20 via-primary/15 to-peach/20 p-6 border-b border-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LunaAvatar size="sm" showGlow />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Interactive Demo</h2>
                <p className="text-sm text-muted-foreground">See how Luna helps you heal</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="p-6 min-h-[400px]">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {demoSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentStep(index);
                  setVisibleMessages(0);
                  setIsPlaying(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-8 bg-accent" 
                    : index < currentStep 
                      ? "bg-accent/50" 
                      : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-romantic mb-3 shadow-romantic">
                  <StepIcon className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground mt-1">{step.description}</p>
              </div>

              {/* Phone mockup with chat */}
              <div className="max-w-sm mx-auto">
                <div className="bg-muted/30 rounded-3xl p-4 border border-accent/10 shadow-soft">
                  {/* Phone header */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <div className="w-16 h-1 bg-muted rounded-full" />
                  </div>
                  
                  {/* Chat messages */}
                  <div className="space-y-3 min-h-[200px]">
                    {step.messages.map((message, index) => (
                      <AnimatePresence key={index}>
                        {index < visibleMessages && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${
                              message.role === "user" || message.role === "partner" 
                                ? "justify-end" 
                                : "justify-start"
                            }`}
                          >
                            {message.role === "luna" && (
                              <div className="w-8 h-8 mr-2 flex-shrink-0">
                                <LunaAvatar size="sm" showGlow={false} />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                message.role === "user"
                                  ? "bg-accent text-accent-foreground"
                                  : message.role === "partner"
                                    ? "bg-peach text-peach-foreground"
                                    : message.role === "mood"
                                      ? "bg-gradient-to-r from-accent/20 to-peach/20 text-foreground text-center text-2xl border border-accent/20"
                                      : message.role === "system"
                                        ? "bg-muted/50 text-muted-foreground text-center italic text-sm"
                                        : "bg-card border border-accent/20 text-foreground"
                              }`}
                            >
                              {message.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                    
                    {/* Typing indicator */}
                    {isPlaying && visibleMessages < step.messages.length && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-8 h-8">
                          <LunaAvatar size="sm" showGlow={false} />
                        </div>
                        <div className="bg-card border border-accent/20 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-accent/10 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
                onClick={() => {
                  setCurrentStep(prev => prev - 1);
                  setVisibleMessages(0);
                  setIsPlaying(false);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentStep === demoSteps.length - 1}
                onClick={() => {
                  setCurrentStep(prev => prev + 1);
                  setVisibleMessages(0);
                  setIsPlaying(false);
                }}
              >
                Next
              </Button>
            </div>
            
            {!isPlaying ? (
              <Button variant="peach" onClick={handlePlay}>
                <Play className="w-4 h-4 mr-2" />
                Play Full Demo
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsPlaying(false)}>
                Pause
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoDialog;
