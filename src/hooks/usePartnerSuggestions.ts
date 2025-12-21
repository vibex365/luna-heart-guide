import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PartnerSuggestion {
  id: string;
  partner_link_id: string;
  for_user_id: string;
  from_user_id: string;
  suggestion_type: string;
  suggestion_text: string;
  action_hint: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  is_acted_on: boolean;
  expires_at: string;
  created_at: string;
}

export function usePartnerSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, refetch } = useQuery({
    queryKey: ['partner-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('partner_suggestions')
        .select('*')
        .eq('for_user_id', user.id)
        .eq('is_dismissed', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Error fetching partner suggestions:', error);
        return [];
      }

      return data as PartnerSuggestion[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['partner-suggestions-unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('partner_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('for_user_id', user.id)
        .eq('is_dismissed', false)
        .eq('is_read', false)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  const dismissSuggestion = (id: string) => {
    queryClient.setQueryData(['partner-suggestions', user?.id], (old: PartnerSuggestion[] | undefined) => 
      old?.filter(s => s.id !== id) || []
    );
    queryClient.invalidateQueries({ queryKey: ['partner-suggestions-unread'] });
  };

  const actOnSuggestion = (id: string) => {
    queryClient.setQueryData(['partner-suggestions', user?.id], (old: PartnerSuggestion[] | undefined) => 
      old?.filter(s => s.id !== id) || []
    );
    queryClient.invalidateQueries({ queryKey: ['partner-suggestions-unread'] });
  };

  // Subscribe to realtime updates for new suggestions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('partner-suggestions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_suggestions',
          filter: `for_user_id=eq.${user.id}`,
        },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['partner-suggestions-unread'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch, queryClient]);

  return {
    suggestions: suggestions || [],
    unreadCount: unreadCount || 0,
    isLoading,
    dismissSuggestion,
    actOnSuggestion,
    refetch
  };
}
