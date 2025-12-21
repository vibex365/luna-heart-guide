import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, MessageCircle, Wind, BookOpen, ChevronUp, User, ArrowRight, Sparkles, HelpCircle, LogIn, Rocket, Crown, Check, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import { useNavigate, Link } from "react-router-dom";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import PWAInstallInstructions from "@/components/PWAInstallInstructions";
import DesktopLanding from "@/components/DesktopLanding";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReelSlide {
  id: number;
  gradient: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  cta?: string;
  isPricing?: boolean;
  isInstall?: boolean;
}

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 messages per day", "Basic mood tracking", "Breathing exercises"],
    highlight: false,
    priceId: null,
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    features: ["Unlimited conversations", "Advanced analytics", "Priority responses"],
    highlight: true,
    priceId: "price_1SdhyfAsrgxssNTVTPpZuI3t",
    popular: true,
  },
  {
    name: "Couples",
    price: "$19",
    period: "/month",
    features: ["Private couples chat", "Relationship games", "Shared mood tracking"],
    highlight: false,
    priceId: "price_1SdhytAsrgxssNTVvlvnqvZr",
    popular: false,
  },
];

const slides: ReelSlide[] = [
  {
    id: 0,
    gradient: "from-accent/15 via-background to-background",
    icon: Download,
    title: "Install Luna",
    subtitle: "Always Available",
    description: "",
    isInstall: true,
  },
  {
    id: 1,
    gradient: "from-primary/30 via-background to-background",
    icon: Heart,
    title: "Meet Luna",
    subtitle: "Your AI Companion",
    description: "A safe space to talk through feelings, relationships, and life's challenges — 24/7, judgment-free.",
  },
  {
    id: 2,
    gradient: "from-accent/20 via-background to-background",
    icon: MessageCircle,
    title: "Talk It Out",
    subtitle: "AI-Powered Conversations",
    description: "Get personalized guidance and communication scripts to navigate difficult conversations with loved ones.",
  },
  {
    id: 3,
    gradient: "from-secondary/40 via-background to-background",
    icon: Sparkles,
    title: "Track Your Mood",
    subtitle: "Understand Patterns",
    description: "Log your emotions daily and discover insights about your emotional journey over time.",
  },
  {
    id: 4,
    gradient: "from-primary/20 via-background to-background",
    icon: Wind,
    title: "Breathe & Relax",
    subtitle: "Guided Exercises",
    description: "Access calming breathing techniques whenever you need to center yourself and find peace.",
  },
  {
    id: 5,
    gradient: "from-accent/30 via-background to-background",
    icon: BookOpen,
    title: "Journal",
    subtitle: "Express Yourself",
    description: "Write freely with thoughtful prompts that help you reflect, process, and grow.",
  },
  {
    id: 6,
    gradient: "from-rose-500/20 via-background to-background",
    icon: Users,
    title: "Couples Mode",
    subtitle: "Strengthen Your Bond",
    description: "Send digital gifts, daily journal prompts, relationship games, private chat, shared mood tracking, and earn coins together.",
  },
  {
    id: 7,
    gradient: "from-primary/25 via-background to-background",
    icon: Crown,
    title: "Simple Pricing",
    subtitle: "Choose Your Plan",
    description: "",
    cta: "Start Your Journey",
    isPricing: true,
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { trigger: triggerHaptic } = useHapticFeedback();

  const goToSlide = useCallback((index: number, withHaptic = true) => {
    if (index >= 0 && index < slides.length && index !== currentSlide) {
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
      if (withHaptic) {
        triggerHaptic("light");
      }
    }
  }, [currentSlide, triggerHaptic]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = 0.5;

    if (info.offset.y < -threshold || info.velocity.y < -velocity) {
      // Swiped up - next slide
      if (currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      }
    } else if (info.offset.y > threshold || info.velocity.y > velocity) {
      // Swiped down - previous slide
      if (currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
  }, [currentSlide, goToSlide]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 30 && currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else if (e.deltaY < -30 && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation for desktop users
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      if (currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
  }, [currentSlide, goToSlide]);

  // Redirect logged in users
  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Show desktop landing for non-mobile users
  if (!isMobile) {
    return <DesktopLanding />;
  }

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <MobileOnlyLayout hideTabBar>
      <div 
        ref={containerRef}
        className="h-screen w-full overflow-hidden bg-background relative"
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${slide.gradient} transition-all duration-500`} />

        {/* Main content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col"
          >
            {/* Header */}
            <header className="pt-12 px-6 flex items-center justify-between safe-area-top">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <LunaAvatar size="sm" showGlow={false} />
                  <span className="font-heading font-bold text-lg text-foreground">LUNA</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                      <p className="text-sm">Swipe up or down to explore Luna's features</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
              {slide.isInstall ? (
                <>
                  <motion.p
                    className="text-accent text-sm font-medium mb-2 uppercase tracking-wider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.h1
                    className="font-heading text-2xl font-bold text-foreground mb-6 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <PWAInstallInstructions />
                  </motion.div>
                </>
              ) : slide.isPricing ? (
                <>
                  <motion.p
                    className="text-accent text-sm font-medium mb-2 uppercase tracking-wider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.h1
                    className="font-heading text-2xl font-bold text-foreground mb-6 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.div
                    className="flex gap-3 w-full max-w-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {pricingPlans.map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => navigate("/auth")}
                        className={`flex-1 rounded-xl p-3 text-center transition-all relative ${
                          plan.highlight
                            ? "bg-accent text-accent-foreground scale-105 shadow-lg"
                            : "bg-muted/50 text-foreground hover:bg-muted"
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Most Popular
                          </span>
                        )}
                        <p className="text-xs font-medium opacity-80">{plan.name}</p>
                        <p className="text-lg font-bold">{plan.price}</p>
                        <p className="text-[10px] opacity-70">{plan.period}</p>
                        <div className="mt-2 space-y-1">
                          {plan.features.slice(0, 2).map((feature) => (
                            <div key={feature} className="flex items-center gap-1 text-[9px]">
                              <Check className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                  >
                    <Button
                      variant="peach"
                      size="lg"
                      onClick={() => navigate("/auth")}
                      className="px-8"
                    >
                      {slide.cta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    className="w-20 h-20 rounded-3xl gradient-luna flex items-center justify-center mb-8 shadow-lg"
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    {currentSlide === 0 ? (
                      <LunaAvatar size="lg" showGlow />
                    ) : (
                      <Icon className="w-10 h-10 text-accent" />
                    )}
                  </motion.div>

                  <motion.p
                    className="text-accent text-sm font-medium mb-2 uppercase tracking-wider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {slide.subtitle}
                  </motion.p>

                  <motion.h1
                    className="font-heading text-3xl font-bold text-foreground mb-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {slide.title}
                  </motion.h1>

                  <motion.p
                    className="text-muted-foreground text-center leading-relaxed max-w-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    {slide.description}
                  </motion.p>
                </>
              )}
            </main>

            {/* Swipe indicator */}
            {currentSlide < slides.length - 1 && (
              <motion.div
                className="absolute bottom-24 left-0 right-0 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronUp className="w-6 h-6 text-muted-foreground" />
                </motion.div>
                <span className="text-xs text-muted-foreground mt-1">Swipe up</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Side icon navigation */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {slides.map((slide, index) => {
            const SlideIcon = slide.icon;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`p-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-accent text-accent-foreground scale-110 shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                }`}
                aria-label={slide.title}
              >
                <SlideIcon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Bottom CTA bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/80 to-transparent safe-area-bottom">
          <div className="flex gap-3">
            <Button
              variant="luna"
              size="lg"
              className="flex-1"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button
              variant="peach"
              size="lg"
              className="flex-1"
              onClick={() => navigate("/auth")}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Free forever • 100% private • No credit card
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </MobileOnlyLayout>
  );
};

export default Landing;
