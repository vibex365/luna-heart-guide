import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Heart, MessageCircle, Wind, BookOpen, Users, Sparkles, Shield, Star, ArrowRight, Check, 
  Rocket, Crown, Quote, Brain, HeartHandshake, Zap, Newspaper, Phone, Play, X, Clock, 
  AlertCircle, TrendingUp, Lock, Gift, Smile, ThumbsUp, ChevronDown, DollarSign, 
  Calendar, Target, Award, Lightbulb, MessageSquare, Volume2, HelpCircle, Mic, Video,
  Palette, ChefHat, Gamepad2, Shuffle, CircleDot, Flame, MessagesSquare, Dices
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LunaAvatar from "./LunaAvatar";
import SocialLinks from "./SocialLinks";
import CouplesInteractiveDemo from "./CouplesInteractiveDemo";
import InteractiveDemo from "./InteractiveDemo";
import DemoVideoDialog from "./DemoVideoDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import landing page images
import heroCouple from "@/assets/landing/hero-couple.jpg";
import journalingMoment from "@/assets/landing/journaling-moment.jpg";
import couplesPlaying from "@/assets/landing/couples-playing.jpg";
import breathingCalm from "@/assets/landing/breathing-calm.jpg";
import couplesEmbrace from "@/assets/landing/couples-embrace.jpg";

// Pain points that resonate
const painPoints = [
  {
    icon: AlertCircle,
    title: "Feeling Unheard?",
    description: "Your partner doesn't seem to understand you, and you're tired of the same arguments.",
  },
  {
    icon: Clock,
    title: "No Time for Therapy?",
    description: "Traditional therapy is expensive, inconvenient, and has long wait times.",
  },
  {
    icon: Lock,
    title: "Afraid to Open Up?",
    description: "You want to process emotions but don't feel safe talking to anyone about it.",
  },
  {
    icon: TrendingUp,
    title: "Relationship Drifting?",
    description: "You love your partner but feel disconnected and don't know how to reconnect.",
  },
];

// Features with benefits
const features = [{
  icon: Phone,
  title: "24/7 Voice Therapy",
  description: "Real-time voice conversations with Luna. Get immediate support whenever you need someone to talk to — day or night.",
  benefit: "Never wait for an appointment again",
  gradient: "from-emerald-500/30 to-accent/20"
}, {
  icon: MessageCircle,
  title: "AI-Powered Conversations",
  description: "Get personalized guidance and communication scripts to navigate difficult conversations with loved ones.",
  benefit: "Finally express yourself clearly",
  gradient: "from-primary/30 to-secondary/20"
}, {
  icon: Sparkles,
  title: "Mood Tracking",
  description: "Log your emotions daily and discover patterns in your emotional journey over time.",
  benefit: "Understand your triggers",
  gradient: "from-secondary/30 to-accent/20"
}, {
  icon: Wind,
  title: "Breathing Exercises",
  description: "Access calming breathing techniques whenever you need to center yourself and find peace.",
  benefit: "Instant calm in 60 seconds",
  gradient: "from-accent/20 to-primary/30"
}, {
  icon: BookOpen,
  title: "Guided Journaling",
  description: "Write freely with thoughtful prompts that help you reflect, process, and grow.",
  benefit: "Process emotions safely",
  gradient: "from-peach/30 to-secondary/20"
}, {
  icon: Users,
  title: "Couples Mode",
  description: "Date nights with coloring books & romantic recipes, relationship games, digital gifts, and private chat.",
  benefit: "Rekindle your connection",
  gradient: "from-primary/40 to-accent/30"
}];

