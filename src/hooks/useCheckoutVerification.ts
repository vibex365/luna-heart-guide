import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to verify checkout sessions and credit purchases after Stripe redirect
 * Call this on pages that receive checkout redirects (couples, luna-voice, etc.)
 */
export const useCheckoutVerification = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const verifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const verifyCheckout = async () => {
      if (!user) return;

      // Check for coins purchase
      const coinsPurchased = searchParams.get('coins_purchased');
      if (coinsPurchased) {
        // Clear the param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('coins_purchased');
        setSearchParams(newParams, { replace: true });

        toast({
          title: "Coins Added! 🪙",
          description: `${coinsPurchased} coins have been added to your account.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['user-coins'] });
        queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
        return;
      }

      // Check for minutes purchase
      const purchaseSuccess = searchParams.get('purchase');
      const packageId = searchParams.get('package');
      if (purchaseSuccess === 'success' && packageId) {
        // Clear the params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('purchase');
        newParams.delete('package');
        setSearchParams(newParams, { replace: true });

        toast({
          title: "Minutes Added! ⏱️",
          description: "Your Luna Voice minutes have been added to your account.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['user-minutes'] });
        queryClient.invalidateQueries({ queryKey: ['minute-transactions'] });
        return;
      }

      // Check for subscription checkout success
      const checkoutStatus = searchParams.get('checkout');
      if (checkoutStatus === 'success') {
        // Clear the param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('checkout');
        setSearchParams(newParams, { replace: true });

        // Refresh subscription status
        try {
          await supabase.functions.invoke('check-subscription');
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          
          toast({
            title: "Subscription Active! 🎉",
            description: "Your subscription has been activated.",
          });
        } catch (error) {
          console.error('Error verifying subscription:', error);
        }
      }
    };

    verifyCheckout();
  }, [user, searchParams, setSearchParams, toast, queryClient]);

  return null;
};