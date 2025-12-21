import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RelationshipTip {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string | null;
}

export const useDailyTip = () => {
  const { data: todaysTip, isLoading } = useQuery({
    queryKey: ['daily-tip', new Date().toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_tips')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Use day of year to pick tip
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      return data[dayOfYear % data.length] as RelationshipTip;
    },
  });

  const { data: allTips } = useQuery({
    queryKey: ['all-tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_tips')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as RelationshipTip[];
    },
  });

  return {
    todaysTip,
    allTips,
    isLoading,
  };
};
