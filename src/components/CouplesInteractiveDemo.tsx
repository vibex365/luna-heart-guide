import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Gamepad2, Wine, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const demoGames = [
  {
    id: "this_or_that",
    title: "This or That",
    icon: "💕",
    optionA: "Beach vacation",
    optionB: "Mountain cabin",
  },
  {
    id: "truth_or_dare",
    title: "Truth or Dare",
    icon: "🎯",
    prompt: "What's the most romantic thing you'd do for your partner?",
  },
  {
    id: "drinking",
    title: "Couples Drinking",
    icon: "🍷",
    prompt: "Drink if you've ever forgotten an anniversary",
  },
];

export const CouplesInteractiveDemo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [demoState, setDemoState] = useState<"idle" | "selecting" | "result">("idle");
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);

  // Auto-rotate demos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
      setDemoState("idle");
      setSelectedOption(null);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play demo
  useEffect(() => {
    if (demoState === "idle") {
      const timer = setTimeout(() => setDemoState("selecting"), 1000);
      return () => clearTimeout(timer);
    }
    if (demoState === "selecting") {
      const timer = setTimeout(() => {
        setSelectedOption(Math.random() > 0.5 ? "A" : "B");
        setDemoState("result");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [demoState, activeTab]);

  return (
    <section id="couples-demo" className="py-24 bg-gradient-to-br from-pink-500/10 via-background to-rose-500/10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-pink-500 text-sm font-medium uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4" />
            Interactive Demo
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Try Couples Games
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fun relationship-building games designed to spark conversation and bring you closer together.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo tabs */}
          <div className="space-y-4">
            {["This or That", "Truth or Dare", "Drinking Game"].map((game, idx) => (
              <motion.button
                key={game}
                onClick={() => {
                  setActiveTab(idx);
                  setDemoState("idle");
                  setSelectedOption(null);
                }}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activeTab === idx
                    ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-2 border-pink-500/50"
                    : "bg-card border border-border hover:border-pink-500/30"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeTab === idx ? "bg-pink-500" : "bg-muted"
                  }`}>
                    <span className="text-xl">{demoGames[idx].icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{game}</h4>
                    <p className="text-sm text-muted-foreground">
                      {idx === 0 && "Choose between two options"}
                      {idx === 1 && "Answer truths or complete dares"}
                      {idx === 2 && "Fun couples drinking prompts"}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}

            <Button
              onClick={() => navigate("/couples-welcome")}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500"
              size="lg"
            >
              Try All Couples Features
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Demo preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-card rounded-3xl p-6 border border-border shadow-xl min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div
                    key="this-or-that"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <span className="text-4xl">💕</span>
                      <h3 className="text-xl font-bold mt-2">This or That?</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        animate={{
                          scale: selectedOption === "A" ? 1.05 : 1,
                          borderColor: selectedOption === "A" ? "rgb(236 72 153)" : "transparent",
                        }}
                        className="p-6 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border-2 text-center"
                      >
                        <span className="text-3xl mb-2 block">🏖️</span>
                        <p className="font-medium">Beach vacation</p>
                        {selectedOption === "A" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-2 text-pink-500 text-sm"
                          >
                            ✓ Selected
                          </motion.div>
                        )}
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: selectedOption === "B" ? 1.05 : 1,
                          borderColor: selectedOption === "B" ? "rgb(236 72 153)" : "transparent",
                        }}
                        className="p-6 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border-2 text-center"
                      >
                        <span className="text-3xl mb-2 block">🏔️</span>
                        <p className="font-medium">Mountain cabin</p>
                        {selectedOption === "B" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-2 text-pink-500 text-sm"
                          >
                            ✓ Selected
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                    {demoState === "result" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-4 rounded-xl bg-pink-500/10 border border-pink-500/20"
                      >
                        <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                        <p className="text-sm">You matched! 87% compatibility</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    key="truth-or-dare"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <span className="text-4xl">🎯</span>
                      <h3 className="text-xl font-bold mt-2">Truth or Dare</h3>
                    </div>
                    <motion.div
                      animate={{ rotateY: demoState === "result" ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      className="relative h-48"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="text-center text-white">
                          <Sparkles className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Tap to reveal</p>
                        </div>
                      </div>
                      <div
                        className="absolute inset-0 rounded-2xl bg-card border border-border p-6 flex items-center justify-center"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <p className="text-center font-medium">
                          "What's the most romantic thing you'd do for your partner?"
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    key="drinking"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <span className="text-4xl">🍷</span>
                      <h3 className="text-xl font-bold mt-2">Couples Drinking Game</h3>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 text-center">
                      <Wine className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">Drink if...</p>
                      <p className="text-muted-foreground mt-2">
                        You've ever forgotten an anniversary
                      </p>
                    </div>
                    {demoState === "result" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="p-3 rounded-lg bg-pink-500/10 text-center">
                          <p className="text-2xl font-bold text-pink-500">3</p>
                          <p className="text-xs text-muted-foreground">Your drinks</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                          <p className="text-2xl font-bold text-blue-500">2</p>
                          <p className="text-xs text-muted-foreground">Partner's drinks</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CouplesInteractiveDemo;
