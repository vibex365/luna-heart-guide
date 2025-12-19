import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type GameType = "this_or_that" | "would_you_rather" | "truth_or_dare" | "never_have_i_ever" | "conversation_starters";
type Difficulty = "regular" | "spicy" | "intimate";

interface GameQuestion {
  id: string;
  game_type: GameType;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  category: string;
  difficulty: Difficulty;
  depth: number;
  is_active: boolean;
  is_premium: boolean;
}

export const useGameQuestions = (gameType: GameType, difficulty?: Difficulty) => {
  return useQuery({
    queryKey: ["game-questions", gameType, difficulty],
    queryFn: async () => {
      let query = supabase
        .from("couples_game_questions")
        .select("*")
        .eq("game_type", gameType)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (difficulty) {
        query = query.eq("difficulty", difficulty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GameQuestion[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useAgeGateEnabled = () => {
  return useQuery({
    queryKey: ["age-gate-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("luna_config")
        .select("value")
        .eq("key", "couples_settings")
        .maybeSingle();

      if (error) throw error;
      const settings = data?.value as Record<string, unknown> | null;
      return settings?.ageGateEnabled === true;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export type { GameQuestion, GameType, Difficulty };