// Competitor comparison
const comparisonData = {
  features: [
    { name: "24/7 Availability", luna: true, therapy: false, apps: "limited" },
    { name: "Voice Conversations", luna: true, therapy: true, apps: false },
    { name: "No Wait Times", luna: true, therapy: false, apps: true },
    { name: "Couples Features", luna: true, therapy: "extra cost", apps: "rare" },
    { name: "Mood Tracking", luna: true, therapy: false, apps: true },
    { name: "Communication Scripts", luna: true, therapy: "varies", apps: false },
    { name: "Relationship Games", luna: true, therapy: false, apps: "limited" },
    { name: "Private & Encrypted", luna: true, therapy: true, apps: "varies" },
    { name: "Start Cost", luna: "Free", therapy: "$150+/session", apps: "$10+/mo" },
  ],
};

// Testimonials with more detail
const testimonials = [{
  quote: "Luna helped me understand my anxiety patterns and gave me tools to cope. It's like having a therapist in my pocket.",
  author: "Sarah M.",
  role: "Managing anxiety for 2 years",
  avatar: "SM",
  rating: 5,
}, {
  quote: "The couples mode saved our relationship. We communicate so much better now and actually enjoy date nights again.",
  author: "Michael & Jessica",
  role: "Together for 5 years",
  avatar: "MJ",
  rating: 5,
}, {
  quote: "I never knew journaling could be this easy. Luna's prompts help me dig deeper into my feelings.",
  author: "David K.",
  role: "Daily user for 6 months",
  avatar: "DK",
  rating: 5,
}, {
  quote: "As someone who couldn't afford therapy, Luna has been life-changing. It's always there when I need to talk.",
  author: "Amanda R.",
  role: "Overcoming depression",
  avatar: "AR",
  rating: 5,
}, {
  quote: "The voice feature feels so natural. It's like talking to a friend who actually listens and gives good advice.",
  author: "James T.",
  role: "Processing grief",
  avatar: "JT",
  rating: 5,
}, {
  quote: "My partner and I use the relationship games weekly. It's brought so much laughter and connection back to us.",
  author: "Lisa & Mark",
  role: "Married 8 years",
  avatar: "LM",
  rating: 5,
}];

// Pricing plans
const pricingPlans = [{
  name: "Free",
  price: "$0",
  period: "forever",
  features: ["5 messages per day", "Basic mood tracking", "Breathing exercises", "Limited journal prompts"],
  highlight: false,
  popular: false
}, {
  name: "Pro",
  price: "$4.99",
  period: "/month",
  features: ["Unlimited conversations", "Advanced mood analytics", "Priority AI responses", "All journal templates", "Weekly insights", "Voice sessions"],
  highlight: true,
  popular: true,
  savings: "Less than a coffee per week"
}, {
  name: "Couples",
  price: "$9.99",
  period: "/month",
  features: ["Everything in Pro", "Partner connection", "Date night activities", "Romantic recipes", "Relationship games", "Digital gifts", "Shared mood tracking"],
  highlight: false,
  popular: false,
  savings: "One date night covers a month"
}];

// Stats
const stats = [{
  value: "50K+",
  label: "Active Users"
}, {
  value: "1M+",
  label: "Conversations"
}, {
  value: "4.9★",
  label: "App Rating"
}, {
  value: "24/7",
  label: "Always Available"
}];

// FAQs
const faqs = [
  {
    question: "Is Luna a replacement for therapy?",
    answer: "Luna is designed to complement your mental health journey, not replace professional therapy. It's perfect for daily emotional support, building healthy habits, and practicing communication skills. For serious mental health concerns, we always recommend working with a licensed professional.",
  },
  {
    question: "How private is my data?",
    answer: "Your privacy is our top priority. All conversations are encrypted end-to-end. We never sell your data, and you can delete your account and all associated data at any time. Your emotional journey is yours alone.",
  },
  {
    question: "Can I use Luna with my partner?",
    answer: "Absolutely! Our Couples Mode is designed specifically for partners who want to strengthen their relationship. You can chat privately, play relationship games, send digital gifts, track moods together, and enjoy date night activities.",
  },
  {
    question: "What if I'm in crisis?",
    answer: "If you're experiencing a mental health crisis, please reach out to a crisis helpline immediately. We provide direct links to crisis resources within the app. Luna can offer comfort, but trained crisis counselors are equipped for emergencies.",
  },
  {
    question: "How accurate is the AI?",
    answer: "Luna uses advanced AI trained on therapeutic techniques including CBT, DBT, and mindfulness practices. While no AI is perfect, Luna continuously learns and adapts to provide more relevant, helpful responses over time.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! There are no long-term contracts. You can cancel your subscription anytime, and you'll continue to have access until the end of your billing period. We believe you should stay because you love Luna, not because you're locked in.",
  },
];

