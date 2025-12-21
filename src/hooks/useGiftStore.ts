import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useVirtualCurrency } from "./useVirtualCurrency";

// Convert cents to coin value
export const getCoinPrice = (priceCents: number): number => {
  return Math.ceil(priceCents / 2);
};

export interface DigitalGift {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  price_cents: number;
  icon: string;
  animation_type: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

export interface PartnerGift {
  id: string;
  partner_link_id: string;
  sender_id: string;
  recipient_id: string;
  gift_id: string;
  message: string | null;
  is_opened: boolean;
  opened_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  digital_gifts?: DigitalGift;
}

export const useGiftStore = (partnerLinkId?: string, partnerId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { spendCoins } = useVirtualCurrency();

  // Fetch available gifts
  const { data: gifts = [], isLoading: giftsLoading } = useQuery({
    queryKey: ['digital-gifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_gifts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as DigitalGift[];
    },
  });

  // Fetch received gifts
  const { data: receivedGifts = [], isLoading: receivedLoading, refetch: refetchReceived } = useQuery({
    queryKey: ['received-gifts', partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId || !user) return [];
      
      const { data, error } = await supabase
        .from('partner_gifts')
        .select(`
          *,
          digital_gifts (*)
        `)
        .eq('partner_link_id', partnerLinkId)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PartnerGift[];
    },
    enabled: !!partnerLinkId && !!user,
  });

  // Fetch sent gifts
  const { data: sentGifts = [], isLoading: sentLoading } = useQuery({
    queryKey: ['sent-gifts', partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId || !user) return [];
      
      const { data, error } = await supabase
        .from('partner_gifts')
        .select(`
          *,
          digital_gifts (*)
        `)
        .eq('partner_link_id', partnerLinkId)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PartnerGift[];
    },
    enabled: !!partnerLinkId && !!user,
  });

  // Get unopened gifts count
  const unopenedGiftsCount = receivedGifts.filter(g => !g.is_opened).length;

  // Purchase and send gift
  const sendGiftMutation = useMutation({
    mutationFn: async ({ giftId, message }: { giftId: string; message?: string }) => {
      if (!partnerLinkId || !partnerId || !user) {
        throw new Error("Missing required data");
      }

      const { data, error } = await supabase.functions.invoke('create-gift-payment', {
        body: {
          giftId,
          recipientId: partnerId,
          partnerLinkId,
          message,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to process gift: ${error.message}`);
    },
  });

  // Send gift with coins (no Stripe)
  const sendGiftWithCoinsMutation = useMutation({
    mutationFn: async ({ giftId, message }: { giftId: string; message?: string }) => {
      if (!partnerLinkId || !partnerId || !user) {
        throw new Error("Missing required data");
      }

      // Get the gift to find the coin price
      const gift = gifts.find(g => g.id === giftId);
      if (!gift) throw new Error("Gift not found");

      const coinPrice = getCoinPrice(gift.price_cents);

      // Spend coins first
      await spendCoins(coinPrice, 'gift_purchase', `Sent ${gift.name}`);

      // Record the gift in the database
      const { data, error } = await supabase
        .from('partner_gifts')
        .insert({
          partner_link_id: partnerLinkId,
          sender_id: user.id,
          recipient_id: partnerId,
          gift_id: giftId,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Gift sent with coins! 🎁");
      queryClient.invalidateQueries({ queryKey: ['sent-gifts'] });
      queryClient.invalidateQueries({ queryKey: ['user-coins'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send gift: ${error.message}`);
    },
  });

  // Mark gift as opened
  const openGiftMutation = useMutation({
    mutationFn: async (giftId: string) => {
      const { error } = await supabase
        .from('partner_gifts')
        .update({ is_opened: true, opened_at: new Date().toISOString() })
        .eq('id', giftId)
        .eq('recipient_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-gifts'] });
    },
  });

  // Subscribe to new gifts
  const subscribeToGifts = (onNewGift: (gift: PartnerGift) => void) => {
    if (!partnerLinkId || !user) return null;

    const channel = supabase
      .channel(`gifts-${partnerLinkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_gifts',
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        async (payload) => {
          if (payload.new.recipient_id === user.id) {
            // Fetch full gift details
            const { data } = await supabase
              .from('partner_gifts')
              .select(`*, digital_gifts (*)`)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              onNewGift(data as PartnerGift);
              refetchReceived();
            }
          }
        }
      )
      .subscribe();

    return channel;
  };

  return {
    gifts,
    giftsLoading,
    receivedGifts,
    sentGifts,
    receivedLoading,
    sentLoading,
    unopenedGiftsCount,
    sendGift: sendGiftMutation.mutate,
    sendGiftWithCoins: sendGiftWithCoinsMutation.mutate,
    isSending: sendGiftMutation.isPending || sendGiftWithCoinsMutation.isPending,
    openGift: openGiftMutation.mutate,
    subscribeToGifts,
    refetchReceived,
  };
};
