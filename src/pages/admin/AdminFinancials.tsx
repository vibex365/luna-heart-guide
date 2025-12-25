import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Coins,
  Headphones,
  Gift,
  UserMinus,
  TrendingDown
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialData {
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
  revenue: {
    total_30d: number;
    net_30d: number;
    refunded_30d: number;
    mrr: number;
    active_subscriptions: number;
    charges_count: number;
    churn_rate: number;
    churned_customers: number;
    lost_mrr: number;
  };
  recent_transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    description: string;
    customer_email: string | null;
    created: string;
  }>;
  coin_transactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    transaction_type: string;
    description: string | null;
    created_at: string;
  }>;
  minute_transactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    transaction_type: string;
    description: string | null;
    created_at: string;
  }>;
  gift_transactions: Array<{
    id: string;
    sender_id: string;
    recipient_id: string;
    gift_id: string;
    amount_cents: number;
    created_at: string;
  }>;
}

const AdminFinancials = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-financials"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<FinancialData>("admin-financials");
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    trend,
    variant = "default"
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
    trend?: { value: number; positive: boolean };
    variant?: "default" | "success" | "warning";
  }) => (
    <Card className={`
      ${variant === "success" ? "border-green-500/30 bg-green-500/5" : ""}
      ${variant === "warning" ? "border-yellow-500/30 bg-yellow-500/5" : ""}
    `}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${trend.positive ? "text-green-500" : "text-red-500"}`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${
            variant === "success" ? "bg-green-500/10" : 
            variant === "warning" ? "bg-yellow-500/10" : "bg-primary/10"
          }`}>
            <Icon className={`w-6 h-6 ${
              variant === "success" ? "text-green-500" : 
              variant === "warning" ? "text-yellow-500" : "text-primary"
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financial Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Revenue, transactions, and Stripe metrics
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available Balance"
            value={`$${data?.balance.available.toFixed(2) || "0.00"}`}
            icon={Wallet}
            subtitle={`${data?.balance.currency || "USD"}`}
            variant="success"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${data?.revenue.mrr.toFixed(2) || "0.00"}`}
            icon={TrendingUp}
            subtitle="MRR from subscriptions"
          />
          <StatCard
            title="30-Day Revenue"
            value={`$${data?.revenue.net_30d.toFixed(2) || "0.00"}`}
            icon={DollarSign}
            subtitle={`${data?.revenue.charges_count || 0} charges`}
          />
          <StatCard
            title="Active Subscriptions"
            value={data?.revenue.active_subscriptions || 0}
            icon={CreditCard}
            subtitle="Stripe subscriptions"
          />
        </div>

        {/* Churn Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate (30d)</p>
                  <p className="text-lg font-semibold">{data?.revenue.churn_rate.toFixed(1) || "0"}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <UserMinus className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Churned Customers</p>
                  <p className="text-lg font-semibold">{data?.revenue.churned_customers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <DollarSign className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lost MRR (30d)</p>
                  <p className="text-lg font-semibold">${data?.revenue.lost_mrr.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">${data?.balance.pending.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refunds (30d)</p>
                  <p className="text-lg font-semibold">${data?.revenue.refunded_30d.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross (30d)</p>
                  <p className="text-lg font-semibold">${data?.revenue.total_30d.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Tabs */}
        <Tabs defaultValue="stripe" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-2">
              <Coins className="w-4 h-4" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="minutes" className="gap-2">
              <Headphones className="w-4 h-4" />
              Minutes
            </TabsTrigger>
            <TabsTrigger value="gifts" className="gap-2">
              <Gift className="w-4 h-4" />
              Gifts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Stripe Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {data?.recent_transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No recent transactions</p>
                    ) : (
                      data?.recent_transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.customer_email || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.created), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500/30">
                            +${tx.amount.toFixed(2)}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coin Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {data?.coin_transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No coin transactions</p>
                    ) : (
                      data?.coin_transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm capitalize">{tx.transaction_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">{tx.description || "No description"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={tx.amount > 0 ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}
                          >
                            {tx.amount > 0 ? "+" : ""}{tx.amount} coins
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="minutes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Voice Minutes Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {data?.minute_transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No minute transactions</p>
                    ) : (
                      data?.minute_transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm capitalize">{tx.transaction_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">{tx.description || "No description"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={tx.amount > 0 ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}
                          >
                            {tx.amount > 0 ? "+" : ""}{tx.amount} min
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gifts">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gift Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {data?.gift_transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No gift transactions</p>
                    ) : (
                      data?.gift_transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Gift Sent</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {tx.sender_id.slice(0, 8)}... → {tx.recipient_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-pink-500 border-pink-500/30">
                            ${(tx.amount_cents / 100).toFixed(2)}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFinancials;
