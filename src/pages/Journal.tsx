import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Pencil, Trash2, X, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { JournalSkeleton } from "@/components/skeletons/PageSkeletons";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  mood_entry_id: string | null;
}

interface MoodEntry {
  id: string;
  mood_level: number;
  mood_label: string;
  created_at: string;
}

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

const Journal = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadEntries();
      loadRecentMoods();
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentMoods = async () => {
    try {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("id, mood_level, mood_label, created_at")
        .order("created_at", { ascending: false })
        .limit(7);

      if (error) throw error;
      setMoods(data || []);
    } catch (error) {
      console.error("Error loading moods:", error);
    }
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setTitle("");
    setContent("");
    setSelectedMoodId(null);
    setShowEditor(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title || "");
    setContent(entry.content);
    setSelectedMoodId(entry.mood_entry_id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    setSaving(true);
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("journal_entries")
          .update({
            title: title.trim() || null,
            content: content.trim(),
            mood_entry_id: selectedMoodId,
          })
          .eq("id", editingEntry.id);

        if (error) throw error;

        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id
              ? { ...e, title: title.trim() || null, content: content.trim(), mood_entry_id: selectedMoodId, updated_at: new Date().toISOString() }
              : e
          )
        );
        toast.success("Entry updated");
      } else {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            title: title.trim() || null,
            content: content.trim(),
            mood_entry_id: selectedMoodId,
          })
          .select()
          .single();

        if (error) throw error;

        setEntries((prev) => [data, ...prev]);
        toast.success("Entry saved");
      }

      setShowEditor(false);
      setEditingEntry(null);
      setTitle("");
      setContent("");
      setSelectedMoodId(null);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  const linkedMood = (moodId: string | null) => {
    if (!moodId) return null;
    return moods.find((m) => m.id === moodId);
  };

  if (authLoading || loading) {
    return (
      <MobileOnlyLayout>
        <JournalSkeleton />
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Journal</h1>
              <p className="text-sm text-muted-foreground">Your private reflections</p>
            </div>
            <Button onClick={openNewEntry} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {entries.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-soft border-border/50">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Your journal is empty</p>
                <Button onClick={openNewEntry} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Write Your First Entry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          entries.map((entry, index) => {
            const mood = linkedMood(entry.mood_entry_id);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-soft border-border/50 group hover:shadow-luna transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {mood && <span className="text-xl">{getMoodEmoji(mood.mood_level)}</span>}
                          {entry.title || "Untitled"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(entry.created_at), "EEEE, MMMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEntry(entry)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap line-clamp-4">{entry.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl shadow-luna w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  {editingEntry ? "Edit Entry" : "New Journal Entry"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Input
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />

                {moods.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Link to a mood (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {moods.map((mood) => (
                        <Button
                          key={mood.id}
                          variant={selectedMoodId === mood.id ? "default" : "outline"}
                          size="sm"
                          className={selectedMoodId === mood.id ? "bg-accent text-accent-foreground" : ""}
                          onClick={() => setSelectedMoodId(selectedMoodId === mood.id ? null : mood.id)}
                        >
                          <span className="mr-1">{getMoodEmoji(mood.mood_level)}</span>
                          {format(parseISO(mood.created_at), "MMM d")}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  placeholder="Write your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </MobileOnlyLayout>
  );
};

export default Journal;
