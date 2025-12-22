import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Crown, Zap, ArrowLeft, Gift, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useVirtualCurrency } from '@/hooks/useVirtualCurrency';

interface CoinBundle {
  id: string;
  coins: number;
  price: string;
  priceValue: number;
  icon: React.ReactNode;
  popular?: boolean;
  bonus?: number;
  savings?: string;
}

const bundles: CoinBundle[] = [
  { id: 'small', coins: 100, price: '$2.49', priceValue: 249, icon: <Coins className="h-8 w-8" /> },
  { id: 'medium', coins: 500, price: '$9.99', priceValue: 999, icon: <Sparkles className="h-8 w-8" />, popular: true, bonus: 50, savings: '20%' },
  { id: 'large', coins: 1000, price: '$18.99', priceValue: 1899, icon: <Crown className="h-8 w-8" />, bonus: 150, savings: '25%' },
];

const CoinPurchase = () => {
  const navigate = useNavigate();
  const { balance } = useVirtualCurrency();
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Get Coins</h1>
          <div className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1.5 rounded-full">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-yellow-500">{balance}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6 pb-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 py-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30">
            <Coins className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Love Coins</h2>
          <p className="text-muted-foreground">
            Use coins to send special gifts, unlock premium features, and show your love!
          </p>
        </motion.div>

        {/* What You Can Do */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              What you can do with coins
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="h-4 w-4 text-pink-500" />
                <span>Send gifts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingBag className="h-4 w-4 text-purple-500" />
                <span>Unlock content</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Special effects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Premium items</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coin Bundles */}
        <div className="space-y-3">
          <h3 className="font-semibold">Choose a bundle</h3>
          
          {bundles.map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                  bundle.popular 
                    ? 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePurchase(bundle.id)}
              >
                <CardContent className="p-0">
                  {bundle.popular && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 py-1 px-4 text-center">
                      <span className="text-xs font-bold text-white">MOST POPULAR</span>
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        bundle.popular 
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {bundle.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{bundle.coins}</span>
                          <Coins className="h-5 w-5 text-yellow-500" />
                          {bundle.bonus && (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                              +{bundle.bonus} bonus
                            </Badge>
                          )}
                        </div>
                        {bundle.savings && (
                          <span className="text-sm text-green-500">Save {bundle.savings}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant={bundle.popular ? "default" : "outline"}
                      disabled={loading !== null}
                      className={bundle.popular ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-0' : ''}
                    >
                      {loading === bundle.id ? (
                        <Zap className="h-4 w-4 animate-pulse" />
                      ) : (
                        bundle.price
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Note */}
        <p className="text-xs text-muted-foreground text-center pt-4">
          🔒 Secure payment powered by Stripe. Coins are non-refundable.
        </p>
      </div>
    </div>
  );
};

export default CoinPurchase;
