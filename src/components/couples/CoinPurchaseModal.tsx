import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoinBundle {
  id: string;
  coins: number;
  price: string;
  icon: React.ReactNode;
  popular?: boolean;
  bonus?: string;
}

const bundles: CoinBundle[] = [
  { id: 'small', coins: 100, price: '$2.49', icon: <Coins className="h-6 w-6" /> },
  { id: 'medium', coins: 500, price: '$9.99', icon: <Sparkles className="h-6 w-6" />, popular: true, bonus: '+50 bonus' },
  { id: 'large', coins: 1000, price: '$18.99', icon: <Crown className="h-6 w-6" />, bonus: '+150 bonus' },
];

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoinPurchaseModal = ({ isOpen, onClose }: CoinPurchaseModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (bundleId: string) => {
    setLoading(bundleId);
    try {
      const { data, error } = await supabase.functions.invoke('create-coin-purchase', {
        body: { bundleId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error('Failed to start purchase');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Coins className="h-5 w-5 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold">Get Coins</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Use coins to send gifts, unlock premium content, and more!
            </p>

            <div className="space-y-3">
              {bundles.map((bundle) => (
                <motion.button
                  key={bundle.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(bundle.id)}
                  disabled={loading !== null}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    bundle.popular
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-border hover:border-primary/50'
                  } ${loading === bundle.id ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${bundle.popular ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
                      {bundle.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{bundle.coins} Coins</span>
                        {bundle.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 font-bold">
                            BEST VALUE
                          </span>
                        )}
                      </div>
                      {bundle.bonus && (
                        <span className="text-xs text-green-500">{bundle.bonus}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading === bundle.id ? (
                      <Zap className="h-4 w-4 animate-pulse" />
                    ) : (
                      <span className="font-bold text-primary">{bundle.price}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-4">
              Secure payment powered by Stripe. Coins are non-refundable.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
