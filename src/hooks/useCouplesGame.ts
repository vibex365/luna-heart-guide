import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { notifyPartner } from "@/utils/smsNotifications";

export type GameType = 
  | "would_you_rather" 
  | "truth_or_dare" 
  | "never_have_i_ever" 
  | "quiz" 
  | "conversation_starters";

interface GameSession {
  id: string;
  partner_link_id: string;
  game_type: string;
  current_card_index: number;
  game_state: Json;
  started_by: string;
  created_at: string;
  updated_at: string;
}

interface GameHistory {
  id: string;
  partner_link_id: string;
  game_type: string;
  score: number | null;
  matches: number | null;
  total_questions: number | null;
  played_by: string;
  partner_played: boolean | null;
  completed_at: string;
  details: Json;
}

// Helper to safely convert Json to Record
const jsonToRecord = (json: Json | null | undefined): Record<string, unknown> => {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
};

export const useCouplesGame = (partnerLinkId: string | undefined, gameType: GameType) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localGameState, setLocalGameState] = useState<Record<string, unknown>>({});

  // Fetch current game session
  const { data: gameSession, isLoading } = useQuery({
    queryKey: ["game-session", partnerLinkId, gameType],
    queryFn: async () => {
      if (!partnerLinkId) return null;

      const { data, error } = await supabase
        .from("couples_game_sessions")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", gameType)
        .maybeSingle();

      if (error) throw error;
      return data as GameSession | null;
    },
    enabled: !!partnerLinkId && !!user,
  });

  // Fetch game history/stats
  const { data: gameHistory = [] } = useQuery({
    queryKey: ["game-history", partnerLinkId, gameType],
    queryFn: async () => {
      if (!partnerLinkId) return [];

      const { data, error } = await supabase
        .from("couples_game_history")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", gameType)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as GameHistory[];
    },
    enabled: !!partnerLinkId && !!user,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!partnerLinkId || !gameType || !user) return;

    const channel = supabase
      .channel(`game-${partnerLinkId}-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples_game_sessions",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as GameSession).game_type === gameType) {
            const session = payload.new as GameSession;
            queryClient.invalidateQueries({ 
              queryKey: ["game-session", partnerLinkId, gameType] 
            });
            setLocalGameState(jsonToRecord(session.game_state));
            
            // Show toast when partner joins/updates the game
            if (session.started_by !== user.id) {
              toast({
                title: "Partner joined! 🎮",
                description: `Your partner is playing ${gameType.replace(/_/g, " ")} with you!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, gameType, queryClient, user, toast]);

  // Sync local state with session state
  useEffect(() => {
    if (gameSession?.game_state) {
      setLocalGameState(jsonToRecord(gameSession.game_state));
    }
  }, [gameSession]);

  // Start or join a game session
  const startGameMutation = useMutation({
    mutationFn: async (initialState: Record<string, unknown> = {}) => {
      if (!partnerLinkId || !user) throw new Error("Not connected");

      // Check for existing session
      const { data: existing } = await supabase
        .from("couples_game_sessions")
        .select("id")
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", gameType)
        .maybeSingle();

      if (existing) {
        // Update existing session
        const { data, error } = await supabase
          .from("couples_game_sessions")
          .update({
            game_state: initialState as Json,
            current_card_index: 0,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return { data, isNew: false };
      }

      // Create new session
      const { data, error } = await supabase
        .from("couples_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          game_type: gameType,
          game_state: initialState as Json,
          started_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, isNew: true };
    },
    onSuccess: async ({ isNew }) => {
      queryClient.invalidateQueries({ queryKey: ["game-session", partnerLinkId, gameType] });
      
      // Notify partner when a NEW game is started
      if (isNew && partnerLinkId && user) {
        try {
          // Get partner ID and user's display name
          const { data: partnerLink } = await supabase
            .from("partner_links")
            .select("user_id, partner_id")
            .eq("id", partnerLinkId)
            .single();
          
          if (partnerLink) {
            const partnerId = partnerLink.user_id === user.id 
              ? partnerLink.partner_id 
              : partnerLink.user_id;
            
            if (partnerId) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("user_id", user.id)
                .single();
              
              const userName = profile?.display_name || "Your partner";
              const gameLabel = gameType.replace(/_/g, " ");
              
              notifyPartner.gameStarted(partnerId, userName, gameLabel);
            }
          }
        } catch (err) {
          console.error("Failed to notify partner:", err);
        }
      }
    },
  });

  // Update game state (shared between partners)
  const updateGameStateMutation = useMutation({
    mutationFn: async (newState: Record<string, unknown>) => {
      if (!gameSession) throw new Error("No active session");

      const currentState = jsonToRecord(gameSession.game_state);
      const mergedState = { ...currentState, ...newState };

      const { data, error } = await supabase
        .from("couples_game_sessions")
        .update({
          game_state: mergedState as Json,
        })
        .eq("id", gameSession.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLocalGameState(jsonToRecord(data.game_state));
      queryClient.invalidateQueries({ queryKey: ["game-session", partnerLinkId, gameType] });
    },
  });

  // Update card index
  const updateCardIndexMutation = useMutation({
    mutationFn: async (newIndex: number) => {
      if (!gameSession) throw new Error("No active session");

      const { data, error } = await supabase
        .from("couples_game_sessions")
        .update({
          current_card_index: newIndex,
          game_state: {} as Json, // Reset state for new card
        })
        .eq("id", gameSession.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLocalGameState({});
      queryClient.invalidateQueries({ queryKey: ["game-session", partnerLinkId, gameType] });
    },
  });

  // Save game result
  const saveGameResultMutation = useMutation({
    mutationFn: async (result: {
      score?: number;
      matches?: number;
      total_questions?: number;
      details?: Record<string, unknown>;
    }) => {
      if (!partnerLinkId || !user) throw new Error("Not connected");

      const { data, error } = await supabase
        .from("couples_game_history")
        .insert({
          partner_link_id: partnerLinkId,
          game_type: gameType,
          score: result.score || 0,
          matches: result.matches || 0,
          total_questions: result.total_questions || 0,
          played_by: user.id,
          details: (result.details || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-history", partnerLinkId, gameType] });
      toast({
        title: "Game saved!",
        description: "Your game has been recorded.",
      });
    },
  });

  // Calculate stats from history
  const stats = {
    totalGamesPlayed: gameHistory.length,
    totalMatches: gameHistory.reduce((acc, g) => acc + (g.matches || 0), 0),
    averageScore: gameHistory.length > 0 
      ? Math.round(gameHistory.reduce((acc, g) => acc + (g.score || 0), 0) / gameHistory.length)
      : 0,
    lastPlayed: gameHistory[0]?.completed_at || null,
  };

  return {
    gameSession,
    gameHistory,
    localGameState,
    isLoading,
    stats,
    startGame: startGameMutation.mutate,
    updateGameState: updateGameStateMutation.mutate,
    updateCardIndex: updateCardIndexMutation.mutate,
    saveGameResult: saveGameResultMutation.mutate,
    isStarting: startGameMutation.isPending,
    isUpdating: updateGameStateMutation.isPending,
  };
};
