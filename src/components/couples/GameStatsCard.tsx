import { motion } from "framer-motion";
import { Trophy, Flame, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface GameStatsCardProps {
  partnerLinkId?: string;
}

interface GameStats {
  game_type: string;
  total_games: number;
  total_matches: number;
  avg_score: number;
}

export const GameStatsCard = ({ partnerLinkId }: GameStatsCardProps) => {
  const { data: stats = [] } = useQuery({
    queryKey: ["all-game-stats", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];

      const { data, error } = await supabase
        .from("couples_game_history")
        .select("game_type, score, matches, total_questions, completed_at")
        .eq("partner_link_id", partnerLinkId)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Aggregate stats by game type
      const gameStats: Record<string, { games: number; matches: number; totalScore: number }> = {};
      
      data.forEach((game) => {
        if (!gameStats[game.game_type]) {
          gameStats[game.game_type] = { games: 0, matches: 0, totalScore: 0 };
        }
        gameStats[game.game_type].games++;
        gameStats[game.game_type].matches += game.matches || 0;
        gameStats[game.game_type].totalScore += game.score || 0;
      });

      return Object.entries(gameStats).map(([type, stats]) => ({
        game_type: type,
        total_games: stats.games,
        total_matches: stats.matches,
        avg_score: Math.round(stats.totalScore / stats.games),
      })) as GameStats[];
    },
    enabled: !!partnerLinkId,
  });

  const { data: recentGames = [] } = useQuery({
    queryKey: ["recent-games", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];

      const { data, error } = await supabase
        .from("couples_game_history")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!partnerLinkId,
  });

  const totalGames = stats.reduce((acc, s) => acc + s.total_games, 0);
  const totalMatches = stats.reduce((acc, s) => acc + s.total_matches, 0);

  const gameTypeLabels: Record<string, string> = {
    would_you_rather: "Would You Rather",
    truth_or_dare: "Truth or Dare",
    never_have_i_ever: "Never Have I Ever",
    quiz: "Quiz",
    conversation_starters: "Conversations",
  };

  if (totalGames === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Game Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-yellow-500/10 text-center"
          >
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalGames}</p>
            <p className="text-xs text-muted-foreground">Games Played</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-pink-500/10 text-center"
          >
            <Flame className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalMatches}</p>
            <p className="text-xs text-muted-foreground">Total Matches</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-green-500/10 text-center"
          >
            <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">
              {totalGames > 0 ? Math.round((totalMatches / totalGames) * 10) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Sync Rate</p>
          </motion.div>
        </div>

        {/* Per-game stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">By Game</h4>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.game_type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <span className="text-sm font-medium">
                {gameTypeLabels[stat.game_type] || stat.game_type}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{stat.total_games} games</span>
                <span>{stat.total_matches} matches</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent activity */}
        {recentGames.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Recent Games
            </h4>
            {recentGames.slice(0, 3).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {gameTypeLabels[game.game_type] || game.game_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(game.completed_at), "MMM d, h:mm a")}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
