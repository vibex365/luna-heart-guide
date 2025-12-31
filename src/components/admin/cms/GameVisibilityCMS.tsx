import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useGameVisibilityAdmin } from "@/hooks/useGameVisibility";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  activities: "bg-blue-500/10 text-blue-500",
  card_games: "bg-purple-500/10 text-purple-500",
  quiz_games: "bg-green-500/10 text-green-500",
  deep_connection: "bg-pink-500/10 text-pink-500",
  intimate: "bg-red-500/10 text-red-500",
  connection: "bg-orange-500/10 text-orange-500",
  general: "bg-gray-500/10 text-gray-500",
};

export const GameVisibilityCMS = () => {
  const { allGames, isLoading, toggleVisibility } = useGameVisibilityAdmin();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (gameId: string, currentVisibility: boolean) => {
    setTogglingId(gameId);
    try {
      await toggleVisibility(gameId, !currentVisibility);
      toast.success(`Game ${!currentVisibility ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      toast.error("Failed to update game visibility");
      console.error(error);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const visibleCount = allGames?.filter(g => g.is_visible).length || 0;
  const totalCount = allGames?.length || 0;

  // Group games by category
  const gamesByCategory = allGames?.reduce((acc, game) => {
    const category = game.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {} as Record<string, typeof allGames>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-500" />
                Game Visibility
              </CardTitle>
              <CardDescription>
                Control which games are visible to users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{visibleCount} / {totalCount} visible</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(gamesByCategory || {}).map(([category, games]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base capitalize flex items-center gap-2">
              <Badge className={categoryColors[category] || categoryColors.general}>
                {category.replace('_', ' ')}
              </Badge>
              <span className="text-muted-foreground text-sm font-normal">
                ({games?.filter(g => g.is_visible).length}/{games?.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {games?.map((game) => (
              <div
                key={game.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  game.is_visible 
                    ? 'bg-background border-border' 
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  {game.is_visible ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className={`font-medium ${!game.is_visible && 'text-muted-foreground'}`}>
                      {game.game_name}
                    </p>
                    {game.description && (
                      <p className="text-xs text-muted-foreground">
                        {game.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {togglingId === game.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      checked={game.is_visible}
                      onCheckedChange={() => handleToggle(game.id, game.is_visible)}
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
