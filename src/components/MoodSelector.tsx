import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MoodOption {
  level: number;
  label: string;
  emoji: string;
  color: string;
}

const moods: MoodOption[] = [
  { level: 1, label: "Very Low", emoji: "😢", color: "bg-destructive/20 border-destructive/40" },
  { level: 2, label: "Low", emoji: "😔", color: "bg-secondary border-secondary" },
  { level: 3, label: "Neutral", emoji: "😐", color: "bg-muted border-border" },
  { level: 4, label: "Good", emoji: "🙂", color: "bg-primary border-primary" },
  { level: 5, label: "Great", emoji: "😊", color: "bg-peach border-peach" },
];

interface MoodSelectorProps {
  selected: { level: number; label: string } | null;
  onSelect: (mood: { level: number; label: string }) => void;
}

const MoodSelector = ({ selected, onSelect }: MoodSelectorProps) => {
  return (
    <div className="flex gap-2 justify-center">
      {moods.map((mood) => (
        <motion.button
          key={mood.level}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect({ level: mood.level, label: mood.label })}
          className={cn(
            "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
            mood.color,
            selected?.level === mood.level
              ? "ring-2 ring-accent ring-offset-2"
              : "hover:shadow-soft"
          )}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="text-xs font-medium text-foreground mt-1">{mood.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MoodSelector;
