import { motion } from "framer-motion";
import { Smile, Meh, Frown, Heart, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const getMoodIcon = (level: number) => {
  if (level >= 4) return <Smile className="w-5 h-5 text-green-500" />;
  if (level >= 3) return <Meh className="w-5 h-5 text-yellow-500" />;
  return <Frown className="w-5 h-5 text-red-500" />;
};

const getMoodColor = (level: number) => {
  if (level >= 4) return "bg-green-500/10 border-green-500/30";
  if (level >= 3) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
};

export const SharedMoodTracker = () => {
  const { user } = useAuth();
  const { sharedMoods, partnerId } = useCouplesAccount();

  const userMoods = sharedMoods.filter(m => m.user_id === user?.id);
  const partnerMoods = sharedMoods.filter(m => m.user_id === partnerId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Shared Mood Journal
        </CardTitle>
        <CardDescription>Track your moods together</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side by side mood comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Your Moods */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Your Moods</h4>
            <div className="space-y-2">
              {userMoods.slice(0, 5).map((mood, index) => (
                <motion.div
                  key={mood.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2 rounded-lg border ${getMoodColor(mood.mood_level)}`}
                >
                  <div className="flex items-center gap-2">
                    {getMoodIcon(mood.mood_level)}
                    <span className="text-xs font-medium truncate">{mood.mood_label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(mood.created_at), "MMM d")}
                  </p>
                  {mood.is_visible_to_partner ? (
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </motion.div>
              ))}
              {userMoods.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No moods shared yet
                </p>
              )}
            </div>
          </div>

          {/* Partner Moods */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Partner's Moods</h4>
            <div className="space-y-2">
              {partnerMoods.slice(0, 5).map((mood, index) => (
                <motion.div
                  key={mood.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2 rounded-lg border ${getMoodColor(mood.mood_level)}`}
                >
                  <div className="flex items-center gap-2">
                    {getMoodIcon(mood.mood_level)}
                    <span className="text-xs font-medium truncate">{mood.mood_label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(mood.created_at), "MMM d")}
                  </p>
                </motion.div>
              ))}
              {partnerMoods.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No moods from partner yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mood Sync Indicator */}
        {userMoods.length > 0 && partnerMoods.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-sm text-muted-foreground">
                {Math.abs((userMoods[0]?.mood_level || 0) - (partnerMoods[0]?.mood_level || 0)) <= 1
                  ? "You're in sync today! 💕"
                  : "Check in with each other today"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
