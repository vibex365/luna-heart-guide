import { useState, useEffect } from "react";
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
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "./LunaAvatar";

type DemoTab = "chat" | "mood" | "breathe" | "journal";

const demoMessages = [
  { role: "user", content: "I've been feeling really anxious about my relationship lately..." },
  { role: "assistant", content: "I hear you, and it takes courage to share that. Can you tell me more about what's been making you feel anxious? Is it something specific that happened, or a general feeling?" },
  { role: "user", content: "My partner and I keep having the same argument over and over." },
  { role: "assistant", content: "Repetitive conflicts can be exhausting. Often, they signal an underlying need that isn't being met. Let's explore this together — when these arguments happen, what's the core issue you're trying to communicate? I can help you find the right words." },
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

const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("chat");
  const [chatIndex, setChatIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(0);

  // Auto-play chat demo
  useEffect(() => {
    if (activeTab === "chat" && chatIndex < demoMessages.length) {
      const timer = setTimeout(() => {
        if (demoMessages[chatIndex].role === "assistant") {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setChatIndex((prev) => prev + 1);
          }, 1500);
        } else {
          setChatIndex((prev) => prev + 1);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, chatIndex]);

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
  };

  const tabs: { id: DemoTab; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "AI Chat", icon: MessageCircle },
    { id: "mood", label: "Mood Tracker", icon: Sparkles },
    { id: "breathe", label: "Breathe", icon: Wind },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

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
                    <Button variant="ghost" size="sm" onClick={resetChat}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Replay
                    </Button>
                  </div>

                  <div className="space-y-4 min-h-[320px]">
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
                  </div>

                  <div className="mt-6 flex gap-3">
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
                      Today's Prompt
                    </h3>
                    <motion.p
                      key={currentPrompt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-accent font-medium text-lg"
                    >
                      "{journalPrompts[currentPrompt]}"
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
