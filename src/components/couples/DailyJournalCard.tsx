import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Send, Eye, EyeOff, Sparkles, Lock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCouplesJournal } from '@/hooks/useCouplesJournal';
import { toast } from 'sonner';

interface DailyJournalCardProps {
  partnerName?: string;
}

export const DailyJournalCard = ({ partnerName = 'Partner' }: DailyJournalCardProps) => {
  const {
    todaysPrompt,
    todaysEntry,
    partnerEntry,
    hasWrittenToday,
    partnerHasWritten,
    canReveal,
    submitEntry,
    isSubmitting,
    isLoading,
  } = useCouplesJournal();

  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [showPartnerEntry, setShowPartnerEntry] = useState(false);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  if (!todaysPrompt) return null;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please write something first');
      return;
    }

    try {
      await submitEntry({ content: content.trim(), isShared });
      toast.success('Journal entry saved! +10 coins 💰');
      setContent('');
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-amber-500" />
          Daily Journal
          {hasWrittenToday && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
              <Check className="h-3 w-3" /> Written
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Prompt */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-muted-foreground mb-1">Today's Prompt</p>
          <p className="font-medium">{todaysPrompt.prompt_text}</p>
        </div>

        {!hasWrittenToday ? (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[120px] resize-none bg-background/50"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="share-entry"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
                <Label htmlFor="share-entry" className="text-sm flex items-center gap-1">
                  {isShared ? (
                    <>
                      <Eye className="h-3 w-3" /> Share with {partnerName}
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" /> Keep private
                    </>
                  )}
                </Label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isSubmitting ? (
                  <Sparkles className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {/* Your entry */}
            <div className="p-3 rounded-xl bg-background/50 border">
              <p className="text-xs text-muted-foreground mb-1">Your Entry</p>
              <p className="text-sm">{todaysEntry?.content}</p>
            </div>

            {/* Partner's entry */}
            {canReveal ? (
              <AnimatePresence mode="wait">
                {showPartnerEntry ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{partnerName}'s Entry</p>
                    <p className="text-sm">{partnerEntry?.content}</p>
                  </motion.div>
                ) : (
                  <motion.div key="hidden">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowPartnerEntry(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal {partnerName}'s Entry
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : partnerHasWritten ? (
              <div className="text-center text-sm text-muted-foreground">
                {partnerName} has also written today! 💕
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Lock className="h-4 w-4" />
                Waiting for {partnerName} to write...
              </div>
            )}
          </div>
        )}

        {/* Coin reward info */}
        {!hasWrittenToday && (
          <p className="text-[10px] text-center text-muted-foreground">
            💰 Earn 10 coins for your daily journal entry
          </p>
        )}
      </CardContent>
    </Card>
  );
};
