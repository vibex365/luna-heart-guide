import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Star, Clock, CheckCircle2, RefreshCw, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DateNightIdea {
  title: string;
  description: string;
  category: string;
  duration: string;
  preparation: string;
}

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  is_favorite: boolean;
  is_completed: boolean;
  rating?: number;
}

const categoryColors: Record<string, string> = {
  romantic: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
  adventure: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  cozy: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  creative: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  foodie: "bg-green-500/20 text-green-600 dark:text-green-400",
  outdoor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

const categoryIcons: Record<string, string> = {
  romantic: "💕",
  adventure: "🎢",
  cozy: "🛋️",
  creative: "🎨",
  foodie: "🍽️",
  outdoor: "🌿",
};

const moodOptions = [
  { value: "romantic", label: "💕 Romantic" },
  { value: "adventurous", label: "🎢 Adventurous" },
  { value: "relaxed", label: "😌 Relaxed" },
  { value: "playful", label: "🎮 Playful" },
  { value: "creative", label: "🎨 Creative" },
];

interface DateNightGeneratorProps {
  partnerLinkId?: string;
}

export const DateNightGenerator = ({ partnerLinkId }: DateNightGeneratorProps) => {
  const queryClient = useQueryClient();
  const [generatedIdeas, setGeneratedIdeas] = useState<DateNightIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [preferences, setPreferences] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);

  // Fetch saved/favorite ideas
  const { data: savedIdeas } = useQuery({
    queryKey: ["date-night-ideas", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return [];
      const { data, error } = await supabase
        .from("date_night_ideas")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedIdea[];
    },
    enabled: !!partnerLinkId,
  });

  const favorites = savedIdeas?.filter((i) => i.is_favorite) ?? [];

  // Save idea mutation
  const saveIdeaMutation = useMutation({
    mutationFn: async (idea: DateNightIdea) => {
      if (!partnerLinkId) throw new Error("No partner link");
      const { error } = await supabase.from("date_night_ideas").insert({
        partner_link_id: partnerLinkId,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        is_favorite: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-night-ideas"] });
      toast.success("Date night idea saved!");
    },
    onError: () => {
      toast.error("Failed to save idea");
    },
  });

  const generateIdeas = async () => {
    if (!partnerLinkId) {
      toast.error("Link with a partner first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-date-night", {
        body: {
          preferences: preferences || undefined,
          favorites: favorites.map((f) => f.title),
          mood: selectedMood || undefined,
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedIdeas(data.ideas || []);
    } catch (e) {
      console.error("Generate error:", e);
      toast.error("Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          Date Night Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Selection */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">What's the vibe tonight?</p>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant={selectedMood === mood.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMood(mood.value === selectedMood ? "" : mood.value)}
                className="text-xs"
              >
                {mood.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Preferences Toggle */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
            className="text-xs text-muted-foreground"
          >
            <Plus className="w-3 h-3 mr-1" />
            {showPreferences ? "Hide preferences" : "Add preferences"}
          </Button>
          <AnimatePresence>
            {showPreferences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Textarea
                  placeholder="E.g., budget-friendly, no cooking, something new..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="mt-2 text-sm"
                  rows={2}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateIdeas}
          disabled={isGenerating || !partnerLinkId}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating ideas...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Date Night Ideas
            </>
          )}
        </Button>

        {/* Generated Ideas */}
        <AnimatePresence mode="wait">
          {generatedIdeas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Your Ideas</h4>
                <Button variant="ghost" size="sm" onClick={generateIdeas} disabled={isGenerating}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {generatedIdeas.map((idea, index) => (
                <motion.div
                  key={idea.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border bg-card/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryIcons[idea.category] || "✨"}</span>
                        <h5 className="font-medium text-sm">{idea.title}</h5>
                      </div>
                      <Badge className={`text-xs ${categoryColors[idea.category] || "bg-muted"}`}>
                        {idea.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => saveIdeaMutation.mutate(idea)}
                      disabled={saveIdeaMutation.isPending}
                    >
                      <Heart className="w-4 h-4 text-pink-500" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">{idea.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {idea.duration}
                    </span>
                  </div>

                  <div className="text-xs">
                    <span className="font-medium">Prep: </span>
                    <span className="text-muted-foreground">{idea.preparation}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Favorites */}
        {favorites.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Saved Ideas ({favorites.length})
            </h4>
            <div className="space-y-2">
              {favorites.slice(0, 3).map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span>{categoryIcons[idea.category] || "✨"}</span>
                    <span className="text-sm">{idea.title}</span>
                  </div>
                  {idea.is_completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!partnerLinkId && (
          <p className="text-xs text-center text-muted-foreground">
            Link with a partner to generate date night ideas!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
