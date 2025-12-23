import { useNavigate } from "react-router-dom";
import { Gift, Copy, Share2, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReferrals, LEVEL_CONFIG } from "@/hooks/useReferrals";
import { useAuth } from "@/contexts/AuthContext";

export const ReferralWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    referralCode,
    balance,
    level,
    levelConfig,
    progressToNextReward,
    copyReferralLink,
    shareReferralLink,
    isLoading,
  } = useReferrals();

  if (!user || isLoading) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 rounded-3xl p-6 shadow-luna border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Referral Program</h3>
            <p className="text-xs text-muted-foreground">
              Earn free months by inviting friends
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl">{levelConfig.icon}</span>
        </div>
      </div>

      {/* Points Balance */}
      <div className="bg-background/60 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Your Points</span>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-lg font-bold text-primary">{balance}</span>
          </div>
        </div>
        <Progress value={progressToNextReward.percentage} className="h-2 mb-1" />
        <p className="text-xs text-muted-foreground">
          {progressToNextReward.target - progressToNextReward.current} more to {progressToNextReward.reward.name}
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-muted rounded-xl p-3 mb-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Your Code</p>
        <p className="text-lg font-mono font-bold tracking-wider text-foreground">
          {referralCode || "---"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={copyReferralLink}
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copy
        </Button>
        <Button
          variant="peach"
          size="sm"
          className="h-10"
          onClick={shareReferralLink}
        >
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Share
        </Button>
      </div>

      {/* View Full Dashboard */}
      <Button
        variant="ghost"
        className="w-full justify-between text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/referrals")}
      >
        <span className="text-sm">View Rewards & Leaderboard</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
