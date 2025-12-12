import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MoodEntry {
  id: string;
  mood_level: number;
  mood_label: string;
  notes: string | null;
  created_at: string;
}

interface MoodHistoryProps {
  entries: MoodEntry[];
  onDelete: (id: string) => void;
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

const MoodHistory = ({ entries, onDelete }: MoodHistoryProps) => {
  if (entries.length === 0) {
    return (
      <Card className="shadow-soft border-border/50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No mood entries yet. Start tracking today!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.slice(0, 10).map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group"
          >
            <div className="text-2xl">{getMoodEmoji(entry.mood_level)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{entry.mood_label}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(entry.created_at), "MMM d, h:mm a")}
                </span>
              </div>
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{entry.notes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;
