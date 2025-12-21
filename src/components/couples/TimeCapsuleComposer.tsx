import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Send, Calendar, Sparkles, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTimeCapsule } from '@/hooks/useTimeCapsule';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface TimeCapsuleComposerProps {
  partnerName: string;
}

const presetDates = [
  { label: 'Tomorrow', days: 1, icon: '🌅' },
  { label: 'Next Week', days: 7, icon: '📅' },
  { label: 'Next Month', days: 30, icon: '🗓️' },
  { label: '3 Months', days: 90, icon: '💫' },
  { label: '6 Months', days: 180, icon: '✨' },
  { label: '1 Year', days: 365, icon: '💝' },
];

const promptSuggestions = [
  "Remember that time we...",
  "I love you because...",
  "One year from now, I hope we...",
  "My favorite memory of us is...",
  "I can't wait to...",
  "You make me feel...",
];

export const TimeCapsuleComposer = ({ partnerName }: TimeCapsuleComposerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [step, setStep] = useState<'write' | 'date'>('write');
  const { createCapsule, isCreating } = useTimeCapsule();

  const handleSubmit = async () => {
    if (!message.trim() || !selectedDate) return;

    await createCapsule({ message: message.trim(), deliverAt: selectedDate });
    setMessage('');
    setSelectedDate(null);
    setStep('write');
    setIsOpen(false);
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prev => prev + prompt + ' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-pink-300/50 hover:border-pink-400 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Send a Time Capsule
                </h3>
                <p className="text-sm text-muted-foreground">
                  Write a love note for the future
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-5 h-5 text-pink-500" />
            Time Capsule for {partnerName}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'write' ? (
            <motion.div
              key="write"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Write a message that will be delivered to {partnerName} in the future. 
                It's like sending love through time! 💌
              </p>

              {/* Prompt suggestions */}
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder={`Dear ${partnerName}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px] resize-none"
                maxLength={2000}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{message.length}/2000 characters</span>
              </div>

              <Button
                onClick={() => setStep('date')}
                disabled={!message.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Choose Delivery Date
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('write')}
                className="mb-2"
              >
                ← Back to message
              </Button>

              <p className="text-sm text-muted-foreground">
                When should {partnerName} receive this message?
              </p>

              <div className="grid grid-cols-2 gap-2">
                {presetDates.map((preset) => {
                  const date = addDays(new Date(), preset.days);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30'
                          : 'border-border hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{preset.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{preset.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(date, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-950/40 dark:to-purple-950/40"
                >
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    {partnerName} will receive your message on:
                  </p>
                  <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </motion.div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || isCreating}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isCreating ? (
                  <>Sealing capsule...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Seal & Schedule
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
