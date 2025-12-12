import { motion } from "framer-motion";
import { Heart, MessageCircle, Shield, Sparkles, Brain, TrendingUp, Clock, Users, Check, Wind, BookOpen, BarChart3, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-primary/20 transition-colors"
      >
        <span className="font-semibold text-foreground pr-4">{question}</span>
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
        <p className="px-6 pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Pricing", href: "#pricing" },
  ];

  const faqs = [
    {
      question: "Is Luna a replacement for a real therapist?",
      answer: "Luna is designed to be a supportive companion for emotional wellness, not a replacement for licensed mental health professionals. For serious mental health concerns, we always recommend consulting with a qualified therapist. Luna is great for daily emotional support, practicing communication skills, and tracking your mood patterns between professional sessions.",
    },
    {
      question: "How does Luna protect my privacy?",
      answer: "Your conversations with Luna are encrypted and stored securely. We never share your personal data with third parties, and you can delete your conversation history at any time. Luna doesn't remember conversations between sessions unless you choose to save them.",
    },
    {
      question: "Can Luna help with relationship conflicts?",
      answer: "Yes! Luna specializes in helping you navigate relationship challenges. She can help you understand your feelings, identify communication patterns, and even provide gentle scripts for difficult conversations. Many users find Luna helpful for preparing what they want to say to their partner.",
    },
    {
      question: "Is Luna available 24/7?",
      answer: "Absolutely. Luna is always here whenever you need support — whether it's 3pm or 3am. There's no scheduling, no waiting rooms, and no judgment. Just open the app and start talking.",
    },
    {
      question: "What if I'm in a crisis situation?",
      answer: "If you're experiencing a mental health emergency, please reach out to professional crisis services immediately. Luna provides a dedicated Crisis Resources page with hotlines and support services. For immediate help, contact the 988 Suicide & Crisis Lifeline (call or text 988) in the US.",
    },
    {
      question: "How is Luna different from other AI chatbots?",
      answer: "Luna is specifically trained for emotional intelligence and relationship support. Unlike general-purpose AI assistants, Luna understands attachment styles, relationship dynamics, and therapeutic communication techniques. She's designed to make you feel heard and validated, not just provide information.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no questions asked. Your access will continue until the end of your billing period, and you can always come back to the free plan.",
    },
  ];

  const features = [
    {
      icon: Heart,
      title: "Emotional Support",
      description: "Feel heard and validated with compassionate, judgment-free conversations.",
    },
    {
      icon: MessageCircle,
      title: "Communication Scripts",
      description: "Get gentle scripts to express your feelings clearly and kindly.",
    },
    {
      icon: Shield,
      title: "Safe Space",
      description: "Your conversations are private. Heal at your own pace.",
    },
    {
      icon: Sparkles,
      title: "Pattern Recognition",
      description: "Understand your relationship dynamics and attachment styles.",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Advanced AI that learns your needs and provides personalized guidance.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your emotional journey with mood tracking and analytics.",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Start a Conversation",
      description: "Share what's on your heart — Luna listens without judgment.",
      icon: MessageCircle,
    },
    {
      step: "02",
      title: "Get Personalized Support",
      description: "Receive empathetic guidance tailored to your unique situation.",
      icon: Heart,
    },
    {
      step: "03",
      title: "Track Your Journey",
      description: "Log your moods, journal your thoughts, and see your progress.",
      icon: BarChart3,
    },
    {
      step: "04",
      title: "Heal & Grow",
      description: "Build healthier patterns and find peace in your relationships.",
      icon: Sparkles,
    },
  ];

  const testimonials = [
    {
      quote: "Luna helped me find the words I couldn't say to my partner. Our communication has completely transformed.",
      author: "Sarah M.",
      role: "Together 5 years",
    },
    {
      quote: "Having someone to talk to at 2am when anxiety hits — that's priceless. Luna feels like a friend who truly gets it.",
      author: "James K.",
      role: "Healing from breakup",
    },
    {
      quote: "The breathing exercises and mood tracking have become part of my daily routine. I feel more centered than ever.",
      author: "Emily R.",
      role: "Self-growth journey",
    },
  ];

  const tools = [
    { icon: MessageCircle, title: "AI Chat Therapy", description: "24/7 compassionate conversations" },
    { icon: Heart, title: "Mood Tracker", description: "Log and visualize your emotions" },
    { icon: BookOpen, title: "Journal", description: "Private space for reflection" },
    { icon: Wind, title: "Breathing Exercises", description: "Guided relaxation techniques" },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start your healing journey",
      features: [
        "5 messages per day",
        "Basic mood tracking",
        "Breathing exercises",
        "Journal entries",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "Unlimited emotional support",
      features: [
        "Unlimited conversations",
        "Advanced mood analytics",
        "Priority AI responses",
        "Personalized insights",
        "Export your data",
        "Ambient sound library",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Couples",
      price: "$19",
      period: "per month",
      description: "Heal together",
      features: [
        "Everything in Pro",
        "2 user accounts",
        "Shared progress tracking",
        "Couples communication tools",
        "Conflict resolution scripts",
        "Relationship health score",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
  ];

  const scrollToSection = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
            </motion.div>

            <motion.div
              className="hidden md:flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="peach" size="sm" onClick={() => navigate("/auth")}>
                Start Free
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden pt-4 pb-2 border-t border-border mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button variant="peach" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    Start Free
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Section 1: Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 gradient-hero">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8"
            >
              <LunaAvatar size="xl" />
            </motion.div>

            <motion.h1
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your AI Relationship Therapist
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Luna listens. Luna understands. Start healing your heart with compassionate, 
              judgment-free guidance whenever you need it.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button variant="peach" size="xl" onClick={() => navigate("/auth")}>
                Talk to Luna — It's Free
              </Button>
              <Button variant="luna" size="xl" onClick={() => scrollToSection("#how-it-works")}>
                See How It Works
              </Button>
            </motion.div>

            <motion.p
              className="text-sm text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              No credit card required • 100% private • Available 24/7
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 2: Trust Banner / Stats */}
      <section className="bg-card/50 backdrop-blur-sm py-12 border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-accent">50K+</p>
              <p className="text-muted-foreground text-sm">Conversations</p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-accent">4.9</p>
              <p className="text-muted-foreground text-sm">User Rating</p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-accent">24/7</p>
              <p className="text-muted-foreground text-sm">Always Available</p>
            </div>
            <div>
              <p className="font-heading text-3xl md:text-4xl font-bold text-accent">100%</p>
              <p className="text-muted-foreground text-sm">Private & Secure</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Features */}
      <section id="features" className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Luna Helps You Heal
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              More than just a chatbot — Luna is your emotional companion through life's hardest moments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-luna transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl gradient-luna flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Healing Journey Starts Here
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Four simple steps to emotional wellness and healthier relationships.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="w-16 h-16 rounded-full gradient-peach flex items-center justify-center mx-auto mb-4 shadow-button">
                  <item.icon className="w-7 h-7 text-foreground" />
                </div>
                <span className="text-accent font-heading font-bold text-sm">{item.step}</span>
                <h3 className="font-heading font-semibold text-lg text-foreground mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Tools */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Heal
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete toolkit for your emotional wellness journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                className="bg-card rounded-2xl p-8 text-center border border-border hover:border-accent/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                  <tool.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{tool.title}</h3>
                <p className="text-muted-foreground text-sm">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stories of Healing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Real people finding peace with Luna's support.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                className="bg-card rounded-2xl p-8 border border-border shadow-soft"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <p className="text-foreground italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-accent font-semibold">{testimonial.author[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section id="faq" className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to know about Luna.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Pricing */}
      <section id="pricing" className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free and upgrade when you're ready for more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.popular 
                    ? "bg-card border-accent shadow-luna scale-105" 
                    : "bg-card border-border shadow-soft"
                } relative`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "peach" : "luna"}
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            className="gradient-peach rounded-3xl p-10 md:p-16 text-center shadow-luna"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              You're Not Alone in This
            </h2>
            <p className="text-foreground/80 text-lg mb-8 max-w-lg mx-auto">
              Whether you're hurting, confused, or just need someone to listen — Luna is here for you, 24/7.
            </p>
            <Button variant="accent" size="xl" onClick={() => navigate("/auth")}>
              Start Your Journey Today
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LunaAvatar size="sm" showGlow={false} />
                <span className="font-heading font-bold text-foreground">LUNA</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your private AI relationship therapist. Always here, never judging.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection("#features")} className="hover:text-foreground transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection("#pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection("#testimonials")} className="hover:text-foreground transition-colors">Testimonials</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/crisis")} className="hover:text-foreground transition-colors">Crisis Resources</button></li>
                <li><button onClick={() => navigate("/breathe")} className="hover:text-foreground transition-colors">Breathing Exercises</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span></li>
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Luna. Made with 💜 for those healing their hearts.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
