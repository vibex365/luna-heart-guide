import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCouplesAccount } from '@/hooks/useCouplesAccount';
import { toast } from 'sonner';

interface TimeCapsule {
  id: string;
  sender_id: string;
  recipient_id: string;
  partner_link_id: string;
  message: string;
  voice_url?: string;
  video_url?: string;
  deliver_at: string;
  is_delivered: boolean;
  delivered_at?: string;
  is_opened: boolean;
  opened_at?: string;
  created_at: string;
}

export const useTimeCapsule = () => {
  const { user } = useAuth();
  const { partnerLink, partnerId } = useCouplesAccount();
  const queryClient = useQueryClient();

  // Fetch sent capsules (pending + delivered)
  const { data: sentCapsules = [], isLoading: sentLoading } = useQuery({
    queryKey: ['time-capsules-sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_capsule_messages')
        .select('*')
        .eq('sender_id', user!.id)
        .order('deliver_at', { ascending: true });
      
      if (error) throw error;
      return data as TimeCapsule[];
    },
    enabled: !!user,
  });

  // Fetch received delivered capsules
  const { data: receivedCapsules = [], isLoading: receivedLoading } = useQuery({
    queryKey: ['time-capsules-received', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_capsule_messages')
        .select('*')
        .eq('recipient_id', user!.id)
        .eq('is_delivered', true)
        .order('delivered_at', { ascending: false });
      
      if (error) throw error;
      return data as TimeCapsule[];
    },
    enabled: !!user,
  });

  // Count unopened received capsules
  const unopenedCount = receivedCapsules.filter(c => !c.is_opened).length;

  // Create a new time capsule
  const createCapsuleMutation = useMutation({
    mutationFn: async ({ message, deliverAt }: { message: string; deliverAt: Date }) => {
      if (!user || !partnerId || !partnerLink?.id) {
        throw new Error('Not linked to a partner');
      }

      const { data, error } = await supabase
        .from('time_capsule_messages')
        .insert({
          sender_id: user.id,
          recipient_id: partnerId,
          partner_link_id: partnerLink.id,
          message,
          deliver_at: deliverAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('💌 Time capsule scheduled!');
      queryClient.invalidateQueries({ queryKey: ['time-capsules-sent'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create time capsule');
    },
  });

  // Open a received capsule
  const openCapsuleMutation = useMutation({
    mutationFn: async (capsuleId: string) => {
      const { error } = await supabase
        .from('time_capsule_messages')
        .update({
          is_opened: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', capsuleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-capsules-received'] });
    },
  });

  // Delete a pending capsule
  const deleteCapsuleMutation = useMutation({
    mutationFn: async (capsuleId: string) => {
      const { error } = await supabase
        .from('time_capsule_messages')
        .delete()
        .eq('id', capsuleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Time capsule deleted');
      queryClient.invalidateQueries({ queryKey: ['time-capsules-sent'] });
    },
  });

  // Subscribe to new delivered capsules
  const subscribeToDeliveries = (onNewCapsule: (capsule: TimeCapsule) => void) => {
    if (!user) return () => {};

    const channel = supabase
      .channel('time-capsule-deliveries')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'time_capsule_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const capsule = payload.new as TimeCapsule;
          if (capsule.is_delivered && !payload.old?.is_delivered) {
            onNewCapsule(capsule);
            queryClient.invalidateQueries({ queryKey: ['time-capsules-received'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    sentCapsules,
    receivedCapsules,
    unopenedCount,
    pendingCapsules: sentCapsules.filter(c => !c.is_delivered),
    deliveredSentCapsules: sentCapsules.filter(c => c.is_delivered),
    isLoading: sentLoading || receivedLoading,
    createCapsule: createCapsuleMutation.mutateAsync,
    isCreating: createCapsuleMutation.isPending,
    openCapsule: openCapsuleMutation.mutateAsync,
    deleteCapsule: deleteCapsuleMutation.mutateAsync,
    subscribeToDeliveries,
  };
};
