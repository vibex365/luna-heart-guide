import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircleHeart, Sparkles, Shield, ChevronLeft, ChevronRight, Users, TrendingUp, Gift, Calendar, MessageSquare, Home, ShieldAlert, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { useQuery } from '@tanstack/react-query';

// Icon mapping for hero icons from database
const iconMap: Record<string, LucideIcon> = {
  'heart': Heart,
  'message-square': MessageSquare,
  'home': Home,
  'shield-alert': ShieldAlert,
};

// Default content as fallback
const defaultContent = {
  headline: "Reconnect Before It's Too Late.",
  subheadline: "Communication tools that actually work. Together.",
  hero_icon: 'heart',
  pain_points: [
    "Having the same argument again",
    "Feeling unheard even when they're listening",
    "Missing the connection you used to have",
    "Wondering if you're growing apart"
  ],
  testimonials: [
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
    }
  ],
  cta_text: "Start Together – $19/mo for Both",
  relatability_tagline: "You're not failing. You're struggling to communicate."
};

interface Testimonial {
  quote: string;
  author: string;
  emoji: string;
}

interface SegmentContent {
  headline: string;
  subheadline: string;
  hero_icon: string;
  pain_points: string[];
  testimonials: Testimonial[];
  cta_text: string;
  relatability_tagline: string;
}

// Testimonial Carousel Component
const TestimonialCarousel = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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
            <p className="text-white/90 text-base italic mb-3">
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
  const [searchParams] = useSearchParams();
  const segment = searchParams.get('segment') || '';
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { trackEvent, getUTMData } = useFunnelTracking('couples');

  // Fetch segment-specific content from database
  const { data: segmentData } = useQuery({
    queryKey: ['dm-segment', segment],
    queryFn: async () => {
      if (!segment) return null;
      
      const { data, error } = await supabase
        .from('dm_segments')
        .select('headline, subheadline, pain_points, cta_text, relatability_tagline, hero_icon, testimonials')
        .eq('slug', segment)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.log('[CouplesFunnel] No segment found:', segment);
        return null;
      }
      return data;
    },
    enabled: !!segment,
  });

  // Use database content or fallback to defaults
  const content: SegmentContent = segmentData ? {
    headline: segmentData.headline,
    subheadline: segmentData.subheadline,
    hero_icon: segmentData.hero_icon || 'heart',
    pain_points: (segmentData.pain_points as string[]) || defaultContent.pain_points,
    testimonials: (segmentData.testimonials as unknown as Testimonial[]) || defaultContent.testimonials,
    cta_text: segmentData.cta_text,
    relatability_tagline: segmentData.relatability_tagline || defaultContent.relatability_tagline,
  } : defaultContent;

  const HeroIcon = iconMap[content.hero_icon] || Heart;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Track checkout start with segment
      await trackEvent('checkout_start');
      
      const utmData = getUTMData();

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_1SdhytAsrgxssNTVvlvnqvZr',
          returnUrl: '/couples-welcome',
          metadata: { ...utmData, segment }
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

  const steps = [
    { number: "1", title: "Both partners join Luna", description: "Create your shared space" },
    { number: "2", title: "Complete activities together", description: "Quizzes, prompts & check-ins" },
    { number: "3", title: "Watch your connection grow", description: "Track progress over time" }
  ];

  return (
    <div className="min-h-screen bg-couples-gradient text-white overflow-x-hidden">
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
              <HeroIcon className="w-10 h-10 text-couples-accent" fill="currentColor" />
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-white">
            {content.headline}
          </h1>
          
          <p className="text-xl text-white/90 mb-3">
            {content.subheadline}
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
            {isLoading ? "Loading..." : content.cta_text}
          </Button>
          
          <p className="text-xs text-white/70 mt-3 font-medium">
            ✨ One subscription, two accounts. Cancel anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8"
        >
          <ChevronLeft className="w-6 h-6 text-white/30 rotate-[-90deg] animate-bounce" />
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
            {content.pain_points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="couples-card p-4 rounded-xl text-left"
              >
                <p className="text-white/80">{point}</p>
              </motion.div>
            ))}
          </div>
          
          <p className="text-couples-accent font-medium">
            {content.relatability_tagline}
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
            <p className="text-white/60">Everything you need to reconnect</p>
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
                <p className="text-white/80 text-sm">{feature.text}</p>
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
          <p className="text-white/60">See what others are saying</p>
        </motion.div>
        
        <TestimonialCarousel testimonials={content.testimonials} />
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
                  <p className="text-white/60 text-sm">{step.description}</p>
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
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 opacity-60">
              <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Couples Therapy</p>
              <p className="text-2xl font-bold text-white/50">$200</p>
              <p className="text-xs text-white/40">per session</p>
              <p className="text-lg font-semibold text-white/50 mt-2">~$800/mo</p>
            </div>
            
            <div className="p-4 rounded-xl bg-couples-accent/10 border-2 border-couples-accent relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-couples-accent text-white text-xs px-2 py-0.5 rounded-bl font-medium">
                Best Value
              </div>
              <p className="text-xs text-couples-accent uppercase tracking-wide mb-2">Luna Couples</p>
              <p className="text-2xl font-bold text-couples-accent">$19</p>
              <p className="text-xs text-white/60">per month, total</p>
              <p className="text-xs text-white/80 mt-2 font-medium">2 accounts included ✨</p>
            </div>
          </div>
          
          <p className="text-center text-white/50 text-sm mt-4">
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
          <p className="text-white/60 mb-6">
            Start your journey back to each other today.
          </p>
          
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            size="lg"
            className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full shadow-lg w-full"
          >
            {isLoading ? "Loading..." : content.cta_text}
          </Button>
          
          <p className="text-xs text-white/70 mt-3 font-medium">
            ✨ One subscription covers both partners. Cancel anytime.
          </p>
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="px-6 py-12 border-t border-white/10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-white/50">Private & Secure</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-white/50">No Judgment</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-white/50">Built for Real Couples</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-couples-accent" />
              <p className="text-xs text-white/50">AI-Powered Insights</p>
            </div>
          </div>
          
          <p className="text-center text-xs text-white/40 mt-6">
            Trusted by couples who wanted to try before giving up.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default CouplesFunnel;
