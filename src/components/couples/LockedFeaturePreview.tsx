import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LockedFeaturePreviewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  previewContent?: React.ReactNode;
  onStartTrial?: () => void;
  onUpgrade?: () => void;
  canStartTrial?: boolean;
  isStartingTrial?: boolean;
}

export const LockedFeaturePreview = ({
  title,
  description,
  icon,
  previewContent,
  onStartTrial,
  onUpgrade,
  canStartTrial = true,
  isStartingTrial = false,
}: LockedFeaturePreviewProps) => {
  return (
    <Card className="relative overflow-hidden border-dashed border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
      <CardContent className="p-4">
        {/* Preview content (blurred) */}
        {previewContent && (
          <div className="relative mb-4 rounded-lg overflow-hidden">
            <div className="blur-sm opacity-50 pointer-events-none">
              {previewContent}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="p-3 rounded-full bg-background/80 border border-border">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Feature info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {title}
              <Lock className="w-3 h-3 text-muted-foreground" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          {canStartTrial ? (
            <Button
              onClick={onStartTrial}
              disabled={isStartingTrial}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {isStartingTrial ? "Starting..." : "Try Free for 3 Days"}
            </Button>
          ) : (
            <Button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              size="sm"
            >
              Upgrade to Unlock
            </Button>
          )}
        </div>
      </CardContent>

      {/* Decorative elements */}
      <motion.div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </Card>
  );
};
