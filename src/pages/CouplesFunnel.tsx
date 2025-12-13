import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircleHeart, Target, Sparkles, Shield, ChevronLeft, ChevronRight, Users, TrendingUp, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// UTM Tracking Hook
const useUTMTracking = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmData = {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || 'couples',
      utm_content: params.get('utm_content') || 'none',
      landed_at: new Date().toISOString(),
      landing_page: '/couples-funnel'
    };
    sessionStorage.setItem('utm_data', JSON.stringify(utmData));
    console.log('[CouplesFunnel] UTM Data captured:', utmData);
  }, []);

  const getUTMData = () => {
    const stored = sessionStorage.getItem('utm_data');
    return stored ? JSON.parse(stored) : null;
  };

  return { getUTMData };
};

// Testimonial Carousel Component
const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      quote: "We stopped fighting about the same things every week. Luna helped us break the cycle.",
      author: "Together 4 years",
      emoji: "💕"
    },
    {
      quote: "The appreciation prompts reminded us why we fell in love in the first place.",
      author: "Married 2 years",
      emoji: "🥰"
    },
    {
      quote: "Our relationship score helped us see what we were missing. Now we're stronger than ever.",
      author: "Dating 18 months",
      emoji: "📈"
    },
    {
      quote: "We finally understand each other's love language. It changed everything.",
      author: "Engaged couple",
      emoji: "💝"
    },
    {
      quote: "Luna gave us a safe space to be honest without judgment.",
      author: "Together 6 years",
      emoji: "🤝"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="couples-card p-6 rounded-2xl min-h-[160px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-4xl mb-3">{testimonials[currentIndex].emoji}</p>
            <p className="text-foreground/90 text-base italic mb-3">
              "{testimonials[currentIndex].quote}"
            </p>
            <p className="text-couples-accent text-sm font-medium">
              — {testimonials[currentIndex].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-full bg-couples-accent/20 hover:bg-couples-accent/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-couples-accent" />
        </button>
        
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-couples-accent' : 'bg-couples-accent/30'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={goToNext}
          className="p-2 rounded-full bg-couples-accent/20 hover:bg-couples-accent/30 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-couples-accent" />
        </button>
      </div>
    </div>
  );
};

const CouplesFunnel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getUTMData } = useUTMTracking();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const utmData = getUTMData();
      console.log('[CouplesFunnel] Starting checkout with UTM:', utmData);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_1SdhytAsrgxssNTVvlvnqvZr',
          returnUrl: '/couples-welcome',
          metadata: utmData
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('[CouplesFunnel] Checkout error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Heart, text: "Shared mood tracking to understand each other" },
    { icon: MessageCircleHeart, text: "Conflict resolution scripts that de-escalate" },
    { icon: Gift, text: "Love language quizzes for deeper connection" },
    { icon: Sparkles, text: "Daily appreciation prompts to stay grateful" },
    { icon: TrendingUp, text: "Relationship health score to track progress" },
    { icon: Calendar, text: "Weekly insights on your partnership" }
  ];

  const painPoints = [
    "Having the same argument again",
    "Feeling unheard even when they're listening",
    "Missing the connection you used to have",
    "Wondering if you're growing apart"
  ];

  const steps = [
    { number: "1", title: "Both partners join Luna", description: "Create your shared space" },
    { number: "2", title: "Complete activities together", description: "Quizzes, prompts & check-ins" },
    { number: "3", title: "Watch your connection grow", description: "Track progress over time" }
  ];

  return (
    <div className="min-h-screen bg-couples-gradient text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="couples-glow absolute inset-0 pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center z-10 max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-couples-accent/20 border border-couples-accent/30">
              <Heart className="w-10 h-10 text-couples-accent" fill="currentColor" />
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Reconnect Before<br />It's Too Late.
          </h1>
          
          <p className="text-xl text-foreground/80 mb-3">
            Communication tools that actually work. Together.
          </p>
          
          <p className="text-sm text-couples-accent mb-8">
            Your AI-powered couples companion for deeper understanding.
          </p>

          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            size="lg"
            className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full shadow-lg"
          >
            {isLoading ? "Loading..." : "Start Reconnecting – $19/mo"}
          </Button>
          
          <p className="text-xs text-foreground/50 mt-3">
            Both partners included. Cancel anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8"
        >
          <ChevronLeft className="w-6 h-6 text-foreground/30 rotate-[-90deg] animate-bounce" />
        </motion.div>
      </section>

      {/* Relatability Section */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto text-center"
        >
          <h2 className="text-2xl font-bold mb-8">Sound familiar?</h2>
          
          <div className="space-y-4 mb-8">
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="couples-card p-4 rounded-xl text-left"
              >
                <p className="text-foreground/80">{point}</p>
              </motion.div>
            ))}
          </div>
          
          <p className="text-couples-accent font-medium">
            You're not failing. You're struggling to communicate.
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-background/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-1 mb-4">
              <Heart className="w-5 h-5 text-couples-accent" />
              <Heart className="w-5 h-5 text-couples-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Meet Luna for Couples</h2>
            <p className="text-foreground/60">Everything you need to reconnect</p>
          </div>
          
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="couples-card p-4 rounded-xl flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-couples-accent/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-couples-accent" />
                </div>
                <p className="text-foreground/80 text-sm">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">Real Couples, Real Results</h2>
          <p className="text-foreground/60">See what others are saying</p>
        </motion.div>
        
        <TestimonialCarousel />
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-16 bg-background/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-couples-accent flex items-center justify-center flex-shrink-0 text-background font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-foreground/60 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Price Comparison Section */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">The Smart Choice</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 opacity-60">
              <p className="text-xs text-foreground/50 uppercase tracking-wide mb-2">Couples Therapy</p>
              <p className="text-2xl font-bold text-foreground/50">$200</p>
              <p className="text-xs text-foreground/40">per session</p>
              <p className="text-lg font-semibold text-foreground/50 mt-2">~$800/mo</p>
            </div>
            
            <div className="p-4 rounded-xl bg-couples-accent/10 border-2 border-couples-accent relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-couples-accent text-background text-xs px-2 py-0.5 rounded-bl">
                Best Value
              </div>
              <p className="text-xs text-couples-accent uppercase tracking-wide mb-2">Luna Couples</p>
              <p className="text-2xl font-bold text-couples-accent">$19</p>
              <p className="text-xs text-foreground/60">per month</p>
              <p className="text-xs text-foreground/50 mt-2">Both partners included</p>
            </div>
          </div>
          
          <p className="text-center text-foreground/50 text-sm mt-4">
            No scheduling. No awkward silences.
          </p>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto text-center"
        >
          <Users className="w-12 h-12 text-couples-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ready to Reconnect?</h2>
          <p className="text-foreground/60 mb-6">
            Start your journey back to each other today.
          </p>
          
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            size="lg"
            className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full shadow-lg w-full"
          >
            {isLoading ? "Loading..." : "Start Reconnecting Today – $19"}
          </Button>
          
          <p className="text-xs text-foreground/50 mt-3">
            Both partners. Cancel anytime.
          </p>
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="px-6 py-12 border-t border-foreground/10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-foreground/50">Private & Secure</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-foreground/50">No Judgment</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-foreground/50">Built for Real Couples</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-foreground/50">AI-Powered Insights</p>
            </div>
          </div>
          
          <p className="text-center text-xs text-foreground/40 mt-6">
            Trusted by couples who wanted to try before giving up.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default CouplesFunnel;
