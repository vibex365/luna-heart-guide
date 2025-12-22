import { motion } from "framer-motion";
import { 
  Heart, MessageCircle, Sparkles, TrendingUp, Users, 
  Coins, Gift, CreditCard, Zap, Shield, Globe, 
  Smartphone, Brain, Target, ChevronRight, Star,
  Gamepad2, Calendar, BookHeart, Wind, Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PitchDeck = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: { staggerChildren: 0.1 }
    },
    viewport: { once: true }
  };

  const games = [
    "Would You Rather", "This or That", "Truth or Dare",
    "36 Questions to Fall in Love", "Love Language Quiz", "Newlywed Game",
    "Date Night Generator", "Spin the Wheel", "Most Likely To",
    "Finish My Sentence", "Two Truths One Lie", "Never Have I Ever",
    "Fantasy Cards", "Rate the Fantasy", "Drinking Game",
    "Appreciation Prompts", "Daily Questions", "Hot/Cold Game",
    "Time Capsule", "Couples Quiz", "Conversation Starters"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
        <motion.div 
          className="container mx-auto px-6 text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <span className="text-7xl md:text-9xl">🌙</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            Luna
          </h1>
          <p className="text-xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The AI-Powered Relationship Wellness Platform
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-sm">
              <Brain className="w-4 h-4 mr-2" /> AI-Powered
            </Badge>
            <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 px-4 py-2 text-sm">
              <Heart className="w-4 h-4 mr-2" /> Relationship Focused
            </Badge>
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 px-4 py-2 text-sm">
              <Gamepad2 className="w-4 h-4 mr-2" /> 20+ Interactive Games
            </Badge>
          </div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-gray-400"
          >
            <ChevronRight className="w-8 h-8 mx-auto rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mb-4">The Problem</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Relationships Are Struggling</h2>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-8">
            {[
              { stat: "40-50%", label: "of marriages end in divorce", icon: Heart },
              { stat: "65%", label: "of couples cite communication issues", icon: MessageCircle },
              { stat: "$150+/hr", label: "average couples therapy cost", icon: CreditCard }
            ].map((item, i) => (
              <motion.div key={i} {...fadeInUp}>
                <Card className="bg-slate-900/50 border-slate-800 text-center p-8">
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-4xl font-bold text-white mb-2">{item.stat}</p>
                  <p className="text-gray-400">{item.label}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-purple-950/30 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-4">The Solution</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Meet Luna</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              An AI-powered companion that combines therapeutic support with gamified engagement, 
              making relationship wellness accessible, affordable, and fun.
            </p>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-2 gap-8">
            <motion.div {...fadeInUp}>
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-400">
                    <Brain className="w-6 h-6" />
                    Individual Wellness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: MessageCircle, text: "24/7 AI Chat with Luna" },
                    { icon: Sparkles, text: "Mood Tracking & Analytics" },
                    { icon: Wind, text: "Guided Breathing Exercises" },
                    { icon: BookHeart, text: "Personal Journaling" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-300">
                      <item.icon className="w-5 h-5 text-purple-400" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div {...fadeInUp}>
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-pink-400">
                    <Heart className="w-6 h-6" />
                    Couples Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Users, text: "Partner Linking & Profiles" },
                    { icon: MessageCircle, text: "Private Real-time Chat" },
                    { icon: Gamepad2, text: "20+ Interactive Games" },
                    { icon: Calendar, text: "Date Night Generator" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-300">
                      <item.icon className="w-5 h-5 text-pink-400" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Games Library Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 mb-4">Key Differentiator</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">20+ Couples Games</h2>
            <p className="text-xl text-gray-400">The most comprehensive relationship game library on any platform</p>
          </motion.div>
          <motion.div {...fadeInUp} className="flex flex-wrap justify-center gap-3">
            {games.map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-gray-200 border-purple-500/30 px-4 py-2">
                  {game}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Revenue Streams Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-green-950/20 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-4">Business Model</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Three Revenue Streams</h2>
            <p className="text-xl text-gray-400">Diversified monetization for sustainable growth</p>
          </motion.div>
          
          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-8">
            {/* Subscriptions */}
            <motion.div {...fadeInUp}>
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-purple-400" />
                  </div>
                  <CardTitle className="text-purple-400">Subscriptions</CardTitle>
                  <p className="text-gray-500 text-sm">Recurring Revenue</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Free</span>
                      <span className="font-bold text-white">$0</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Basic features, 5 messages/day</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-900/30 border border-purple-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 font-medium">Pro</span>
                      <span className="font-bold text-white">$3.99<span className="text-sm text-gray-400">/mo</span></span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Unlimited AI, Advanced Analytics</p>
                  </div>
                  <div className="p-4 rounded-lg bg-pink-900/30 border border-pink-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-pink-300 font-medium">Couples</span>
                      <span className="font-bold text-white">$7.99<span className="text-sm text-gray-400">/mo</span></span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">All features, 2 linked accounts</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Virtual Currency */}
            <motion.div {...fadeInUp}>
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-yellow-400" />
                  </div>
                  <CardTitle className="text-yellow-400">Virtual Currency</CardTitle>
                  <p className="text-gray-500 text-sm">Microtransactions</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">100 Coins</span>
                      <span className="font-bold text-white">$1.99</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/30 border border-yellow-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-300">500 + 50 Bonus</span>
                      <span className="font-bold text-white">$7.99</span>
                    </div>
                    <Badge className="mt-2 bg-yellow-500/20 text-yellow-300 text-xs">Popular</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">1000 + 150 Bonus</span>
                      <span className="font-bold text-white">$14.99</span>
                    </div>
                    <Badge className="mt-2 bg-green-500/20 text-green-300 text-xs">Best Value</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Digital Gifts */}
            <motion.div {...fadeInUp}>
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-pink-400" />
                  </div>
                  <CardTitle className="text-pink-400">Digital Gifts</CardTitle>
                  <p className="text-gray-500 text-sm">Partner-to-Partner</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Digital Rose 🌹", price: "$0.99" },
                    { name: "Virtual Chocolates 🍫", price: "$0.99" },
                    { name: "Heart Bouquet 💐", price: "$1.99" },
                    { name: "Star Shower ⭐", price: "$2.99" },
                    { name: "Fireworks Display 🎆", price: "$3.99" },
                    { name: "Diamond Ring 💎", price: "$4.99" }
                  ].map((gift, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-800/30">
                      <span className="text-gray-300 text-sm">{gift.name}</span>
                      <span className="font-medium text-white text-sm">{gift.price}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-4">Infrastructure</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Enterprise-Grade Technology</h2>
          </motion.div>
          <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: "26", label: "Backend Functions", icon: Zap },
              { number: "67+", label: "Database Tables", icon: Shield },
              { number: "100%", label: "PWA Ready", icon: Smartphone },
              { number: "∞", label: "Scalable", icon: Globe }
            ].map((item, i) => (
              <motion.div key={i} {...fadeInUp}>
                <Card className="bg-slate-900/50 border-slate-800 text-center p-6">
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                  <p className="text-3xl font-bold text-white">{item.number}</p>
                  <p className="text-gray-400 text-sm">{item.label}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <motion.div {...fadeInUp} className="mt-12">
            <Card className="bg-slate-900/50 border-slate-800 p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Tech Stack</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> React + TypeScript Frontend</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> Supabase Backend</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> Stripe Payment Integration</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> Real-time Messaging</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Capabilities</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> AI-Powered Conversations</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> Push Notifications</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> SMS Reminders</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-400" /> Installable on Any Device</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-24 px-6 bg-gradient-to-b from-purple-950/30 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4">Market Opportunity</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Massive Addressable Market</h2>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-8">
            {[
              { label: "Global Wellness App Market", value: "$75B+", growth: "Growing 15% YoY" },
              { label: "Relationship App Segment", value: "$5B+", growth: "Underserved niche" },
              { label: "Target: Couples 25-45", value: "500M+", growth: "Globally" }
            ].map((item, i) => (
              <motion.div key={i} {...fadeInUp}>
                <Card className="bg-slate-900/50 border-slate-800 text-center p-8">
                  <p className="text-gray-400 mb-2">{item.label}</p>
                  <p className="text-4xl font-bold text-purple-400 mb-2">{item.value}</p>
                  <p className="text-sm text-gray-500">{item.growth}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-4">Moat</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Luna Wins</h2>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-2 gap-8">
            {[
              { 
                icon: Target, 
                title: "Only AI + Games Platform", 
                desc: "No competitor combines AI therapeutic support with gamified couples activities" 
              },
              { 
                icon: TrendingUp, 
                title: "Multi-Revenue Model", 
                desc: "Subscriptions + microtransactions = higher LTV and diversified income" 
              },
              { 
                icon: Users, 
                title: "Viral Growth Built-In", 
                desc: "Partner invites create organic 2x user acquisition per signup" 
              },
              { 
                icon: Sparkles, 
                title: "Infinitely Expandable", 
                desc: "Easy to add new games, prompts, and AI capabilities over time" 
              }
            ].map((item, i) => (
              <motion.div key={i} {...fadeInUp}>
                <Card className="bg-slate-900/50 border-slate-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Investment Ask */}
      <section className="py-24 px-6 bg-gradient-to-b from-rose-950/30 to-transparent">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeInUp} className="text-center">
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 mb-4">The Ask</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Let's Build Together</h2>
            
            <Card className="bg-slate-900/50 border-slate-800 p-8 md:p-12">
              <div className="space-y-8">
                <div>
                  <p className="text-gray-400 mb-2">Investment Opportunity</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    [Contact for Details]
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-gray-400 text-sm mb-1">Use of Funds</p>
                    <p className="text-white font-medium">Marketing & Growth</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-gray-400 text-sm mb-1">Use of Funds</p>
                    <p className="text-white font-medium">Content Expansion</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-gray-400 text-sm mb-1">Use of Funds</p>
                    <p className="text-white font-medium">Team Building</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-700">
                  <p className="text-gray-400 mb-4">Ready to discuss?</p>
                  <a 
                    href="mailto:invest@luna-app.com" 
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Mail className="w-5 h-5" />
                    Get in Touch
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-gray-500">
            Luna 🌙 — Confidential Investor Presentation — {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PitchDeck;
