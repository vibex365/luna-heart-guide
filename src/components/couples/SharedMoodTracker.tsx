import { useState } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown, Heart, Eye, EyeOff, Plus, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

const moodOptions = [
  { level: 1, label: "Very Low", emoji: "😢" },
  { level: 2, label: "Low", emoji: "😔" },
  { level: 3, label: "Neutral", emoji: "😐" },
  { level: 4, label: "Good", emoji: "🙂" },
  { level: 5, label: "Great", emoji: "😊" },
];

export const SharedMoodTracker = () => {
  const { user } = useAuth();
  const { sharedMoods, partnerId, addSharedMood } = useCouplesAccount();
  const { toast } = useToast();
  
  const [showAddMood, setShowAddMood] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{ level: number; label: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userMoods = sharedMoods.filter(m => m.user_id === user?.id);
  const partnerMoods = sharedMoods.filter(m => m.user_id === partnerId && m.is_visible_to_partner);

  const handleSubmitMood = async () => {
    if (!selectedMood) return;
    
    setIsSubmitting(true);
    try {
      addSharedMood({
        mood_level: selectedMood.level,
        mood_label: selectedMood.label,
        notes: notes || undefined,
        is_visible_to_partner: isVisible,
      });
      
      toast({
        title: "Mood shared!",
        description: isVisible ? "Your partner can see your mood" : "Only you can see this mood",
      });
      
      setShowAddMood(false);
      setSelectedMood(null);
      setNotes("");
      setIsVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Shared Mood Journal
            </CardTitle>
            <CardDescription>Track your moods together</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddMood(!showAddMood)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Share Mood
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Mood Form */}
        {showAddMood && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border"
          >
            <div className="text-sm font-medium text-center mb-2">How are you feeling?</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {moodOptions.map((mood) => (
                <motion.button
                  key={mood.level}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood({ level: mood.level, label: mood.label })}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                    selectedMood?.level === mood.level
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium mt-1">{mood.label}</span>
                </motion.button>
              ))}
            </div>
            
            <Textarea
              placeholder="Add a note (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="visible"
                  checked={isVisible}
                  onCheckedChange={setIsVisible}
                />
                <Label htmlFor="visible" className="text-sm flex items-center gap-1">
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isVisible ? "Visible to partner" : "Private"}
                </Label>
              </div>
              <Button
                onClick={handleSubmitMood}
                disabled={!selectedMood || isSubmitting}
                size="sm"
                className="gap-1"
              >
                <Send className="w-4 h-4" />
                Share
              </Button>
            </div>
          </motion.div>
        )}

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
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mood.created_at), "MMM d")}
                    </p>
                    {mood.is_visible_to_partner ? (
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
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
