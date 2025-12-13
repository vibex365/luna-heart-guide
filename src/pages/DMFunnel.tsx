import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Clock, Shield, Heart, Check, Sparkles, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import LunaAvatar from "@/components/LunaAvatar";

// Testimonials data
const testimonials = [
  {
    quote: "I used to spiral for hours after a text. Now I talk to Luna first and actually feel calm enough to respond.",
    author: "Sarah, 24",
    context: "3 weeks with Luna",
  },
  {
    quote: "It feels like having a friend who actually listens without making me feel dramatic.",
    author: "Anonymous",
    context: "After a breakup",
  },
  {
    quote: "I deleted the app where I was stalking his profile. Luna helped me see I was hurting myself.",
    author: "Mia, 28",
    context: "1 month with Luna",
  },
  {
    quote: "The 3am anxiety doesn't feel so scary anymore. Luna is always there.",
    author: "Anonymous",
    context: "Dealing with anxiety",
  },
  {
    quote: "I finally stopped replaying that conversation in my head. Luna helped me let it go.",
    author: "Jess, 22",
    context: "2 weeks with Luna",
  },
];

// Testimonial Carousel Component
const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      if (newDirection === 1) {
        return prev === testimonials.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <div className="relative">
      <div className="overflow-hidden px-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="funnel-card p-6 rounded-2xl"
          >
            <Quote className="w-6 h-6 text-funnel-accent/40 mb-3" />
            <p className="text-white/90 text-base leading-relaxed mb-4 italic">
              "{testimonials[currentIndex].quote}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">
                  {testimonials[currentIndex].author}
                </p>
                <p className="text-white/40 text-xs">
                  {testimonials[currentIndex].context}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => paginate(-1)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        
        <div className="flex gap-1.5">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? "bg-funnel-accent w-4" 
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={() => paginate(1)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  );
};

const DMFunnel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { trackEvent, getUTMData } = useFunnelTracking('dm');

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Track checkout start
      await trackEvent('checkout_start');
      
      const { data: { session } } = await supabase.auth.getSession();
      const utmData = getUTMData();
      
      if (!session) {
        // Redirect to auth with return URL
        const utmString = `utm_source=${utmData.utm_source}&utm_medium=${utmData.utm_medium}&utm_campaign=${utmData.utm_campaign}&utm_content=${utmData.utm_content}`;
        const redirectUrl = `/dm?${utmString}`;
        window.location.href = `/auth?redirect=${encodeURIComponent(redirectUrl)}&checkout=true`;
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId: "price_1SdhyfAsrgxssNTVTPpZuI3t",
          returnUrl: "/welcome",
          metadata: utmData,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const relatabilityItems = [
    "replaying conversations",
    "checking their socials",
    "typing texts then deleting them",
    "feeling okay during the day, spiraling at night",
  ];

  const features = [
    { icon: Clock, text: "Available 24/7" },
    { icon: MessageCircle, text: "Responds like a real conversation" },
    { icon: Heart, text: "Helps you think clearly without judgment" },
    { icon: Shield, text: "Private, supportive, and always patient" },
  ];

  const steps = [
    { number: "1", title: "Start a conversation" },
    { number: "2", title: "Talk through what you're feeling" },
    { number: "3", title: "Feel calmer, clearer, and more in control" },
  ];

  return (
    <div className="min-h-screen bg-funnel-gradient text-white">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex flex-col justify-center items-center px-6 py-12 text-center relative overflow-hidden">
        <div className="funnel-glow absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Stop Overthinking<br />in 30 Days.
          </h1>
          <p className="text-xl text-white/80 mb-3">
            Private. Judgment-free. Always available.
          </p>
          <p className="text-white/60 text-sm">
            Your AI relationship companion when your thoughts won't slow down.
          </p>
        </motion.div>
      </section>

      {/* Relatability Block */}
      <section className="px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <p className="text-white/50 text-sm mb-6">You know the feeling...</p>
          <div className="space-y-3">
            {relatabilityItems.map((item, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-white/70 text-lg"
              >
                {item}
              </motion.p>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-xl font-medium text-funnel-accent"
          >
            You're not broken. You're overwhelmed.
          </motion.p>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <h2 className="text-xl font-bold text-center mb-6 text-white/90">
            Real stories from real people
          </h2>
          <TestimonialCarousel />
        </motion.div>
      </section>

      {/* What Luna Is */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="funnel-card max-w-sm mx-auto p-8 rounded-3xl"
        >
          <div className="flex justify-center mb-6">
            <LunaAvatar size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Meet Luna.</h2>
          <p className="text-white/70 text-center mb-6">
            Luna is your AI relationship companion. She helps you process emotions instead of suppressing them.
          </p>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-funnel-accent/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-funnel-accent" />
                </div>
                <span className="text-white/80 text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <h2 className="text-2xl font-bold mb-8">How it works</h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-funnel-accent/20 border border-funnel-accent/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-funnel-accent font-bold">{step.number}</span>
                </div>
                <span className="text-white/80 text-left">{step.title}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Price Comparison */}
      <section className="px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Traditional Therapy */}
            <div className="bg-white/5 rounded-2xl p-5 opacity-60">
              <p className="text-xs text-white/50 mb-2">Traditional Therapy</p>
              <p className="text-lg font-bold text-white/70">$190</p>
              <p className="text-xs text-white/50">per session</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-sm text-white/50">$720/month</p>
              </div>
            </div>
            
            {/* Luna */}
            <div className="bg-funnel-accent/10 border border-funnel-accent/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-funnel-accent text-black text-[10px] px-2 py-1 rounded-bl-lg font-medium">
                BEST VALUE
              </div>
              <p className="text-xs text-funnel-accent mb-2">Luna</p>
              <p className="text-2xl font-bold text-white">$12</p>
              <p className="text-xs text-white/70">for 30 days</p>
              <div className="mt-3 pt-3 border-t border-funnel-accent/20">
                <p className="text-sm text-funnel-accent flex items-center gap-1">
                  <Check className="w-3 h-3" /> Cancel anytime
                </p>
              </div>
            </div>
          </div>
          <p className="text-center text-white/50 text-sm mt-4">
            No appointments. No pressure.
          </p>
        </motion.div>
      </section>

      {/* Trust Block */}
      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto text-center"
        >
          <div className="flex flex-wrap justify-center gap-3 text-white/50 text-sm">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Private & secure
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> No judgment
            </span>
          </div>
          <p className="text-white/40 text-xs mt-4">
            Used daily by women who needed someone to talk to
          </p>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto text-center"
        >
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-funnel-accent hover:bg-funnel-accent/90 text-black rounded-full shadow-lg shadow-funnel-accent/30"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Healing Today – $12
              </span>
            )}
          </Button>
          <p className="text-white/50 text-xs mt-3">
            Cancel anytime. No contracts.
          </p>
        </motion.div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-6 px-6 z-50">
        <div className="max-w-sm mx-auto">
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full h-12 font-semibold bg-funnel-accent hover:bg-funnel-accent/90 text-black rounded-full shadow-lg shadow-funnel-accent/30"
          >
            {isLoading ? "Processing..." : "Start Healing Today – $12"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DMFunnel;
