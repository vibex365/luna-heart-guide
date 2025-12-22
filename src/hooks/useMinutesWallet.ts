import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserMinutes {
  id: string;
  user_id: string;
  minutes_balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  created_at: string;
  updated_at: string;
}

export interface MinutePackage {
  id: string;
  name: string;
  description: string | null;
  minutes: number;
  price_cents: number;
  stripe_price_id: string | null;
  savings_percent: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface MinuteTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  package_id: string | null;
  voice_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export const useMinutesWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's minutes balance
  const { data: minutesData, isLoading: isLoadingMinutes } = useQuery({
    queryKey: ['user-minutes', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_minutes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserMinutes | null;
    },
    enabled: !!user?.id
  });

  // Fetch available packages
  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['minute-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minute_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as MinutePackage[];
    }
  });

  // Fetch recent transactions
  const { data: transactions } = useQuery({
    queryKey: ['minute-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('minute_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as MinuteTransaction[];
    },
    enabled: !!user?.id
  });

  // Purchase minutes mutation
  const purchaseMinutesMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await supabase.functions.invoke('purchase-minutes', {
        body: { packageId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Refresh minutes after purchase
  const refreshMinutes = () => {
    queryClient.invalidateQueries({ queryKey: ['user-minutes', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['minute-transactions', user?.id] });
  };

  return {
    balance: minutesData?.minutes_balance || 0,
    lifetimePurchased: minutesData?.lifetime_purchased || 0,
    lifetimeUsed: minutesData?.lifetime_used || 0,
    isLoading: isLoadingMinutes,
    packages: packages || [],
    isLoadingPackages,
    transactions: transactions || [],
    purchaseMinutes: purchaseMinutesMutation.mutate,
    isPurchasing: purchaseMinutesMutation.isPending,
    refreshMinutes,
    hasMinutes: (minutesData?.minutes_balance || 0) > 0
  };
};
