import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDailyQuestion } from '@/hooks/useDailyQuestion';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, Send, Clock, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyQuestionCardProps {
  partnerLinkId?: string;
}

export const DailyQuestionCard = ({ partnerLinkId }: DailyQuestionCardProps) => {
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

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-pink-500/5">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!todaysQuestion) {
    return null;
  }

  const categoryColors: Record<string, string> = {
    appreciation: 'from-pink-500 to-rose-500',
    love: 'from-red-500 to-pink-500',
    dreams: 'from-purple-500 to-indigo-500',
    memories: 'from-amber-500 to-orange-500',
    fun: 'from-green-500 to-emerald-500',
    growth: 'from-blue-500 to-cyan-500',
    adventure: 'from-teal-500 to-green-500',
    deep: 'from-violet-500 to-purple-500',
    general: 'from-primary to-pink-500',
  };

  const gradient = categoryColors[todaysQuestion.category] || categoryColors.general;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-pink-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircleHeart className="h-5 w-5 text-primary" />
            Today's Question
          </CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs text-white bg-gradient-to-r ${gradient}`}>
            {todaysQuestion.category}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.p 
          className="text-lg font-medium text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {todaysQuestion.question_text}
        </motion.p>

        <AnimatePresence mode="wait">
          {!hasAnswered && !showInput && (
            <motion.div
              key="answer-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setShowInput(true)}
                className="w-full bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Answer Question (+5 coins)
              </Button>
            </motion.div>
          )}

          {!hasAnswered && showInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-24 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInput(false);
                    setAnswer('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-primary to-pink-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </Button>
              </div>
            </motion.div>
          )}

          {hasAnswered && !bothAnswered && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Your answer</span>
                </div>
                <p className="text-sm text-muted-foreground">{myAnswer?.answer_text}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Waiting for partner's answer...</span>
              </div>
            </motion.div>
          )}

          {bothAnswered && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Your answer</span>
                </div>
                <p className="text-sm">{myAnswer?.answer_text}</p>
              </div>
              <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center gap-2 text-pink-500 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Partner's answer</span>
                </div>
                <p className="text-sm">{partnerAnswer?.answer_text}</p>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-2">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Great connection! Come back tomorrow for a new question.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
