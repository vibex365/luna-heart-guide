import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Archetype {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  growth_areas: string[];
  color: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    scores: Record<string, number>;
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "When you disagree with your partner, you usually...",
    options: [
      { text: "Need some space before discussing it", scores: { hawk: 3, wolf: 1, elephant: 1 } },
      { text: "Want to talk it through right away", scores: { dolphin: 3, beaver: 2 } },
      { text: "Focus on finding a practical solution", scores: { beaver: 3, elephant: 2 } },
      { text: "Try to understand their feelings first", scores: { elephant: 3, dolphin: 2 } },
    ]
  },
  {
    id: 2,
    question: "Your ideal weekend with your partner involves...",
    options: [
      { text: "An adventurous activity or new experience", scores: { hawk: 3, dolphin: 2 } },
      { text: "Working on a project or goal together", scores: { beaver: 3, wolf: 1 } },
      { text: "Relaxing at home, just the two of you", scores: { elephant: 3, wolf: 2 } },
      { text: "Social activities with friends or family", scores: { dolphin: 3, beaver: 1 } },
    ]
  },
  {
    id: 3,
    question: "In your relationship, you value most...",
    options: [
      { text: "Freedom and personal space", scores: { hawk: 3, dolphin: 1 } },
      { text: "Shared goals and growing together", scores: { beaver: 3, elephant: 1 } },
      { text: "Deep loyalty and commitment", scores: { wolf: 3, elephant: 2 } },
      { text: "Fun, laughter, and emotional connection", scores: { dolphin: 3, hawk: 1 } },
    ]
  },
  {
    id: 4,
    question: "When your partner is going through a hard time...",
    options: [
      { text: "You give them space to figure it out", scores: { hawk: 3, beaver: 1 } },
      { text: "You help them make a plan to fix it", scores: { beaver: 3, wolf: 1 } },
      { text: "You're there for them no matter what", scores: { elephant: 3, wolf: 3 } },
      { text: "You try to cheer them up and lighten the mood", scores: { dolphin: 3, hawk: 1 } },
    ]
  },
  {
    id: 5,
    question: "Your communication style is best described as...",
    options: [
      { text: "Direct and honest—I say what I mean", scores: { hawk: 3, beaver: 2 } },
      { text: "Thoughtful and practical", scores: { beaver: 3, elephant: 1 } },
      { text: "Warm and nurturing", scores: { elephant: 3, dolphin: 2 } },
      { text: "Playful and expressive", scores: { dolphin: 3, hawk: 1 } },
    ]
  },
  {
    id: 6,
    question: "What makes you feel most loved?",
    options: [
      { text: "Respecting my independence and trusting me", scores: { hawk: 3, wolf: 1 } },
      { text: "Working together toward shared dreams", scores: { beaver: 3, elephant: 1 } },
      { text: "Consistent actions that show commitment", scores: { wolf: 3, elephant: 3 } },
      { text: "Quality time and emotional connection", scores: { dolphin: 3, beaver: 1 } },
    ]
  },
  {
    id: 7,
    question: "How do you handle jealousy in a relationship?",
    options: [
      { text: "I rarely feel jealous—trust is key", scores: { hawk: 3, beaver: 2 } },
      { text: "I talk about it openly to find solutions", scores: { beaver: 3, dolphin: 2 } },
      { text: "I may struggle with it but work through it", scores: { wolf: 3, elephant: 2 } },
      { text: "I use humor to address it without drama", scores: { dolphin: 3, hawk: 1 } },
    ]
  },
];

interface PersonalityQuizProps {
  onComplete?: (archetype: Archetype) => void;
}

export const PersonalityQuiz = ({ onComplete }: PersonalityQuizProps) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    hawk: 0, beaver: 0, elephant: 0, dolphin: 0, wolf: 0
  });
  const [result, setResult] = useState<Archetype | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: archetypes } = useQuery({
    queryKey: ['relationship-archetypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_archetypes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Archetype[];
    },
  });

  const handleAnswer = (optionIndex: number) => {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const option = question.options[optionIndex];
    
    // Update scores
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([archetype, score]) => {
      newScores[archetype] = (newScores[archetype] || 0) + score;
    });
    setScores(newScores);
    setAnswers({ ...answers, [question.id]: optionIndex });

    // Move to next question or calculate result
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(c => c + 1), 300);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = async (finalScores: Record<string, number>) => {
    setIsSubmitting(true);

    // Find the highest scoring archetype
    const sortedScores = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);
    const topSlug = sortedScores[0][0];
    
    const matchedArchetype = archetypes?.find(a => a.slug === topSlug);
    
    if (!matchedArchetype) {
      toast.error("Could not determine your archetype");
      setIsSubmitting(false);
      return;
    }

    // Save result to database
    if (user) {
      try {
        await supabase.from('user_archetypes').insert({
          user_id: user.id,
          archetype_id: matchedArchetype.id,
          quiz_answers: answers,
          score_breakdown: finalScores,
        });
      } catch (error) {
        console.error('Error saving archetype:', error);
      }
    }

    setResult(matchedArchetype);
    setIsSubmitting(false);
    onComplete?.(matchedArchetype);
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(c => c - 1);
    }
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        {/* Result Card */}
        <Card 
          className="overflow-hidden border-2"
          style={{ borderColor: result.color }}
        >
          <div 
            className="h-3"
            style={{ background: `linear-gradient(to right, ${result.color}, ${result.color}80)` }}
          />
          <CardContent className="p-6 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-7xl"
            >
              {result.emoji}
            </motion.div>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold"
              >
                You're The {result.name}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground font-medium"
              >
                a.k.a. {result.tagline}
              </motion.p>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm leading-relaxed"
            >
              {result.description}
            </motion.p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Your Relationship Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.strengths.map((strength, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${result.color}20`,
                      color: result.color
                    }}
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-pink-500" />
                Areas for Growth
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {result.growth_areas.map((area, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => {
              setResult(null);
              setCurrentQuestion(0);
              setAnswers({});
              setScores({ hawk: 0, beaver: 0, elephant: 0, dolphin: 0, wolf: 0 });
            }}
            variant="outline"
            className="flex-1"
          >
            Retake Quiz
          </Button>
          <Button
            onClick={() => {
              toast.success("Share feature coming soon!");
            }}
            className="flex-1"
            style={{ backgroundColor: result.color }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Result
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-5xl"
        >
          ✨
        </motion.div>
        <p className="text-muted-foreground">Discovering your relationship style...</p>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold leading-relaxed">
                {question.question}
              </h2>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {question.options.map((option, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleAnswer(i)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-primary/5 ${
                  answers[question.id] === i 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                }`}
              >
                <span className="text-sm">{option.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentQuestion > 0 && (
        <Button
          onClick={goBack}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
      )}
    </div>
  );
};
