import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCouplesAccount } from './useCouplesAccount';
import { useVirtualCurrency } from './useVirtualCurrency';

interface DailyQuestion {
  id: string;
  question_text: string;
  category: string;
  difficulty: string;
}

interface DailyQuestionAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  answered_at: string;
  question_date: string;
}

export const useDailyQuestion = () => {
  const { user } = useAuth();
  const { partnerLink, partnerId } = useCouplesAccount();
  const { earnCoins } = useVirtualCurrency();
  const queryClient = useQueryClient();

  // Get today's question (use a deterministic selection based on date)
  const { data: todaysQuestion, isLoading: isLoadingQuestion } = useQuery({
    queryKey: ['daily-question', new Date().toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Use day of year to pick question
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      return data[dayOfYear % data.length] as DailyQuestion;
    },
  });

  // Get today's answers for both partners
  const { data: todaysAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['daily-question-answers', partnerLink?.id, new Date().toDateString()],
    queryFn: async () => {
      if (!partnerLink?.id || !todaysQuestion?.id) return [];

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_question_answers')
        .select('*')
        .eq('partner_link_id', partnerLink.id)
        .eq('question_id', todaysQuestion.id)
        .eq('question_date', today);

      if (error) throw error;
      return (data || []) as DailyQuestionAnswer[];
    },
    enabled: !!partnerLink?.id && !!todaysQuestion?.id,
  });

  const myAnswer = todaysAnswers?.find((a) => a.user_id === user?.id);
  const partnerAnswer = todaysAnswers?.find((a) => a.user_id === partnerId);
  const hasAnswered = !!myAnswer;
  const partnerHasAnswered = !!partnerAnswer;
  const bothAnswered = hasAnswered && partnerHasAnswered;

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answerText: string) => {
      if (!user?.id || !partnerLink?.id || !todaysQuestion?.id) {
        throw new Error('Missing required data');
      }

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_question_answers')
        .insert({
          partner_link_id: partnerLink.id,
          question_id: todaysQuestion.id,
          user_id: user.id,
          answer_text: answerText,
          question_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      // Award coins for answering - wrapped in try/catch to not break the main flow
      try {
        await earnCoins(5, 'daily_question', 'Answered daily question');
      } catch (coinError) {
        console.error('Failed to award coins:', coinError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-question-answers'] });
      queryClient.invalidateQueries({ queryKey: ['user-coins'] });
      queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
    },
  });

  return {
    todaysQuestion,
    todaysAnswers,
    myAnswer,
    partnerAnswer,
    hasAnswered,
    partnerHasAnswered,
    bothAnswered,
    isLoading: isLoadingQuestion || isLoadingAnswers,
    submitAnswer: submitAnswerMutation.mutateAsync,
    isSubmitting: submitAnswerMutation.isPending,
  };
};
