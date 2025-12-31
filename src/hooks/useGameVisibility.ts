import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GameVisibility {
  id: string;
  game_key: string;
  game_name: string;
  description: string | null;
  category: string;
  is_visible: boolean;
  sort_order: number;
}

export const useGameVisibility = () => {
  const { data: visibleGames, isLoading } = useQuery({
    queryKey: ['game-visibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_visibility')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as GameVisibility[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isGameVisible = (gameKey: string): boolean => {
    if (!visibleGames) return true; // Default to visible if loading
    return visibleGames.some(game => game.game_key === gameKey);
  };

  const getVisibleGameKeys = (): string[] => {
    return visibleGames?.map(game => game.game_key) || [];
  };

  return {
    visibleGames,
    isLoading,
    isGameVisible,
    getVisibleGameKeys,
  };
};

// Admin hook to manage all games
export const useGameVisibilityAdmin = () => {
  const { data: allGames, isLoading, refetch } = useQuery({
    queryKey: ['game-visibility-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_visibility')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as GameVisibility[];
    },
  });

  const toggleVisibility = async (gameId: string, isVisible: boolean) => {
    const { error } = await supabase
      .from('game_visibility')
      .update({ is_visible: isVisible })
      .eq('id', gameId);

    if (error) throw error;
    await refetch();
  };

  const updateSortOrder = async (gameId: string, sortOrder: number) => {
    const { error } = await supabase
      .from('game_visibility')
      .update({ sort_order: sortOrder })
      .eq('id', gameId);

    if (error) throw error;
    await refetch();
  };

  return {
    allGames,
    isLoading,
    toggleVisibility,
    updateSortOrder,
    refetch,
  };
};
