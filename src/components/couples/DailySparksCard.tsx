import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, CheckCircle2, Clock, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useDailyQuestion } from '@/hooks/useDailyQuestion';
import { format } from 'date-fns';

interface DailySparksCardProps {
  partnerLinkId?: string;
  partnerName?: string;
}

export const DailySparksCard = ({ partnerLinkId, partnerName = "Your Partner" }: DailySparksCardProps) => {
  const {
    todaysQuestion,
    myAnswer,
    partnerAnswer,
    hasAnswered,
    partnerHasAnswered,
    bothAnswered,
    isLoading,
    submitAnswer,
    isSubmitting,
  } = useDailyQuestion();

  const [showInput, setShowInput] = useState(false);
  const [answer, setAnswer] = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    await submitAnswer(answer);
    setAnswer('');
    setShowInput(false);
  };

  if (isLoading || !todaysQuestion) {
    return null;
  }

  // Beautiful gradient backgrounds based on category
  const categoryGradients: Record<string, string> = {
    appreciation: 'from-rose-100 via-pink-50 to-orange-50 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-orange-950/20',
    love: 'from-pink-100 via-rose-50 to-red-50 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-red-950/20',
    dreams: 'from-violet-100 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20',
    memories: 'from-amber-100 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20',
    fun: 'from-emerald-100 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/20',
    growth: 'from-blue-100 via-cyan-50 to-sky-50 dark:from-blue-950/30 dark:via-cyan-950/20 dark:to-sky-950/20',
    general: 'from-slate-100 via-gray-50 to-zinc-50 dark:from-slate-950/30 dark:via-gray-950/20 dark:to-zinc-950/20',
  };

  const gradient = categoryGradients[todaysQuestion.category] || categoryGradients.general;

  // Card UI similar to Ember's "Sparks"
  return (
    <div className="relative">
      {/* Main Spark Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        className="relative z-10"
      >
        <Card className={`overflow-hidden border-0 shadow-lg bg-gradient-to-br ${gradient}`}>
          <CardContent className="p-0">
            {/* Header with date */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {format(new Date(), 'EEE, MMM d, yyyy')}
              </span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Daily Spark</span>
              </div>
            </div>

            {/* Question */}
            <div className="px-5 pb-4">
              <h3 className="text-xl font-bold leading-snug text-foreground">
                {todaysQuestion.question_text}
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {/* Answer Input */}
              {!hasAnswered && !showInput && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5"
                >
                  <Button
                    onClick={() => setShowInput(true)}
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Write Your Answer
                  </Button>
                </motion.div>
              )}

              {/* Text Input */}
              {!hasAnswered && showInput && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-5 space-y-3"
                >
                  <div className="relative">
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Share what's in your heart..."
                      className="min-h-28 resize-none bg-white/80 dark:bg-black/20 border-0 rounded-xl focus:ring-2 focus:ring-foreground/20"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setShowInput(false);
                        setAnswer('');
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send to Partner'}
                  </Button>
                </motion.div>
              )}

              {/* My Answer - Waiting for Partner */}
              {hasAnswered && !bothAnswered && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-5 pb-5 space-y-3"
                >
                  <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Your spark</span>
                    </div>
                    <p className="text-sm text-foreground">{myAnswer?.answer_text}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Waiting for {partnerName}'s spark...</span>
                  </div>
                </motion.div>
              )}

              {/* Both Answered - Reveal */}
              {bothAnswered && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-5 pb-5 space-y-3"
                >
                  <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Your spark</span>
                    </div>
                    <p className="text-sm text-foreground">{myAnswer?.answer_text}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-200/60 to-rose-200/60 dark:from-pink-900/30 dark:to-rose-900/30">
                    <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
                      <Heart className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{partnerName}'s spark</span>
                    </div>
                    <p className="text-sm text-foreground">{partnerAnswer?.answer_text}</p>
                  </div>
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    ✨ A beautiful moment shared! Come back tomorrow for a new spark.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Decorative background cards */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-2 left-2 right-2 h-full rounded-2xl bg-foreground/5 rotate-[-2deg]" />
        <div className="absolute top-4 left-4 right-4 h-full rounded-2xl bg-foreground/3 rotate-[-4deg]" />
      </div>
    </div>
  );
};
