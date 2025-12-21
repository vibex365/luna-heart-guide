import { motion } from "framer-motion";
import { Heart, MessageCircle, Wind, BookOpen, Users, Sparkles, Shield, Star, ArrowRight, Check, Rocket, Crown, Quote, Brain, HeartHandshake, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LunaAvatar from "./LunaAvatar";
import SocialLinks from "./SocialLinks";
import CouplesInteractiveDemo from "./CouplesInteractiveDemo";
import InteractiveDemo from "./InteractiveDemo";
const features = [{
  icon: MessageCircle,
  title: "AI-Powered Conversations",
  description: "Get personalized guidance and communication scripts to navigate difficult conversations with loved ones.",
  gradient: "from-primary/30 to-secondary/20"
}, {
  icon: Sparkles,
  title: "Mood Tracking",
  description: "Log your emotions daily and discover patterns in your emotional journey over time.",
  gradient: "from-secondary/30 to-accent/20"
}, {
  icon: Wind,
  title: "Breathing Exercises",
  description: "Access calming breathing techniques whenever you need to center yourself and find peace.",
  gradient: "from-accent/20 to-primary/30"
}, {
  icon: BookOpen,
  title: "Guided Journaling",
  description: "Write freely with thoughtful prompts that help you reflect, process, and grow.",
  gradient: "from-peach/30 to-secondary/20"
}, {
  icon: Users,
  title: "Couples Mode",
  description: "Send digital gifts, play relationship games, daily journaling, private chat, and earn coins together.",
  gradient: "from-primary/40 to-accent/30"
}, {
  icon: Brain,
  title: "Weekly Insights",
  description: "Receive personalized insights and progress reports based on your activity.",
  gradient: "from-secondary/40 to-primary/20"
}];
const testimonials = [{
  quote: "Luna helped me understand my anxiety patterns and gave me tools to cope. It's like having a therapist in my pocket.",
  author: "Sarah M.",
  role: "Managing anxiety for 2 years"
}, {
  quote: "The couples mode saved our relationship. We communicate so much better now.",
  author: "Michael & Jessica",
  role: "Together for 5 years"
}, {
  quote: "I never knew journaling could be this easy. Luna's prompts help me dig deeper.",
  author: "David K.",
  role: "Daily user for 6 months"
}];
const pricingPlans = [{
  name: "Free",
  price: "$0",
  period: "forever",
  features: ["5 messages per day", "Basic mood tracking", "Breathing exercises", "Limited journal prompts"],
  highlight: false,
  popular: false
}, {
  name: "Pro",
  price: "$12",
  period: "/month",
  features: ["Unlimited conversations", "Advanced mood analytics", "Priority AI responses", "All journal templates", "Weekly insights"],
  highlight: true,
  popular: true
}, {
  name: "Couples",
  price: "$19",
  period: "/month",
  features: ["Everything in Pro", "Send digital gifts", "Private couples chat", "Daily journal prompts", "Relationship games"],
  highlight: false,
  popular: false
}];
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
const DesktopLanding = () => {
  const navigate = useNavigate();
  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 30
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true
    },
    transition: {
      duration: 0.6
    }
  };
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Section 1: Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated romantic background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 romantic-glow" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/25 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-peach/40 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-float" />
        </div>

        {/* Navigation */}
        <header className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-2xl text-foreground">LUNA</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">Try Demo</a>
              <a href="#couples-demo" className="text-muted-foreground hover:text-foreground transition-colors">Couples Demo</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Stories</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="peach" onClick={() => navigate("/auth")}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-32">
          <motion.div initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.5
        }} className="mb-8 inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Your 24/7 AI Companion for Emotional Wellness</span>
          </motion.div>

          <motion.h1 initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2,
          duration: 0.6
        }} className="font-heading text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Talk through feelings.
            <br />
            <span className="bg-gradient-to-r from-accent via-peach to-accent bg-clip-text text-transparent">Heal together.</span>
          </motion.h1>

          <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3,
          duration: 0.6
        }} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A safe, judgment-free space to process emotions, strengthen relationships, 
            and find clarity — powered by understanding AI.
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4,
          duration: 0.6
        }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="peach" className="text-lg px-8 py-6 shadow-button" onClick={() => navigate("/auth")}>
              <Rocket className="w-5 h-5 mr-2" />
              Start Your Journey — Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              Watch Demo
            </Button>
          </motion.div>

          {/* Avatar showcase */}
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.6,
          duration: 0.8
        }} className="mt-16 relative">
            <div className="relative w-48 h-48 mx-auto">
              <LunaAvatar size="lg" showGlow />
              <motion.div animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }} transition={{
              duration: 3,
              repeat: Infinity
            }} className="absolute inset-0 rounded-full bg-accent/20 blur-2xl -z-10" />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1
      }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{
          y: [0, 10, 0]
        }} transition={{
          duration: 1.5,
          repeat: Infinity
        }} className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: Stats Bar */}
      <section className="py-12 gradient-warmth border-y border-accent/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => <motion.div key={stat.label} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-accent to-peach bg-clip-text text-transparent mb-1">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Section 3: Features Grid */}
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
            return <motion.div key={feature.title} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="group p-6 rounded-2xl bg-card border border-accent/10 hover:border-accent/40 hover:shadow-romantic transition-all duration-300">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-peach/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-soft`}>
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Section 3.5: Interactive Demo */}
      <InteractiveDemo />

      {/* Section 4: How It Works */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">How It Works</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Your healing journey in 3 steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            step: "01",
            icon: Heart,
            title: "Share Your Feelings",
            description: "Start a conversation with Luna about anything on your mind. No judgment, just understanding."
          }, {
            step: "02",
            icon: Brain,
            title: "Gain Insights",
            description: "Luna helps you understand patterns in your emotions and provides personalized guidance."
          }, {
            step: "03",
            icon: Zap,
            title: "Take Action",
            description: "Use tools like breathing exercises, journaling, and communication scripts to grow."
          }].map((item, index) => {
            const Icon = item.icon;
            return <motion.div key={item.step} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.2
            }} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-romantic mb-6 shadow-romantic">
                    <Icon className="w-10 h-10 text-accent-foreground" />
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
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Section 5: Couples Mode Highlight */}
      <section className="py-24 bg-gradient-to-br from-accent/15 via-primary/20 to-peach/25 overflow-hidden relative">
        <div className="absolute inset-0 romantic-glow opacity-50" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
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
                {["Send digital gifts with animations", "Private encrypted messaging", "Daily journal prompts together", "Fun relationship quizzes & games", "Earn & spend coins on gifts", "Milestone & anniversary reminders"].map(item => <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>)}
              </ul>
              <Button variant="peach" size="lg" onClick={() => navigate("/couples-welcome")}>
                Try Couples Mode
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 50
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="relative">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/20 rounded-3xl blur-2xl" />
                <div className="relative bg-card rounded-3xl p-8 border border-border shadow-luna">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Partner Connected</p>
                      <p className="text-sm text-muted-foreground">Relationship Health: 92%</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-1">Today's Challenge</p>
                      <p className="font-medium text-foreground">Share 3 things you appreciate about each other</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                      <p className="font-medium text-foreground">🔥 14 days of connection</p>
                    </div>
                    <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                      <p className="text-sm text-accent">Next milestone in 3 days!</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 5.5: Couples Interactive Demo */}
      <section id="couples-demo">
        <CouplesInteractiveDemo />
      </section>

      {/* Section 6: Testimonials */}
      <section id="testimonials" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Testimonials</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Stories of healing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real experiences from people who found clarity, connection, and peace with Luna.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => <motion.div key={testimonial.author} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-card rounded-2xl p-6 border border-border hover:shadow-luna transition-shadow">
                <Quote className="w-10 h-10 text-accent/30 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Section 7: Pricing */}
      <section id="pricing" className="py-24 gradient-soft relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">Pricing</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => <motion.div key={plan.name} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className={`relative rounded-2xl p-6 ${plan.highlight ? "gradient-romantic text-accent-foreground scale-105 shadow-romantic border border-accent/30" : "bg-card border border-accent/10 hover:border-accent/30 hover:shadow-soft transition-all"}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-peach text-peach-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>}
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlight ? "opacity-80" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map(feature => <li key={feature} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${plan.highlight ? "" : "text-accent"}`} />
                      <span className={`text-sm ${plan.highlight ? "" : "text-muted-foreground"}`}>
                        {feature}
                      </span>
                    </li>)}
                </ul>
                <Button variant={plan.highlight ? "secondary" : "outline"} className="w-full" onClick={() => navigate("/auth")}>
                  {plan.name === "Free" ? "Get Started" : "Upgrade Now"}
                </Button>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Section 8: Final CTA */}
      <section className="py-24 bg-gradient-to-br from-accent/20 via-primary/25 to-peach/30 relative overflow-hidden">
        <div className="absolute inset-0 romantic-glow" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/25 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-peach/35 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-primary/30 rounded-full blur-3xl animate-float" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <LunaAvatar size="lg" showGlow />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to start healing?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Join thousands of people who've found clarity, connection, and peace with Luna. 
              Your journey to emotional wellness starts now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" variant="peach" className="text-lg px-8 py-6 shadow-button" onClick={() => navigate("/auth")}>
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Today
              </Button>
            </div>
            
            {/* Social links */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
            </p>
              
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
    </div>;
};
export default DesktopLanding;