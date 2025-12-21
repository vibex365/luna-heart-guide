import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCouplesAccount } from './useCouplesAccount';
import { useVirtualCurrency } from './useVirtualCurrency';

interface JournalPrompt {
  id: string;
  prompt_text: string;
  category: string;
}

interface JournalEntry {
  id: string;
  partner_link_id: string;
  user_id: string;
  prompt_id: string | null;
  content: string;
  is_shared: boolean;
  entry_date: string;
  created_at: string;
}

export const useCouplesJournal = () => {
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const { earnCoins } = useVirtualCurrency();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Get today's prompt (rotate based on day of year)
  const { data: todaysPrompt, isLoading: isLoadingPrompt } = useQuery({
    queryKey: ['todays-journal-prompt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couples_journal_prompts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Rotate prompt based on day of year
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      return data[dayOfYear % data.length] as JournalPrompt;
    },
  });

  // Check if user has written today
  const { data: todaysEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['todays-journal-entry', user?.id, partnerLink?.id, today],
    queryFn: async () => {
      if (!user?.id || !partnerLink?.id) return null;

      const { data, error } = await supabase
        .from('couples_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('partner_link_id', partnerLink.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (error) throw error;
      return data as JournalEntry | null;
    },
    enabled: !!user?.id && !!partnerLink?.id,
  });

  // Get partner's entry for today
  const { data: partnerEntry } = useQuery({
    queryKey: ['partner-journal-entry', partnerLink?.id, user?.id, today],
    queryFn: async () => {
      if (!user?.id || !partnerLink?.id) return null;

      const partnerId =
        partnerLink.user_id === user.id ? partnerLink.partner_id : partnerLink.user_id;

      const { data, error } = await supabase
        .from('couples_journal_entries')
        .select('*')
        .eq('user_id', partnerId)
        .eq('partner_link_id', partnerLink.id)
        .eq('entry_date', today)
        .eq('is_shared', true)
        .maybeSingle();

      if (error) throw error;
      return data as JournalEntry | null;
    },
    enabled: !!user?.id && !!partnerLink?.id,
  });

  // Get recent entries
  const { data: recentEntries } = useQuery({
    queryKey: ['recent-journal-entries', partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink?.id) return [];

      const { data, error } = await supabase
        .from('couples_journal_entries')
        .select('*')
        .eq('partner_link_id', partnerLink.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as JournalEntry[];
    },
    enabled: !!partnerLink?.id,
  });

  // Submit entry mutation
  const submitEntryMutation = useMutation({
    mutationFn: async ({ content, isShared }: { content: string; isShared: boolean }) => {
      if (!user?.id || !partnerLink?.id || !todaysPrompt) {
        throw new Error('Missing required data');
      }

      const { data, error } = await supabase
        .from('couples_journal_entries')
        .insert({
          user_id: user.id,
          partner_link_id: partnerLink.id,
          prompt_id: todaysPrompt.id,
          content,
          is_shared: isShared,
          entry_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      // Award coins for journaling
      await earnCoins(10, 'journal', 'Daily journal entry');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['partner-journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['recent-journal-entries'] });
    },
  });

  const hasWrittenToday = !!todaysEntry;
  const partnerHasWritten = !!partnerEntry;
  const canReveal = hasWrittenToday && partnerHasWritten;

  return {
    todaysPrompt,
    todaysEntry,
    partnerEntry,
    recentEntries,
    hasWrittenToday,
    partnerHasWritten,
    canReveal,
    submitEntry: submitEntryMutation.mutateAsync,
    isSubmitting: submitEntryMutation.isPending,
    isLoading: isLoadingPrompt || isLoadingEntry,
  };
};
