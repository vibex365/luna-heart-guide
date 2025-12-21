import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const CoinAnalytics = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-coin-stats"],
    queryFn: async () => {
      // Get total coins in circulation
      const { data: coinData } = await supabase
        .from("user_coins")
        .select("balance, lifetime_earned");

      const totalBalance = coinData?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
      const totalEarned = coinData?.reduce((sum, u) => sum + (u.lifetime_earned || 0), 0) || 0;
      const totalSpent = totalEarned - totalBalance;
      const usersWithCoins = coinData?.length || 0;

      // Get recent transactions
      const { data: recentTx } = await supabase
        .from("coin_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // Get transaction breakdown by type
      const { data: txByType } = await supabase
        .from("coin_transactions")
        .select("transaction_type, amount");

      const breakdown: Record<string, { earned: number; spent: number }> = {};
      txByType?.forEach((tx) => {
        if (!breakdown[tx.transaction_type]) {
          breakdown[tx.transaction_type] = { earned: 0, spent: 0 };
        }
        if (tx.amount > 0) {
          breakdown[tx.transaction_type].earned += tx.amount;
        } else {
          breakdown[tx.transaction_type].spent += Math.abs(tx.amount);
        }
      });

      return {
        totalBalance,
        totalEarned,
        totalSpent,
        usersWithCoins,
        recentTransactions: recentTx || [],
        breakdown,
      };
    },
  });

  const statCards = [
    {
      label: "Coins in Circulation",
      value: stats?.totalBalance.toLocaleString() || "0",
      icon: Coins,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Total Earned",
      value: stats?.totalEarned.toLocaleString() || "0",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Spent",
      value: stats?.totalSpent.toLocaleString() || "0",
      icon: ArrowDownRight,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Users with Coins",
      value: stats?.usersWithCoins.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coin Breakdown by Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.breakdown &&
                Object.entries(stats.breakdown).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-500 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +{data.earned}
                      </span>
                      {data.spent > 0 && (
                        <span className="text-red-500 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />
                          -{data.spent}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats?.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="text-sm">{tx.description || tx.transaction_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
