import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, TrendingUp, Calendar, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MoodChart from "@/components/MoodChart";
import MoodSelector from "@/components/MoodSelector";
import MoodHistory from "@/components/MoodHistory";
import ReminderSettings from "@/components/ReminderSettings";
import StreakWidget from "@/components/StreakWidget";

interface MoodEntry {
  id: string;
  mood_level: number;
  mood_label: string;
  notes: string | null;
  created_at: string;
}

const MoodTracker = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogger, setShowLogger] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{ level: number; label: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadEntries();
      loadReminderSettings();
    }
  }, [user]);

  const loadReminderSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("reminder_enabled, reminder_time")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setReminderEnabled(data.reminder_enabled || false);
      setReminderTime(data.reminder_time?.slice(0, 5) || "09:00");
    }
  };

  const handleReminderUpdate = (enabled: boolean, time: string) => {
    setReminderEnabled(enabled);
    setReminderTime(time);
  };

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading mood entries:", error);
      toast.error("Failed to load mood history");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .insert({
          user_id: user.id,
          mood_level: selectedMood.level,
          mood_label: selectedMood.label,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setEntries((prev) => [data, ...prev]);
      setShowLogger(false);
      setSelectedMood(null);
      setNotes("");
      toast.success("Mood logged successfully!");
    } catch (error) {
      console.error("Error saving mood:", error);
      toast.error("Failed to save mood entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("mood_entries").delete().eq("id", id);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  const todayEntry = entries.find((e) => {
    const entryDate = new Date(e.created_at).toDateString();
    return entryDate === new Date().toDateString();
  });

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">Mood Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your emotional journey</p>
          </div>
          <StreakWidget />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Mood Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-accent" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEntry ? (
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {getMoodEmoji(todayEntry.mood_level)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{todayEntry.mood_label}</p>
                    {todayEntry.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{todayEntry.notes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLogger(true)}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Today's Mood
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mood Logger Modal */}
        <AnimatePresence>
          {showLogger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowLogger(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl shadow-luna p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-accent" />
                  How are you feeling?
                </h2>

                <MoodSelector
                  selected={selectedMood}
                  onSelect={setSelectedMood}
                />

                <Textarea
                  placeholder="Add a note about your mood (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-4 resize-none"
                  rows={3}
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowLogger(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleSaveMood}
                    disabled={!selectedMood || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood Chart */}
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Mood Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MoodChart entries={entries} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mood History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MoodHistory entries={entries} onDelete={handleDeleteEntry} />
        </motion.div>

        {/* Reminder Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ReminderSettings
            reminderEnabled={reminderEnabled}
            reminderTime={reminderTime}
            onUpdate={handleReminderUpdate}
          />
        </motion.div>
      </main>
    </div>
  );
};

const getMoodEmoji = (level: number) => {
  const emojis: Record<number, string> = {
    1: "😢",
    2: "😔",
    3: "😐",
    4: "🙂",
    5: "😊",
  };
  return emojis[level] || "😐";
};

export default MoodTracker;
