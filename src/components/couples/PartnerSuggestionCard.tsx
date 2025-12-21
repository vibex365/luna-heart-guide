import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useVirtualCurrency } from '@/hooks/useVirtualCurrency';
import { useToast } from '@/hooks/use-toast';

interface PartnerSuggestion {
  id: string;
  suggestion_type: string;
  suggestion_text: string;
  action_hint: string | null;
  is_read: boolean;
  created_at: string;
}

interface PartnerSuggestionCardProps {
  suggestion: PartnerSuggestion;
  onDismiss: (id: string) => void;
  onActed: (id: string) => void;
}

export function PartnerSuggestionCard({ suggestion, onDismiss, onActed }: PartnerSuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const { earnCoins } = useVirtualCurrency();
  const { toast } = useToast();

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const { error } = await supabase
        .from('partner_suggestions')
        .update({ is_dismissed: true })
        .eq('id', suggestion.id);

      if (error) throw error;
      onDismiss(suggestion.id);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast({
        title: "Error",
        description: "Couldn't dismiss suggestion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDismissing(false);
    }
  };

  const handleActed = async () => {
    setIsActing(true);
    try {
      const { error } = await supabase
        .from('partner_suggestions')
        .update({ is_acted_on: true, is_dismissed: true })
        .eq('id', suggestion.id);

      if (error) throw error;

      // Award coins
      await earnCoins(5, 'suggestion_acted', 'Acted on partner suggestion');

      toast({
        title: "Amazing! +5 coins 🪙",
        description: "Thank you for nurturing your relationship! 💜"
      });

      onActed(suggestion.id);
    } catch (error) {
      console.error('Error marking suggestion as acted:', error);
      toast({
        title: "Error",
        description: "Couldn't update suggestion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsActing(false);
    }
  };

  // Mark as read when first viewed
  const markAsRead = async () => {
    if (!suggestion.is_read) {
      await supabase
        .from('partner_suggestions')
        .update({ is_read: true })
        .eq('id', suggestion.id);
    }
  };

  useState(() => {
    markAsRead();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 overflow-hidden">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Suggestion for you</h3>
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">Based on your partner's reflection</p>
            </div>
          </div>

          {/* Suggestion Text */}
          <p className="text-foreground leading-relaxed mb-3">
            {suggestion.suggestion_text}
          </p>

          {/* Action Hint (expandable) */}
          <AnimatePresence>
            {suggestion.action_hint && (
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">💡 Tip: </span>
                    {suggestion.action_hint}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {suggestion.action_hint && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-primary hover:underline mb-3 block"
            >
              Show tip →
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isDismissing}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleActed}
              disabled={isActing}
              className="ml-auto bg-primary hover:bg-primary/90"
            >
              <Check className="h-4 w-4 mr-1" />
              I did this! +5🪙
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
