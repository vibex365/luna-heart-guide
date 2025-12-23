import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Gift, Trophy, Users, Zap, TrendingUp, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { useReferrals, REWARD_OPTIONS, LEVEL_CONFIG, RewardOption } from "@/hooks/useReferrals";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfetti } from "@/hooks/useConfetti";

const Referrals = () => {
  const navigate = useNavigate();
  const { fireConfetti } = useConfetti();
  const [selectedReward, setSelectedReward] = useState<RewardOption | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  
  const {
    referralCode,
    balance,
    lifetimeEarned,
    level,
    levelConfig,
    referrals,
    transactions,
    leaderboard,
    userRank,
    isLoading,
    progressToNextReward,
    nextLevel,
    referralLink,
    copyReferralLink,
    shareReferralLink,
    redeemReward,
    isRedeeming,
    canAfford,
  } = useReferrals();

  const handleRedeem = (reward: RewardOption) => {
    setSelectedReward(reward);
    setShowRedeemDialog(true);
  };

  const confirmRedeem = () => {
    if (!selectedReward) return;
    redeemReward(selectedReward, {
      onSuccess: () => {
        setShowRedeemDialog(false);
        setSelectedReward(null);
        fireConfetti();
      },
    });
  };

  if (isLoading) {
    return (
      <MobileOnlyLayout>
        <div className="min-h-screen bg-background p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading font-bold text-lg">Referrals</h1>
              <p className="text-xs text-muted-foreground">Earn rewards by sharing Luna</p>
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 space-y-6">
          {/* Points Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-primary/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{levelConfig.icon}</span>
                  <Badge variant="outline" className={levelConfig.color}>
                    {levelConfig.name}
                  </Badge>
                </div>
                {userRank && (
                  <Badge variant="secondary" className="text-xs">
                    #{userRank} on leaderboard
                  </Badge>
                )}
              </div>
              
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">Your Points</p>
                <p className="text-5xl font-bold text-primary">{balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lifetimeEarned.toLocaleString()} lifetime earned
                </p>
              </div>

              {/* Progress to next reward */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to {progressToNextReward.reward.name}</span>
                  <span>{progressToNextReward.current}/{progressToNextReward.target}</span>
                </div>
                <Progress value={progressToNextReward.percentage} className="h-2" />
              </div>

              {/* Next level */}
              {nextLevel && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    {nextLevel.referralsNeeded} more referrals to become{" "}
                    <span className={nextLevel.config.color}>
                      {nextLevel.config.icon} {nextLevel.config.name}
                    </span>
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Your Referral Code</span>
                </div>
              </div>
              
              <div className="bg-muted rounded-xl p-4 mb-4 text-center">
                <p className="text-2xl font-mono font-bold tracking-wider text-foreground">
                  {referralCode || "Loading..."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={copyReferralLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="peach"
                  className="h-12"
                  onClick={shareReferralLink}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* How it works */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">How it works</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                    <span>Share your link with friends</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                    <span>Earn 25 points when they sign up</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                    <span>Earn 100+ bonus points when they subscribe!</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tabs for Rewards, Activity, Leaderboard */}
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rewards" className="text-xs">
                <Gift className="h-3 w-3 mr-1" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Leaders
              </TabsTrigger>
            </TabsList>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="mt-4 space-y-3">
              {REWARD_OPTIONS.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{reward.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-sm font-bold text-primary">
                            {reward.pointsCost} points
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={canAfford(reward) ? "peach" : "outline"}
                        disabled={!canAfford(reward)}
                        onClick={() => handleRedeem(reward)}
                      >
                        {canAfford(reward) ? "Redeem" : "Locked"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              {transactions.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start sharing your referral link to earn points!
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <Card key={tx.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {tx.description || tx.transaction_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <span className={`font-bold ${tx.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Referrals list */}
              {referrals.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Your Referrals</h3>
                  <div className="space-y-2">
                    {referrals.map((ref) => (
                      <Card key={ref.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm">Referred user</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(ref.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge variant={ref.status === "converted" ? "default" : "secondary"}>
                            {ref.status === "converted" ? (
                              <><Check className="h-3 w-3 mr-1" /> Converted</>
                            ) : (
                              "Pending"
                            )}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-4">
              {leaderboard.length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Leaderboard is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be the first to refer friends!
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <Card 
                      key={entry.user_id} 
                      className={`p-3 ${entry.user_id === userRank?.toString() ? "border-primary" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : entry.rank}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{entry.display_name}</p>
                            <span className="text-xs">
                              {LEVEL_CONFIG[entry.level as keyof typeof LEVEL_CONFIG]?.icon}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {entry.total_referrals} referrals
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{entry.lifetime_earned}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedReward?.icon}</span>
              Redeem Reward
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem {selectedReward?.name} for {selectedReward?.pointsCost} points?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRedeemDialog(false)}
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button
              variant="peach"
              className="flex-1"
              onClick={confirmRedeem}
              disabled={isRedeeming}
            >
              {isRedeeming ? "Redeeming..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileOnlyLayout>
  );
};

export default Referrals;
