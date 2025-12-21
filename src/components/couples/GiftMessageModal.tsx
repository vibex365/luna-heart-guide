import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Heart, Coins, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DigitalGift } from "@/hooks/useGiftStore";
import { useVirtualCurrency } from "@/hooks/useVirtualCurrency";
import { getCoinPrice } from "./GiftCard";
import { toast } from "sonner";

interface GiftMessageModalProps {
  gift: DigitalGift;
  partnerName: string;
  isSending: boolean;
  onSend: (message?: string, payWithCoins?: boolean) => void;
  onClose: () => void;
}

export const GiftMessageModal = ({
  gift,
  partnerName,
  isSending,
  onSend,
  onClose,
}: GiftMessageModalProps) => {
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'coins'>('money');
  const { balance, canAfford } = useVirtualCurrency();

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const coinPrice = getCoinPrice(gift.price_cents);
  const hasEnoughCoins = canAfford(coinPrice);

  const handleSend = () => {
    if (paymentMethod === 'coins' && !hasEnoughCoins) {
      toast.error("You don't have enough coins!");
      return;
    }
    onSend(message || undefined, paymentMethod === 'coins');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-rose-500/20 to-pink-500/20 p-6 text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <motion.span 
            className="text-6xl inline-block"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {gift.icon}
          </motion.span>

          <h3 className="font-bold text-xl text-foreground mt-3">{gift.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">{gift.description}</p>
        </div>

        {/* Payment Method Selection */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-3">Choose payment method</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('money')}
              className={`p-3 rounded-xl border-2 transition-all ${
                paymentMethod === 'money'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === 'money' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-semibold">{formatPrice(gift.price_cents)}</p>
              <p className="text-xs text-muted-foreground">Card</p>
            </button>
            <button
              onClick={() => setPaymentMethod('coins')}
              disabled={!hasEnoughCoins}
              className={`p-3 rounded-xl border-2 transition-all ${
                paymentMethod === 'coins'
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : hasEnoughCoins
                    ? 'border-border hover:border-yellow-500/50'
                    : 'border-border opacity-50 cursor-not-allowed'
              }`}
            >
              <Coins className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === 'coins' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-semibold">{coinPrice} coins</p>
              <p className="text-xs text-muted-foreground">
                {hasEnoughCoins ? `Balance: ${balance}` : `Need ${coinPrice - balance} more`}
              </p>
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Add a personal message (optional)
            </label>
            <Textarea
              placeholder={`Write something sweet for ${partnerName}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {message.length}/200
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 ${paymentMethod === 'coins' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                  </motion.div>
                  Sending...
                </>
              ) : (
                <>
                  {paymentMethod === 'coins' ? (
                    <Coins className="w-4 h-4 mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Gift
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {paymentMethod === 'coins' 
              ? 'Gift will be sent instantly using your coins'
              : "You'll be redirected to complete the payment"
            }
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};