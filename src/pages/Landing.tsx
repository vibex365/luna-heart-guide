import { motion } from "framer-motion";
import { Heart, MessageCircle, Shield, Sparkles, Brain, TrendingUp, Wind, BookOpen, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

const FAQItem = ({ question, answer, index }: { question: string; answer: string; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="bg-card rounded-2xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-primary/20 transition-colors"
      >
        <span className="font-semibold text-foreground pr-4 text-sm">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-4 text-muted-foreground leading-relaxed text-sm">{answer}</p>
      </motion.div>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Is Luna a replacement for a real therapist?",
      answer: "Luna is designed to be a supportive companion for emotional wellness, not a replacement for licensed mental health professionals. For serious mental health concerns, we always recommend consulting with a qualified therapist.",
    },
    {
      question: "How does Luna protect my privacy?",
      answer: "Your conversations with Luna are encrypted and stored securely. We never share your personal data with third parties, and you can delete your conversation history at any time.",
    },
    {
      question: "Can Luna help with relationship conflicts?",
      answer: "Yes! Luna specializes in helping you navigate relationship challenges. She can help you understand your feelings, identify communication patterns, and provide gentle scripts for difficult conversations.",
    },
    {
      question: "Is Luna available 24/7?",
      answer: "Absolutely. Luna is always here whenever you need support — whether it's 3pm or 3am. There's no scheduling, no waiting rooms, and no judgment.",
    },
  ];

  const features = [
    {
      icon: Heart,
      title: "Emotional Support",
      description: "Feel heard and validated with compassionate conversations.",
    },
    {
      icon: MessageCircle,
      title: "Communication Scripts",
      description: "Get gentle scripts to express your feelings clearly.",
    },
    {
      icon: Shield,
      title: "Safe Space",
      description: "Your conversations are private. Heal at your own pace.",
    },
    {
      icon: Sparkles,
      title: "Pattern Recognition",
      description: "Understand your relationship dynamics.",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Advanced AI that provides personalized guidance.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your emotional journey with analytics.",
    },
  ];

  const tools = [
    { icon: MessageCircle, title: "AI Chat", description: "24/7 support" },
    { icon: Heart, title: "Mood Tracker", description: "Log emotions" },
    { icon: BookOpen, title: "Journal", description: "Reflect & grow" },
    { icon: Wind, title: "Breathe", description: "Find calm" },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: ["5 messages/day", "Mood tracking", "Breathing exercises", "Journal"],
      popular: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/month",
      features: ["Unlimited chats", "Advanced analytics", "Priority AI", "Personalized insights", "Export data"],
      popular: true,
    },
  ];

  return (
    <MobileOnlyLayout hideTabBar>
      <div className="bg-background">
        {/* Hero Section */}
        <section className="pt-12 pb-10 px-6 gradient-hero safe-area-top">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <LunaAvatar size="xl" />
            </motion.div>

            <motion.h1
              className="font-heading text-3xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your AI Relationship Therapist
            </motion.h1>

            <motion.p
              className="text-base text-muted-foreground mb-8 max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Luna listens. Luna understands. Start healing your heart with compassionate, judgment-free guidance.
            </motion.p>

            <motion.div
              className="w-full space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button variant="peach" size="lg" className="w-full" onClick={() => navigate("/auth")}>
                Talk to Luna — It's Free
              </Button>
              <Button variant="luna" size="lg" className="w-full" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </motion.div>

            <motion.p
              className="text-xs text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              No credit card • 100% private • 24/7
            </motion.p>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="bg-card/50 py-6 border-y border-border">
          <motion.div
            className="grid grid-cols-4 gap-2 px-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <p className="font-heading text-xl font-bold text-accent">50K+</p>
              <p className="text-muted-foreground text-[10px]">Chats</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-accent">4.9</p>
              <p className="text-muted-foreground text-[10px]">Rating</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-accent">24/7</p>
              <p className="text-muted-foreground text-[10px]">Available</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-accent">100%</p>
              <p className="text-muted-foreground text-[10px]">Private</p>
            </div>
          </motion.div>
        </section>

        {/* Tools Grid */}
        <section className="py-10 px-6">
          <motion.h2
            className="font-heading text-xl font-bold text-foreground mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Your Wellness Toolkit
          </motion.h2>

          <div className="grid grid-cols-2 gap-3">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                className="bg-card rounded-2xl p-4 border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl gradient-luna flex items-center justify-center mb-3">
                  <tool.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{tool.title}</h3>
                <p className="text-muted-foreground text-xs">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-10 px-6 bg-muted/30">
          <motion.h2
            className="font-heading text-xl font-bold text-foreground mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How Luna Helps You Heal
          </motion.h2>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-xl p-4 border border-border flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-10 h-10 rounded-lg gradient-luna flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="py-10 px-6">
          <motion.h2
            className="font-heading text-xl font-bold text-foreground mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Simple Pricing
          </motion.h2>

          <div className="space-y-4">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`rounded-2xl p-5 border ${
                  plan.popular ? "bg-card border-accent shadow-luna" : "bg-card border-border"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && (
                  <span className="text-xs font-medium text-accent bg-primary px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "peach" : "outline"}
                  className="w-full mt-4"
                  onClick={() => navigate("/auth")}
                >
                  {plan.popular ? "Start Free Trial" : "Get Started"}
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 px-6 bg-muted/30">
          <motion.h2
            className="font-heading text-xl font-bold text-foreground mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Questions & Answers
          </motion.h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-6">
          <motion.div
            className="gradient-peach rounded-3xl p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <LunaAvatar size="lg" className="mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-foreground mb-3">
              Ready to Start Healing?
            </h2>
            <p className="text-foreground/80 text-sm mb-6">
              Luna is here, 24/7, ready to listen.
            </p>
            <Button variant="accent" size="lg" className="w-full" onClick={() => navigate("/auth")}>
              Talk to Luna Now
            </Button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <LunaAvatar size="xs" showGlow={false} />
            <span className="font-heading font-semibold text-foreground">LUNA</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Your private AI therapist. Always here, never judging.
          </p>
        </footer>
      </div>
    </MobileOnlyLayout>
  );
};

export default Landing;
