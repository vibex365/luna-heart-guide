import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  Wind, 
  BookOpen, 
  Heart,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import LunaAvatar from "./LunaAvatar";

type DemoTab = "chat" | "mood" | "breathe" | "journal" | "transform";

// Animated counter component
const AnimatedCounter = ({ value, duration = 500 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const demoMessages = [
  { role: "user", content: "I have been feeling really anxious about my relationship lately..." },
  { role: "assistant", content: "I hear you, and it takes courage to share that. Can you tell me more about what has been making you feel anxious? Is it something specific that happened, or a general feeling?" },
  { role: "user", content: "My partner and I keep having the same argument over and over." },
  { role: "assistant", content: "Repetitive conflicts can be exhausting. Often, they signal an underlying need that is not being met. Let us explore this together — when these arguments happen, what is the core issue you are trying to communicate?" },
  { role: "user", content: "I feel like they do not listen to me when I share my feelings." },
  { role: "assistant", content: "Feeling unheard is incredibly painful. It sounds like you need validation and active listening from your partner. Would you like me to help you craft a way to express this need that feels authentic to you?" },
  { role: "user", content: "Yes, I would really appreciate that." },
  { role: "assistant", content: "Try saying: \"When I share my feelings with you, I need you to acknowledge them before offering solutions. It helps me feel connected to you.\" This uses \"I\" statements and focuses on your needs rather than blame. How does that feel?" },
  { role: "user", content: "That sounds really helpful. Thank you, Luna." },
  { role: "assistant", content: "You are doing important work by reflecting on this. Remember, healthy communication is a skill that takes practice. I am here whenever you need to talk through these moments. You have got this! 💜" },
];

const moodEmojis = [
  { emoji: "😢", label: "Sad", level: 1, color: "from-blue-400/30 to-blue-500/20" },
  { emoji: "😔", label: "Down", level: 2, color: "from-indigo-400/30 to-indigo-500/20" },
  { emoji: "😐", label: "Neutral", level: 3, color: "from-slate-400/30 to-slate-500/20" },
  { emoji: "🙂", label: "Good", level: 4, color: "from-amber-400/30 to-amber-500/20" },
  { emoji: "😊", label: "Happy", level: 5, color: "from-accent/30 to-primary/20" },
];

const journalPrompts = [
  "What made you smile today?",
  "Write about a challenge you overcame recently.",
  "Describe your ideal peaceful moment.",
  "What are you grateful for right now?",
];

const beforeAfterStates = {
  before: {
    title: "Before Luna",
    emoji: "😔",
    stats: [
      { label: "Communication", value: 25 },
      { label: "Self-Awareness", value: 30 },
      { label: "Emotional Balance", value: 20 },
      { label: "Relationship Health", value: 35 },
    ],
    feelings: ["Overwhelmed", "Anxious", "Disconnected", "Confused"],
    color: "from-blue-500/20 to-indigo-500/20",
  },
  after: {
    title: "After 30 Days with Luna",
    emoji: "😊",
    stats: [
      { label: "Communication", value: 85 },
      { label: "Self-Awareness", value: 90 },
      { label: "Emotional Balance", value: 80 },
      { label: "Relationship Health", value: 88 },
    ],
    feelings: ["Confident", "Calm", "Connected", "Clear"],
    color: "from-accent/20 to-primary/20",
  },
};

const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("chat");
  const [chatIndex, setChatIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [transformSlider, setTransformSlider] = useState([50]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-play chat demo with looping
  useEffect(() => {
    if (activeTab !== "chat" || isPaused) return;

    if (chatIndex >= demoMessages.length) {
      // Wait 3 seconds then restart
      const restartTimer = setTimeout(() => {
        setChatIndex(0);
      }, 3000);
      return () => clearTimeout(restartTimer);
    }

    const timer = setTimeout(() => {
      if (demoMessages[chatIndex].role === "assistant") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setChatIndex((prev) => prev + 1);
        }, 1200);
      } else {
        setChatIndex((prev) => prev + 1);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [activeTab, chatIndex, isPaused]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatIndex, isTyping]);

  // Breathing exercise timer
  useEffect(() => {
    if (!isBreathing) return;
    
    const phases: Array<{ phase: typeof breathPhase; duration: number }> = [
      { phase: "inhale", duration: 4000 },
      { phase: "hold", duration: 4000 },
      { phase: "exhale", duration: 4000 },
    ];
    
    let phaseIndex = 0;
    
    const runPhase = () => {
      setBreathPhase(phases[phaseIndex].phase);
      
      setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        if (phaseIndex === 0) {
          setBreathCount((prev) => prev + 1);
        }
        if (isBreathing) {
          runPhase();
        }
      }, phases[phaseIndex].duration);
    };
    
    runPhase();
    
    return () => setBreathPhase("rest");
  }, [isBreathing]);

  const resetChat = () => {
    setChatIndex(0);
    setIsTyping(false);
    setIsPaused(false);
  };

  const tabs: { id: DemoTab; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "AI Chat", icon: MessageCircle },
    { id: "transform", label: "Your Growth", icon: TrendingUp },
    { id: "mood", label: "Mood Tracker", icon: Sparkles },
    { id: "breathe", label: "Breathe", icon: Wind },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

  // Calculate interpolated values for the slider
  const sliderValue = transformSlider[0];
  const interpolate = (before: number, after: number) => {
    return Math.round(before + (after - before) * (sliderValue / 100));
  };

  return (
    <section id="demo" className="py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent text-sm font-medium uppercase tracking-wider">
            Interactive Demo
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Try Luna right now
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience how Luna can support your emotional wellness journey. Click through our features below.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "peach" : "outline"}
                size="lg"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "chat") resetChat();
                }}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Demo Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-3xl border border-border shadow-luna overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Chat Demo */}
              {activeTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <LunaAvatar size="sm" />
                      <div>
                        <p className="font-semibold text-foreground">Luna</p>
                        <p className="text-xs text-accent">Online • Ready to listen</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetChat}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart
                      </Button>
                    </div>
                  </div>

                  <div 
                    ref={chatContainerRef}
                    className="space-y-4 min-h-[320px] max-h-[320px] overflow-y-auto pr-2 scrollbar-thin"
                  >
                    {demoMessages.slice(0, chatIndex).map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-accent/20 text-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted p-4 rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {chatIndex >= demoMessages.length && !isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-4"
                      >
                        <p className="text-muted-foreground text-sm">
                          Conversation complete • Restarting...
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Message {Math.min(chatIndex, demoMessages.length)} of {demoMessages.length}
                      </span>
                      <div className="flex gap-1">
                        {demoMessages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx < chatIndex ? "bg-accent" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-muted rounded-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        disabled
                      />
                      <Button size="icon" className="rounded-full w-12 h-12" disabled>
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Transformation Comparison Demo */}
              {activeTab === "transform" && (
                <motion.div
                  key="transform"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                      See Your Transformation
                    </h3>
                    <p className="text-muted-foreground">
                      Drag the slider to see how Luna helps you grow
                    </p>
                  </div>

                  {/* Slider */}
                  <div className="mb-8 px-4">
                    <div className="flex justify-between mb-3 text-sm">
                      <span className="text-muted-foreground">Day 1</span>
                      <span className="text-accent font-medium">Day {Math.round(sliderValue * 0.3)}</span>
                      <span className="text-muted-foreground">Day 30</span>
                    </div>
                    <Slider
                      value={transformSlider}
                      onValueChange={setTransformSlider}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Emotional State Display */}
                  <div className="relative mb-8">
                    <motion.div
                      animate={{
                        background: `linear-gradient(135deg, ${
                          sliderValue < 50 
                            ? "hsl(var(--muted))" 
                            : "hsl(var(--accent) / 0.2)"
                        } 0%, ${
                          sliderValue < 50 
                            ? "hsl(var(--muted))" 
                            : "hsl(var(--primary) / 0.2)"
                        } 100%)`,
                      }}
                      className="rounded-2xl p-6 text-center"
                    >
                      <motion.span
                        key={sliderValue > 50 ? "happy" : "sad"}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl block mb-4"
                      >
                        {sliderValue < 25 ? "😢" : sliderValue < 50 ? "😔" : sliderValue < 75 ? "🙂" : "😊"}
                      </motion.span>
                      <p className="font-heading text-xl font-bold text-foreground">
                        {sliderValue < 25 
                          ? "Struggling" 
                          : sliderValue < 50 
                          ? "Starting the Journey" 
                          : sliderValue < 75 
                          ? "Making Progress" 
                          : "Thriving"}
                      </p>
                    </motion.div>
                  </div>

                  {/* Stats Comparison */}
                  <div className="space-y-4">
                    {beforeAfterStates.before.stats.map((stat, idx) => {
                      const afterStat = beforeAfterStates.after.stats[idx];
                      const currentValue = interpolate(stat.value, afterStat.value);
                      return (
                        <div key={stat.label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-foreground">{stat.label}</span>
                            <motion.span 
                              className="text-sm font-bold text-accent tabular-nums"
                              animate={{ 
                                scale: [1, 1.1, 1],
                              }}
                              transition={{ duration: 0.3 }}
                              key={currentValue}
                            >
                              <AnimatedCounter value={currentValue} duration={300} />%
                            </motion.span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${currentValue}%` }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feelings Tags */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {(sliderValue < 50 ? beforeAfterStates.before.feelings : beforeAfterStates.after.feelings).map((feeling) => (
                      <motion.span
                        key={feeling}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          sliderValue < 50 
                            ? "bg-muted text-muted-foreground" 
                            : "bg-accent/20 text-accent"
                        }`}
                      >
                        {feeling}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Mood Tracker Demo */}
              {activeTab === "mood" && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                      How are you feeling?
                    </h3>
                    <p className="text-muted-foreground">
                      Tap to log your current mood
                    </p>
                  </div>

                  <div className="flex justify-center gap-4 mb-8">
                    {moodEmojis.map((mood) => (
                      <motion.button
                        key={mood.level}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMood(mood.level)}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center text-3xl transition-all ${
                          selectedMood === mood.level
                            ? "ring-4 ring-accent ring-offset-2 ring-offset-card scale-110"
                            : "hover:ring-2 hover:ring-accent/50"
                        }`}
                      >
                        {mood.emoji}
                      </motion.button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedMood && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center"
                      >
                        <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-6 py-3">
                          <Heart className="w-5 h-5 text-accent" />
                          <span className="text-foreground font-medium">
                            Feeling {moodEmojis.find(m => m.level === selectedMood)?.label}
                          </span>
                        </div>
                        <p className="mt-4 text-muted-foreground text-sm">
                          Your mood has been logged! Luna will track patterns over time.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Breathing Exercise Demo */}
              {activeTab === "breathe" && (
                <motion.div
                  key="breathe"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                      4-4-4 Breathing
                    </h3>
                    <p className="text-muted-foreground">
                      Follow the circle to calm your mind
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-48 mb-8">
                      <motion.div
                        animate={{
                          scale: breathPhase === "inhale" ? 1.3 : breathPhase === "hold" ? 1.3 : 1,
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/40 to-primary/30 blur-xl"
                      />
                      <motion.div
                        animate={{
                          scale: breathPhase === "inhale" ? 1.2 : breathPhase === "hold" ? 1.2 : 1,
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/60 to-primary/40 flex items-center justify-center"
                      >
                        <span className="text-4xl font-bold text-foreground capitalize">
                          {isBreathing ? breathPhase : "Ready"}
                        </span>
                      </motion.div>
                    </div>

                    <div className="flex gap-4 mb-4">
                      <Button
                        variant="peach"
                        size="lg"
                        onClick={() => {
                          setIsBreathing(!isBreathing);
                          if (!isBreathing) setBreathCount(0);
                        }}
                      >
                        {isBreathing ? (
                          <>
                            <Pause className="w-5 h-5 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>

                    {breathCount > 0 && (
                      <p className="text-muted-foreground text-sm">
                        Completed {breathCount} breath{breathCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Journal Demo */}
              {activeTab === "journal" && (
                <motion.div
                  key="journal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8"
                >
                  <div className="text-center mb-6">
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                      Todays Prompt
                    </h3>
                    <motion.p
                      key={currentPrompt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-accent font-medium text-lg"
                    >
                      &quot;{journalPrompts[currentPrompt]}&quot;
                    </motion.p>
                  </div>

                  <div className="mb-4">
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="Start writing your thoughts..."
                      className="w-full h-40 bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPrompt((prev) => (prev + 1) % journalPrompts.length)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Prompt
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {journalText.length} characters
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-muted-foreground text-sm mt-6">
            This is a preview. Sign up to unlock full features and save your progress.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
