import { useVirtualCurrency } from '@/hooks/useVirtualCurrency';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const CoinBalance = () => {
  const navigate = useNavigate();
  const { balance, lifetimeEarned, transactions, isLoading } = useVirtualCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 animate-pulse">
        <Coins className="h-4 w-4" />
        <span className="font-bold">...</span>
      </div>
    );
  }

  const transactionIcons: Record<string, string> = {
    daily_question: '❓',
    challenge: '🎯',
    streak: '🔥',
    game: '🎮',
    gift_purchase: '🎁',
    login_bonus: '✨',
    purchase: '💰',
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
        >
          <motion.div
            key={balance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Coins className="h-4 w-4" />
          </motion.div>
          <motion.span
            key={balance}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-bold"
          >
            {balance}
          </motion.span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-4 border-b bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
                <Coins className="h-5 w-5" />
                {balance}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="h-3 w-3" />
                Lifetime
              </p>
              <p className="text-sm font-semibold text-muted-foreground">{lifetimeEarned}</p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">Recent Activity</p>
          <ScrollArea className="h-48">
            {transactions && transactions.length > 0 ? (
              <div className="space-y-1">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{transactionIcons[tx.transaction_type] || '💫'}</span>
                      <div>
                        <p className="text-xs font-medium">
                          {tx.description || tx.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No transactions yet. Start earning coins!
              </p>
            )}
          </ScrollArea>
        </div>

        <div className="p-3 border-t bg-muted/30 space-y-2">
          <Button 
            onClick={() => navigate('/coins')} 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Buy Coins
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Earn coins by answering questions, completing challenges, and maintaining streaks!
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
