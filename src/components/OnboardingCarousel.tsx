import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Heart, Moon, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: MessageCircle,
    title: "Meet Luna",
    description: "Your AI companion for emotional wellness. Luna is here to listen, support, and help you navigate your feelings without judgment.",
    gradient: "from-primary/20 to-accent/20",
  },
  {
    icon: Heart,
    title: "Track Your Mood",
    description: "Log how you're feeling each day. Luna helps you understand patterns and triggers in your emotional journey.",
    gradient: "from-accent/20 to-secondary/30",
  },
  {
    icon: Moon,
    title: "Breathe & Relax",
    description: "Access guided breathing exercises anytime you need to calm down or refocus your mind.",
    gradient: "from-secondary/30 to-primary/20",
  },
  {
    icon: Sparkles,
    title: "Journal Your Thoughts",
    description: "Express yourself through writing. Luna provides thoughtful prompts to help you reflect and grow.",
    gradient: "from-primary/20 to-accent/20",
  },
];

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const goToPrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon container */}
            <motion.div
              className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-lg`}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              {currentSlide === 0 ? (
                <LunaAvatar size="lg" showGlow />
              ) : (
                <Icon className="w-14 h-14 text-accent" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-heading text-2xl font-bold text-foreground mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-base leading-relaxed max-w-xs"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-accent w-8"
                : "bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-6 pb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          className={`${currentSlide === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="peach"
          size="lg"
          onClick={goToNext}
          className="px-8"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>

        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
    </div>
  );
};

export default OnboardingCarousel;
