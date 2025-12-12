import { motion } from "framer-motion";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AmbientSound {
  id: string;
  name: string;
  icon: string;
}

interface AmbientSoundPlayerProps {
  sounds: AmbientSound[];
  currentSound: string | null;
  volume: number;
  isLoading: boolean;
  onToggleSound: (soundId: string) => void;
  onVolumeChange: (volume: number) => void;
}

const AmbientSoundPlayer = ({
  sounds,
  currentSound,
  volume,
  isLoading,
  onToggleSound,
  onVolumeChange,
}: AmbientSoundPlayerProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {currentSound ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
        <span>Ambient Sounds</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sounds.map((sound) => {
          const isActive = currentSound === sound.id;
          const isCurrentLoading = isLoading && isActive;

          return (
            <motion.button
              key={sound.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleSound(sound.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                isActive
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border hover:border-accent/50"
              )}
              disabled={isCurrentLoading}
            >
              {isCurrentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-lg">{sound.icon}</span>
              )}
              <span className="text-sm font-medium">{sound.name}</span>
            </motion.button>
          );
        })}
      </div>

      {currentSound && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3"
        >
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={([val]) => onVolumeChange(val / 100)}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}
    </div>
  );
};

export default AmbientSoundPlayer;