// How it works steps
const howItWorks = [
  {
    step: "01",
    icon: Heart,
    title: "Share Your Feelings",
    description: "Start a conversation with Luna about anything on your mind. No judgment, just understanding.",
    image: journalingMoment
  },
  {
    step: "02",
    icon: Brain,
    title: "Gain Insights",
    description: "Luna helps you understand patterns in your emotions and provides personalized guidance.",
    image: breathingCalm
  },
  {
    step: "03",
    icon: Zap,
    title: "Take Action",
    description: "Use tools like breathing exercises, journaling, and communication scripts to grow.",
    image: couplesEmbrace
  }
];

// Benefits list
const benefits = [
  { icon: Clock, text: "Available 24/7 — no appointments needed" },
  { icon: DollarSign, text: "Fraction of the cost of traditional therapy" },
  { icon: Lock, text: "100% private and encrypted" },
  { icon: Heart, text: "Judgment-free, always supportive" },
  { icon: Users, text: "Includes couples relationship tools" },
  { icon: Volume2, text: "Voice conversations feel natural" },
];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  category: string;
  read_time_minutes: number | null;
  published_at: string | null;
}

const DesktopLanding = () => {
  const navigate = useNavigate();
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  
  useEffect(() => {
    const fetchBlogPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, category, read_time_minutes, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (data) setBlogPosts(data);
    };
    
    fetchBlogPosts();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ========== SECTION 1: Hero with Video ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero background image with overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroCouple} 
            alt="Loving couple at sunset" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>
        
        {/* Animated romantic accents */}
        <div className="absolute inset-0 romantic-glow opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-peach/25 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Navigation */}
        <header className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-2xl text-foreground">LUNA</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#pain-points" className="text-muted-foreground hover:text-foreground transition-colors">Why Luna</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#comparison" className="text-muted-foreground hover:text-foreground transition-colors">Compare</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Stories</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="peach" onClick={() => navigate("/auth")}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.5 }} 
                className="mb-6 inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-accent/30 shadow-soft"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Your 24/7 AI Companion for Emotional Wellness</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2, duration: 0.6 }} 
                className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
              >
                Finally Feel
                <br />
                <span className="bg-gradient-to-r from-accent via-peach to-accent bg-clip-text text-transparent">Understood.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3, duration: 0.6 }} 
                className="text-xl text-muted-foreground max-w-xl mb-8"
              >
                Stop bottling up emotions. Luna is your judgment-free AI companion that listens, 
                understands, and helps you heal — anytime, anywhere.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4, duration: 0.6 }} 
                className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              >
                <Button 
                  size="lg" 
                  variant="peach" 
                  className="text-lg px-8 py-6 shadow-button" 
                  onClick={() => navigate("/auth")}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Healing — It's Free
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex items-center gap-6 text-muted-foreground text-sm"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>100% Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" />
                  <span>4.9★ Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span>50K+ Users</span>
                </div>
              </motion.div>
            </div>

            {/* Right - Video Player */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-luna border-2 border-accent/20 bg-card/50 backdrop-blur-sm">
                {/* Video placeholder - Replace with actual video */}
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  onClick={() => setShowVideoModal(true)}
                >
                  <img 
                    src={couplesEmbrace} 
                    alt="Watch how Luna works" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                  
                  {/* Play button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:bg-accent transition-colors"
                    >
                      <Play className="w-8 h-8 text-accent-foreground ml-1" />
                    </motion.div>
                    <p className="mt-4 text-foreground font-medium">Watch the 60-Second Demo</p>
                    <p className="text-sm text-muted-foreground">See how Luna can help you</p>
                  </div>
                </div>
              </div>
              
              {/* Floating testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-card/95 backdrop-blur-sm p-4 rounded-xl border border-accent/20 shadow-soft max-w-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    SM
                  </div>
                  <div>
                    <p className="text-sm text-foreground italic">"Luna helped me when I had no one else to turn to."</p>
                    <p className="text-xs text-muted-foreground mt-1">— Sarah M.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.2 }} 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ duration: 1.5, repeat: Infinity }} 
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Discover more</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-4xl"
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video bg-card rounded-2xl border border-accent/20 flex items-center justify-center">
              {/* Replace this with your actual video embed */}
              <div className="text-center p-8">
                <Play className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Your Sales Video Here</h3>
                <p className="text-muted-foreground">
                  Upload your video and replace this placeholder with an embed code
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Tip: Host on YouTube or Vimeo and embed the iframe
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== SECTION 2: Stats Bar ========== */}
      <section className="py-12 gradient-warmth border-y border-accent/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: index * 0.1 }} 
                className="text-center"
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-accent to-peach bg-clip-text text-transparent mb-1">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: Pain Points ========== */}
      <section id="pain-points" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Sound Familiar?</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              You're not alone in feeling this way
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Millions of people struggle with these same challenges every day. Luna was built to help.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/50 backdrop-blur-sm border border-destructive/20 rounded-2xl p-6 hover:border-destructive/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{point.title}</h3>
                  <p className="text-muted-foreground">{point.description}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-6 py-3">
              <Lightbulb className="w-5 h-5 text-accent" />
              <span className="text-foreground font-medium">There's a better way — and it's accessible to everyone.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 4: Solution Intro ========== */}
      <section className="py-24 bg-gradient-to-br from-accent/10 via-primary/15 to-peach/20 relative overflow-hidden">
        <div className="absolute inset-0 romantic-glow opacity-30" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <LunaAvatar size="lg" showGlow />
                <div>
                  <h3 className="font-heading text-2xl font-bold text-foreground">Meet Luna</h3>
                  <p className="text-muted-foreground">Your AI Wellness Companion</p>
                </div>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
                Imagine having a <span className="text-accent">supportive friend</span> who's always there
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Luna combines the warmth of a caring friend with the wisdom of therapeutic techniques. 
                No judgment. No waiting. No expensive bills. Just genuine support when you need it most.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.li
                      key={benefit.text}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-foreground">{benefit.text}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-luna border border-accent/20">
                <img 
                  src={journalingMoment} 
                  alt="Person journaling peacefully" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: Features Grid ========== */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Features</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Everything you need to heal
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From daily mood tracking to couples therapy games, Luna provides comprehensive tools for your emotional wellness journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={feature.title} 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.1 }} 
                  className="group p-6 rounded-2xl bg-card border border-accent/10 hover:border-accent/40 hover:shadow-romantic transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-peach/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-soft`}>
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-2 text-accent text-sm font-medium">
                    <Check className="w-4 h-4" />
                    <span>{feature.benefit}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== SECTION 6: Interactive Demo ========== */}
      <InteractiveDemo />

      {/* ========== SECTION 7: How It Works ========== */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">How It Works</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Your healing journey in 3 simple steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  key={item.step} 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.2 }} 
                  className="relative text-center"
                >
                  {/* Step image */}
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-accent/30 shadow-romantic">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-accent/30 to-transparent" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full gradient-romantic shadow-soft">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="absolute top-0 right-1/4 text-6xl font-bold bg-gradient-to-b from-accent/20 to-transparent bg-clip-text text-transparent">
                    {item.step}
                  </span>
                  <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== SECTION 8: Comparison Table ========== */}
      <section id="comparison" className="py-24 bg-gradient-to-br from-muted/30 via-background to-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Compare</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              See how Luna stacks up
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Traditional therapy is valuable but not always accessible. Luna fills the gap.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-accent/20 overflow-hidden shadow-soft"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-foreground font-medium">Feature</th>
                    <th className="text-center p-4">
                      <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full">
                        <LunaAvatar size="sm" showGlow={false} />
                        <span className="font-bold text-accent">Luna</span>
                      </div>
                    </th>
                    <th className="text-center p-4 text-muted-foreground">Traditional Therapy</th>
                    <th className="text-center p-4 text-muted-foreground">Other Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.features.map((row, index) => (
                    <tr key={row.name} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="p-4 text-foreground font-medium">{row.name}</td>
                      <td className="p-4 text-center">
                        {row.luna === true ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/20">
                            <Check className="w-5 h-5 text-accent" />
                          </div>
                        ) : typeof row.luna === "string" ? (
                          <span className="text-accent font-bold">{row.luna}</span>
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.therapy === true ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : row.therapy === false ? (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-sm">{row.therapy}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.apps === true ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : row.apps === false ? (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-sm">{row.apps}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Luna isn't meant to replace therapy — it's here to support you between sessions or when therapy isn't an option.
            </p>
            <Button variant="peach" size="lg" onClick={() => navigate("/auth")}>
              Try Luna Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 9: Couples Mode Highlight ========== */}
      <section className="py-24 bg-gradient-to-br from-accent/15 via-primary/20 to-peach/25 overflow-hidden relative">
        <div className="absolute inset-0 romantic-glow opacity-50" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 text-accent text-sm font-medium uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                For Couples
              </span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-6">
                Strengthen your bond together
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Couples Mode offers a private space for you and your partner to communicate better, 
                play relationship-building games, track shared moods, and celebrate milestones together.
              </p>
              <ul className="space-y-4 mb-8">
                {["Send digital gifts with animations", "Private encrypted messaging", "Daily journal prompts together", "Fun relationship quizzes & games", "Earn & spend coins on gifts", "Milestone & anniversary reminders"].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="peach" size="lg" onClick={() => navigate("/couples-welcome")}>
                Try Couples Mode
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }} 
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-3xl overflow-hidden shadow-luna">
                  <img 
                    src={couplesPlaying} 
                    alt="Happy couple playing together" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-sm rounded-2xl p-5 border border-accent/20 shadow-romantic">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Partner Connected</p>
                        <p className="text-xs text-muted-foreground">Relationship Health: 92%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Streak</p>
                        <p className="font-medium text-foreground text-sm">🔥 14 days</p>
                      </div>
                      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                        <p className="text-xs text-accent">Milestone</p>
                        <p className="font-medium text-foreground text-sm">3 days!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 10: Couples Games Showcase ========== */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Games & Activities</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              50+ fun games to play together
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From deep conversations to playful challenges — strengthen your bond while having fun
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shuffle,
                title: "Would You Rather",
                description: "Discover how aligned you are with playful dilemmas and fun scenarios",
                gradient: "from-purple-500/20 to-pink-500/20",
                iconColor: "text-purple-400"
              },
              {
                icon: CircleDot,
                title: "Truth or Dare",
                description: "Spice things up with truths that reveal and dares that excite",
                gradient: "from-red-500/20 to-orange-500/20",
                iconColor: "text-red-400"
              },
              {
                icon: Flame,
                title: "Never Have I Ever",
                description: "Learn surprising things about each other with revealing confessions",
                gradient: "from-orange-500/20 to-yellow-500/20",
                iconColor: "text-orange-400"
              },
              {
                icon: Dices,
                title: "Spin the Wheel",
                description: "Let fate decide your next romantic activity or playful challenge",
                gradient: "from-blue-500/20 to-cyan-500/20",
                iconColor: "text-blue-400"
              },
              {
                icon: MessagesSquare,
                title: "36 Questions to Fall in Love",
                description: "The scientifically-proven questions that create deep connection",
                gradient: "from-pink-500/20 to-rose-500/20",
                iconColor: "text-pink-400"
              },
              {
                icon: Gamepad2,
                title: "The Newlywed Game",
                description: "Test how well you really know your partner with fun challenges",
                gradient: "from-green-500/20 to-emerald-500/20",
                iconColor: "text-green-400"
              },
            ].map((game, index) => {
              const Icon = game.icon;
              return (
                <motion.div 
                  key={game.title} 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: index * 0.1 }} 
                  className={`group p-6 rounded-2xl bg-gradient-to-br ${game.gradient} border border-accent/10 hover:border-accent/40 hover:shadow-romantic transition-all duration-300`}
                >
                  <div className="w-14 h-14 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-soft">
                    <Icon className={`w-7 h-7 ${game.iconColor}`} />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    {game.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {game.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-6 py-3">
              <Gamepad2 className="w-5 h-5 text-accent" />
              <span className="text-foreground font-medium">Plus 40+ more games including Hot or Cold, Most Likely To, and more!</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 11: Voice Features ========== */}
      <section className="py-24 bg-gradient-to-br from-emerald-500/10 via-accent/10 to-teal-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Voice Sessions</span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-6">
                Talk it out with <span className="text-accent">real voice</span> conversations
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Sometimes typing isn't enough. Luna's voice feature lets you talk naturally, 
                just like you would with a trusted friend — day or night.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Private Voice Sessions</h3>
                    <p className="text-muted-foreground">Talk to Luna about anything — relationships, stress, personal growth. She listens and responds with empathy.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Couples Voice Calls</h3>
                    <p className="text-muted-foreground">Get Luna's guidance together on relationship topics. Perfect for working through challenges as a team.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Voice Messages in Chat</h3>
                    <p className="text-muted-foreground">Send voice notes to your partner in the couples chat — when words aren't enough, let them hear your voice.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-accent/20 shadow-luna p-8">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <LunaAvatar size="lg" showGlow />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-card">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground">Voice Session Active</h3>
                  <p className="text-muted-foreground text-sm">Luna is listening...</p>
                </div>
                
                {/* Simulated audio waveform */}
                <div className="flex items-center justify-center gap-1 h-16 mb-6">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-accent rounded-full"
                      animate={{
                        height: [8, Math.random() * 40 + 16, 8],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center cursor-pointer hover:bg-destructive/80 transition-colors">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                <p className="text-center text-sm text-muted-foreground mt-4">5:23 • Private Session</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 12: Chat Features ========== */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              {/* Chat mockup */}
              <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-accent/20 shadow-luna p-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Alex</p>
                      <p className="text-xs text-emerald-400">Online now</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Video className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 max-h-80 overflow-hidden">
                  <div className="flex justify-end">
                    <div className="bg-accent text-accent-foreground px-4 py-2 rounded-2xl rounded-tr-sm max-w-[70%]">
                      <p className="text-sm">Can't wait for our date night tonight! 💕</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-sm max-w-[70%]">
                      <p className="text-sm text-foreground">Me too! I found a great recipe we should try 🍝</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-accent/80 text-accent-foreground px-4 py-2 rounded-2xl rounded-tr-sm max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        <div className="flex gap-0.5">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-1 bg-accent-foreground/70 rounded-full" style={{ height: `${8 + Math.random() * 12}px` }} />
                          ))}
                        </div>
                        <span className="text-xs">0:08</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-sm">
                      <p className="text-sm text-foreground">❤️ Love you!</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-peach/20 px-3 py-1.5 rounded-full border border-peach/30">
                      <p className="text-xs text-foreground flex items-center gap-1">
                        <Gift className="w-3 h-3 text-peach" />
                        Alex sent you a 🌹 Rose
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Stay Connected</span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-6">
                Private & couples <span className="text-accent">chat</span> that brings you closer
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Stay connected with your partner through our beautiful, private messaging — 
                complete with voice notes, digital gifts, stickers, and more.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MessageCircle, label: "Private Chat with Luna", desc: "Your AI companion" },
                  { icon: Users, label: "Couples Private Chat", desc: "Just you two" },
                  { icon: Mic, label: "Voice Messages", desc: "Say it with feeling" },
                  { icon: Gift, label: "Digital Gifts", desc: "Roses, chocolates & more" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card/50 border border-accent/10 rounded-xl p-4 hover:border-accent/30 transition-all"
                    >
                      <Icon className="w-6 h-6 text-accent mb-2" />
                      <p className="font-semibold text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 13: Date Night Activities ========== */}
      <section className="py-24 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-orange-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Date Night</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Make every night a <span className="text-accent">date night</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Creative activities designed to help you reconnect, unwind, and create memories together
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Coloring Together */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card/80 backdrop-blur-sm rounded-3xl border border-accent/20 overflow-hidden shadow-luna"
            >
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                  <Palette className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                  Coloring Together
                </h3>
                <p className="text-muted-foreground mb-6">
                  Relaxing coloring pages designed for couples. Unwind together, express your creativity, 
                  and enjoy a peaceful activity that doesn't require conversation — just presence.
                </p>
                <ul className="space-y-2">
                  {["Romantic themed pages", "Mandala patterns", "Nature scenes", "Custom creations"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="h-40 bg-gradient-to-t from-purple-500/20 via-pink-500/10 to-transparent flex items-end justify-center pb-4">
                <div className="flex gap-2">
                  {['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'].map((color) => (
                    <div 
                      key={color} 
                      className="w-8 h-8 rounded-full shadow-lg border-2 border-white/20" 
                      style={{ backgroundColor: color }} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Romantic Recipes */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card/80 backdrop-blur-sm rounded-3xl border border-accent/20 overflow-hidden shadow-luna"
            >
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-6">
                  <ChefHat className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                  Romantic Recipes
                </h3>
                <p className="text-muted-foreground mb-6">
                  Cook a special dinner together with our curated collection of romantic recipes. 
                  From easy appetizers to impressive desserts — make dinner an experience.
                </p>
                <ul className="space-y-2">
                  {["Step-by-step instructions", "Difficulty ratings", "Wine pairings", "Mood-setting tips"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="h-40 bg-gradient-to-t from-orange-500/20 via-red-500/10 to-transparent flex items-end justify-center pb-4">
                <div className="flex gap-3 text-3xl">
                  🍝 🥂 🍰 🕯️ 🌹
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-12 text-center"
          >
            <Button 
              size="lg" 
              variant="peach" 
              className="shadow-button"
              onClick={() => navigate("/auth")}
            >
              <Heart className="w-5 h-5 mr-2" />
              Start Your Date Night
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 14: Couples Interactive Demo ========== */}
      <section id="couples-demo">
        <CouplesInteractiveDemo />
      </section>

      {/* ========== SECTION 11: Testimonials ========== */}
      <section id="testimonials" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Testimonials</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Real stories from real people
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands who've found clarity, connection, and peace with Luna.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.author} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: index * 0.1 }} 
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-luna transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 12: Pricing ========== */}
      <section id="pricing" className="py-24 gradient-soft relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Pricing</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Invest in your wellbeing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={plan.name} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: index * 0.1 }} 
                className={`relative rounded-2xl p-6 ${plan.highlight ? "gradient-romantic text-accent-foreground scale-105 shadow-romantic border border-accent/30" : "bg-card border border-accent/10 hover:border-accent/30 hover:shadow-soft transition-all"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-peach text-peach-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlight ? "opacity-80" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                {plan.savings && (
                  <p className={`text-sm mb-4 ${plan.highlight ? "opacity-80" : "text-muted-foreground"}`}>
                    {plan.savings}
                  </p>
                )}
                <ul className="space-y-3 mb-6">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${plan.highlight ? "" : "text-accent"}`} />
                      <span className={`text-sm ${plan.highlight ? "" : "text-muted-foreground"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.highlight ? "secondary" : "outline"} 
                  className="w-full" 
                  onClick={() => navigate("/auth")}
                >
                  {plan.name === "Free" ? "Get Started Free" : "Upgrade Now"}
                </Button>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>30-day money back</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 13: FAQ ========== */}
      <section id="faq" className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">FAQ</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Got questions?
            </h2>
            <p className="text-muted-foreground text-lg">
              Here are answers to the most common questions about Luna.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-accent/10 rounded-xl px-6 data-[state=open]:border-accent/30"
                >
                  <AccordionTrigger className="text-foreground font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Button variant="outline" onClick={() => navigate("/resources")}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Visit Help Center
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========== SECTION 14: Blog ========== */}
      <section id="blog" className="py-24 bg-muted/30 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Blog</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Relationship Insights & Advice
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Expert guidance on building healthier relationships and emotional wellness
            </p>
          </motion.div>

          {blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {blogPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-accent/10 overflow-hidden hover:border-accent/30 hover:shadow-soft transition-all cursor-pointer group"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                      {post.read_time_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {post.read_time_minutes} min read
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-accent text-sm font-medium">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-accent/10 p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Newspaper className="w-5 h-5 text-accent" />
                    <span className="text-xs font-medium text-muted-foreground">Coming Soon</span>
                  </div>
                  <div className="h-4 w-3/4 bg-muted/50 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted/30 rounded mb-4" />
                  <div className="h-3 w-full bg-muted/20 rounded mb-2" />
                  <div className="h-3 w-4/5 bg-muted/20 rounded" />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-accent/30 hover:border-accent hover:bg-accent/5"
              onClick={() => navigate("/blog")}
            >
              <Newspaper className="w-4 h-4 mr-2" />
              View All Articles
            </Button>
          </div>
        </div>
      </section>

      {/* ========== SECTION 15: Final CTA ========== */}
      <section className="py-24 bg-gradient-to-br from-accent/20 via-primary/25 to-peach/30 relative overflow-hidden">
        <div className="absolute inset-0 romantic-glow" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/25 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-peach/35 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-primary/30 rounded-full blur-3xl animate-float" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
          >
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <LunaAvatar size="lg" showGlow />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your healing journey starts now
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
              Join 50,000+ people who've found clarity, connection, and peace with Luna. 
              No credit card required. Start free today.
            </p>
            
            {/* Urgency element */}
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-accent/30 mb-8">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">Start today and get 7 days of Pro features free</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" variant="peach" className="text-lg px-8 py-6 shadow-button" onClick={() => navigate("/auth")}>
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Today
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-card/50 backdrop-blur-sm" onClick={() => setShowDemoDialog(true)}>
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            {/* Final trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>4.9★ from 50K+ users</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
              <div className="flex items-center gap-3">
                <LunaAvatar size="sm" showGlow={false} />
                <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
              </div>
              <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="/blog" className="hover:text-foreground transition-colors">Blog</a>
                <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
                <a href="/resources" className="hover:text-foreground transition-colors">Resources</a>
                <a href="/crisis" className="hover:text-foreground transition-colors">Crisis Help</a>
              </nav>
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <SocialLinks />
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 Luna. Your data is private and secure.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Demo Video Dialog */}
      <DemoVideoDialog open={showDemoDialog} onOpenChange={setShowDemoDialog} />
    </div>
  );
};

export default DesktopLanding;
