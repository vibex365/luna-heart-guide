import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/pages/admin/AdminSubscriptions";
import { StatCard } from "@/components/admin/StatCard";
import { Users, CreditCard, TrendingUp, DollarSign } from "lucide-react";

interface SubscriptionStatsProps {
  tiers: SubscriptionTier[];
}

export const SubscriptionStats = ({ tiers }: SubscriptionStatsProps) => {
  // Fetch subscription counts per tier
  const { data: subscriptionCounts = {} } = useQuery({
    queryKey: ["admin-subscription-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("tier_id, status");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((sub) => {
        if (sub.status === "active") {
          counts[sub.tier_id] = (counts[sub.tier_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Calculate MRR
  const mrr = tiers.reduce((total, tier) => {
    const count = subscriptionCounts[tier.id] || 0;
    return total + (count * tier.price_monthly);
  }, 0);

  const totalSubscribers = Object.values(subscriptionCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const paidSubscribers = tiers
    .filter((t) => t.price_monthly > 0)
    .reduce((sum, tier) => sum + (subscriptionCounts[tier.id] || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Subscribers"
        value={totalSubscribers}
        icon={Users}
        subtitle="Active subscriptions"
      />
      <StatCard
        title="Paid Subscribers"
        value={paidSubscribers}
        icon={CreditCard}
        subtitle="Pro & Couples plans"
      />
      <StatCard
        title="Monthly Revenue"
        value={`$${mrr.toFixed(2)}`}
        icon={DollarSign}
        subtitle="MRR"
      />
      <StatCard
        title="Conversion Rate"
        value={totalSubscribers > 0 ? `${((paidSubscribers / totalSubscribers) * 100).toFixed(1)}%` : "0%"}
        icon={TrendingUp}
        subtitle="Free to paid"
      />
    </div>
  );
};
