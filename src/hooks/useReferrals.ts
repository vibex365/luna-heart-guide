import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReferralPoints {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  total_referrals: number;
  successful_conversions: number;
  level: "starter" | "ambassador" | "champion" | "legend";
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: "pending" | "converted" | "expired";
  points_awarded: number;
  created_at: string;
  converted_at: string | null;
}

interface ReferralTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface ReferralRedemption {
  id: string;
  user_id: string;
  points_spent: number;
  reward_type: "free_month_pro" | "free_month_couples" | "bonus_coins";
  months_granted: number | null;
  subscription_extended_to: string | null;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  lifetime_earned: number;
  total_referrals: number;
  successful_conversions: number;
  level: string;
  current_streak: number;
  rank: number;
}

export interface RewardOption {
  id: string;
  type: "free_month_pro" | "free_month_couples" | "bonus_coins";
  name: string;
  description: string;
  pointsCost: number;
  icon: string;
}

export const REWARD_OPTIONS: RewardOption[] = [
  {
    id: "pro-month",
    type: "free_month_pro",
    name: "1 Month Luna Pro",
    description: "Get a free month of Luna Pro subscription",
    pointsCost: 300,
    icon: "⭐",
  },
  {
    id: "couples-month",
    type: "free_month_couples",
    name: "1 Month Couples",
    description: "Get a free month of Couples subscription",
    pointsCost: 450,
    icon: "💕",
  },
  {
    id: "coins-500",
    type: "bonus_coins",
    name: "500 Luna Coins",
    description: "Add 500 coins to your balance",
    pointsCost: 100,
    icon: "🪙",
  },
];

export const LEVEL_CONFIG = {
  starter: { name: "Starter", icon: "🌱", minReferrals: 0, color: "text-muted-foreground" },
  ambassador: { name: "Ambassador", icon: "⭐", minReferrals: 5, color: "text-yellow-500" },
  champion: { name: "Champion", icon: "🏆", minReferrals: 15, color: "text-orange-500" },
  legend: { name: "Legend", icon: "👑", minReferrals: 50, color: "text-purple-500" },
};

export const useReferrals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's referral code from profile
  const { data: profile } = useQuery({
    queryKey: ["profile-referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch referral points
  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ["referral-points", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("referral_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as ReferralPoints | null;
    },
    enabled: !!user?.id,
  });

  // Fetch user's referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user?.id,
  });

  // Fetch recent transactions
  const { data: transactions } = useQuery({
    queryKey: ["referral-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referral_point_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ReferralTransaction[];
    },
    enabled: !!user?.id,
  });

  // Fetch redemptions
  const { data: redemptions } = useQuery({
    queryKey: ["referral-redemptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referral_redemptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ReferralRedemption[];
    },
    enabled: !!user?.id,
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_leaderboard")
        .select("*")
        .limit(10);
      
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: !!user?.id,
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (reward: RewardOption) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("redeem-referral-reward", {
        body: {
          userId: user.id,
          rewardType: reward.type,
          pointsCost: reward.pointsCost,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Redemption failed");
      
      return data;
    },
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ["referral-points"] });
      queryClient.invalidateQueries({ queryKey: ["referral-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["referral-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["user-coins"] });
      
      toast({
        title: "Reward Redeemed! 🎉",
        description: `You've successfully redeemed ${reward.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate progress to next reward
  const getProgressToNextReward = () => {
    const balance = points?.balance || 0;
    const lowestReward = REWARD_OPTIONS.reduce((min, r) => 
      r.pointsCost < min.pointsCost ? r : min
    );
    return {
      current: balance,
      target: lowestReward.pointsCost,
      percentage: Math.min((balance / lowestReward.pointsCost) * 100, 100),
      reward: lowestReward,
    };
  };

  // Get next level info
  const getNextLevel = () => {
    const level = points?.level || "starter";
    const totalReferrals = points?.total_referrals || 0;
    
    const levels = ["starter", "ambassador", "champion", "legend"] as const;
    const currentIndex = levels.indexOf(level);
    
    if (currentIndex >= levels.length - 1) {
      return null; // Already at max level
    }
    
    const nextLevel = levels[currentIndex + 1];
    const nextLevelConfig = LEVEL_CONFIG[nextLevel];
    
    return {
      level: nextLevel,
      config: nextLevelConfig,
      referralsNeeded: nextLevelConfig.minReferrals - totalReferrals,
    };
  };

  // Generate shareable referral link
  const getReferralLink = () => {
    const code = profile?.referral_code;
    if (!code) return null;
    return `${window.location.origin}/auth?ref=${code}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (!link) return false;
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied! 📋",
        description: "Share it with your friends to earn points!",
      });
      return true;
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    const link = getReferralLink();
    if (!link) return false;
    
    const shareData = {
      title: "Join Luna - Your AI Wellness Companion",
      text: "I've been using Luna for my mental wellness journey. Try it out!",
      url: link,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return true;
      } else {
        return copyReferralLink();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        return copyReferralLink();
      }
      return false;
    }
  };

  const canAfford = (reward: RewardOption) => {
    return (points?.balance || 0) >= reward.pointsCost;
  };

  // Get user's rank in leaderboard
  const getUserRank = () => {
    if (!leaderboard || !user?.id) return null;
    const entry = leaderboard.find(e => e.user_id === user.id);
    return entry?.rank || null;
  };

  return {
    // Data
    referralCode: profile?.referral_code || null,
    displayName: profile?.display_name || null,
    points: points || null,
    balance: points?.balance || 0,
    lifetimeEarned: points?.lifetime_earned || 0,
    level: points?.level || "starter",
    levelConfig: LEVEL_CONFIG[points?.level || "starter"],
    referrals: referrals || [],
    transactions: transactions || [],
    redemptions: redemptions || [],
    leaderboard: leaderboard || [],
    userRank: getUserRank(),
    
    // Loading states
    isLoading: pointsLoading || referralsLoading,
    
    // Computed values
    progressToNextReward: getProgressToNextReward(),
    nextLevel: getNextLevel(),
    referralLink: getReferralLink(),
    
    // Actions
    copyReferralLink,
    shareReferralLink,
    redeemReward: redeemMutation.mutate,
    isRedeeming: redeemMutation.isPending,
    canAfford,
    
    // Refresh
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-points"] });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["referral-leaderboard"] });
    },
  };
};
