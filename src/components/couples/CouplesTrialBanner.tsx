import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface CouplesTrialBannerProps {
  daysLeft: number;
  hoursLeft: number;
  onUpgrade?: () => void;
}

export const CouplesTrialBanner = ({
  daysLeft,
  hoursLeft,
  onUpgrade,
}: CouplesTrialBannerProps) => {
  // Calculate progress (3-day trial = 72 hours)
  const totalHours = 72;
  const hoursUsed = totalHours - hoursLeft;
  const progress = Math.min((hoursUsed / totalHours) * 100, 100);

  const getTimeDisplay = () => {
    if (daysLeft > 1) return `${daysLeft} days left`;
    if (daysLeft === 1) return "1 day left";
    if (hoursLeft > 1) return `${hoursLeft} hours left`;
    return "Less than 1 hour left";
  };

  const isUrgent = daysLeft <= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${
        isUrgent
          ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30"
          : "bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isUrgent ? "bg-orange-500/20" : "bg-pink-500/20"
          }`}>
            {isUrgent ? (
              <Clock className="w-4 h-4 text-orange-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-pink-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isUrgent ? "⏰ Trial Ending Soon!" : "🎉 Couples Trial Active"}
            </p>
            <p className="text-xs text-muted-foreground">{getTimeDisplay()}</p>
          </div>
        </div>
        <Link to="/subscription">
          <Button
            size="sm"
            variant={isUrgent ? "default" : "outline"}
            className={isUrgent 
              ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              : "border-pink-500/50 text-pink-500 hover:bg-pink-500/10"
            }
            onClick={onUpgrade}
          >
            Upgrade
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress 
          value={progress} 
          className={`h-1.5 ${isUrgent ? "bg-orange-500/20" : "bg-pink-500/20"}`}
        />
        <p className="text-[10px] text-muted-foreground text-right">
          {Math.round(progress)}% of trial used
        </p>
      </div>
    </motion.div>
  );
};
