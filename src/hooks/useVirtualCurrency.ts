import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
}

interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export const useVirtualCurrency = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's coin balance
  const { data: coinBalance, isLoading } = useQuery({
    queryKey: ['user-coins', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserCoins | null;
    },
    enabled: !!user?.id,
  });

  // Get recent transactions
  const { data: transactions } = useQuery({
    queryKey: ['coin-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as CoinTransaction[];
    },
    enabled: !!user?.id,
  });

  // Earn coins mutation
  const earnCoinsMutation = useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
      referenceId,
    }: {
      amount: number;
      type: string;
      description?: string;
      referenceId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get or create coin balance
      let { data: existingBalance } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingBalance) {
        const { data: newBalance, error: createError } = await supabase
          .from('user_coins')
          .insert({
            user_id: user.id,
            balance: amount,
            lifetime_earned: amount,
          })
          .select()
          .single();

        if (createError) throw createError;
        existingBalance = newBalance;
      } else {
        const { error: updateError } = await supabase
          .from('user_coins')
          .update({
            balance: existingBalance.balance + amount,
            lifetime_earned: existingBalance.lifetime_earned + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      // Record transaction
      const { error: txError } = await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: type,
        description,
        reference_id: referenceId,
      });

      if (txError) throw txError;

      return { newBalance: (existingBalance?.balance || 0) + amount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-coins'] });
      queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
    },
  });

  // Spend coins mutation
  const spendCoinsMutation = useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
      referenceId,
    }: {
      amount: number;
      type: string;
      description?: string;
      referenceId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: currentBalance } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!currentBalance || currentBalance.balance < amount) {
        throw new Error('Insufficient coins');
      }

      const { error: updateError } = await supabase
        .from('user_coins')
        .update({
          balance: currentBalance.balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction (negative amount)
      const { error: txError } = await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: type,
        description,
        reference_id: referenceId,
      });

      if (txError) throw txError;

      return { newBalance: currentBalance.balance - amount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-coins'] });
      queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
    },
  });

  const earnCoins = async (amount: number, type: string, description?: string, referenceId?: string) => {
    return earnCoinsMutation.mutateAsync({ amount, type, description, referenceId });
  };

  const spendCoins = async (amount: number, type: string, description?: string, referenceId?: string) => {
    return spendCoinsMutation.mutateAsync({ amount, type, description, referenceId });
  };

  const canAfford = (amount: number) => (coinBalance?.balance || 0) >= amount;

  return {
    balance: coinBalance?.balance || 0,
    lifetimeEarned: coinBalance?.lifetime_earned || 0,
    transactions,
    isLoading,
    earnCoins,
    spendCoins,
    canAfford,
    isEarning: earnCoinsMutation.isPending,
    isSpending: spendCoinsMutation.isPending,
  };
};
