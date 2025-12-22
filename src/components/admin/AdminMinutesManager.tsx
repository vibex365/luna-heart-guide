import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Clock, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Search, 
  Gift,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface UserMinutes {
  user_id: string;
  minutes_balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
  };
}

interface MinuteTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: "purchase" | "usage" | "bonus" | "refund";
  description: string | null;
  created_at: string;
  package_id: string | null;
}

export const AdminMinutesManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftReason, setGiftReason] = useState("");
  const [isGifting, setIsGifting] = useState(false);

  // Fetch user minutes balances
  const { data: userMinutes, isLoading: loadingBalances, refetch: refetchBalances } = useQuery({
    queryKey: ["admin-user-minutes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_minutes")
        .select("*")
        .order("balance", { ascending: false });
      
      if (error) throw error;

      // Fetch profiles for display names
      const userIds = data?.map(u => u.user_id) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        
        return data?.map(u => ({
          ...u,
          profile: profiles?.find(p => p.user_id === u.user_id)
        })) as UserMinutes[];
      }

      return data as UserMinutes[];
    }
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["admin-minute-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("minute_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MinuteTransaction[];
    }
  });

  // Fetch packages for stats
  const { data: packages } = useQuery({
    queryKey: ["minute-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("minute_packages")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate stats
  const stats = {
    totalMinutesSold: transactions?.filter(t => t.transaction_type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    totalMinutesUsed: transactions?.filter(t => t.transaction_type === "usage")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0,
    totalRevenue: transactions?.filter(t => t.transaction_type === "purchase")
      .reduce((sum, t) => {
        // Estimate revenue based on package (approximate)
        const pkg = packages?.find(p => p.id === t.package_id);
        return sum + (pkg ? pkg.price_cents / 100 : 0);
      }, 0) || 0,
    usersWithMinutes: userMinutes?.filter(u => u.minutes_balance > 0).length || 0,
    totalPurchases: transactions?.filter(t => t.transaction_type === "purchase").length || 0,
  };

  // Filter users by search
  const filteredUsers = userMinutes?.filter(u => 
    u.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleGiftMinutes = async () => {
    if (!selectedUserId || !giftAmount) return;
    
    setIsGifting(true);
    try {
      const amount = parseInt(giftAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Check if user has a minutes record
      const { data: existing } = await supabase
        .from("user_minutes")
        .select("minutes_balance")
        .eq("user_id", selectedUserId)
        .single();

      if (existing) {
        // Update existing balance
        await supabase
          .from("user_minutes")
          .update({ 
            minutes_balance: existing.minutes_balance + amount,
            lifetime_purchased: existing.minutes_balance + amount,
          })
          .eq("user_id", selectedUserId);
      } else {
        // Create new record
        await supabase
          .from("user_minutes")
          .insert({
            user_id: selectedUserId,
            minutes_balance: amount,
            lifetime_purchased: amount,
            lifetime_used: 0,
          });
      }

      // Record transaction (using 'bonus' type for admin gifts)
      await supabase
        .from("minute_transactions")
        .insert({
          user_id: selectedUserId,
          amount: amount,
          transaction_type: "bonus" as const,
          description: giftReason || "Admin gift",
        });

      toast.success(`Gifted ${amount} minutes successfully!`);
      setGiftDialogOpen(false);
      setGiftAmount("");
      setGiftReason("");
      setSelectedUserId(null);
      refetchBalances();
    } catch (error) {
      console.error("Error gifting minutes:", error);
      toast.error("Failed to gift minutes");
    } finally {
      setIsGifting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Minutes Sold</p>
                <p className="text-2xl font-bold">{stats.totalMinutesSold}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/20">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Minutes Used</p>
                <p className="text-2xl font-bold">{stats.totalMinutesUsed}</p>
              </div>
              <div className="p-2 rounded-full bg-orange-500/20">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-full bg-green-500/20">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Users w/ Minutes</p>
                <p className="text-2xl font-bold">{stats.usersWithMinutes}</p>
              </div>
              <div className="p-2 rounded-full bg-purple-500/20">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Purchases</p>
                <p className="text-2xl font-bold">{stats.totalPurchases}</p>
              </div>
              <div className="p-2 rounded-full bg-pink-500/20">
                <ShoppingCart className="h-4 w-4 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Balances */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">User Balances</CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {loadingBalances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users with minutes found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {user.profile?.display_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {user.user_id.substring(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.minutes_balance > 0 ? "default" : "secondary"}>
                            {user.minutes_balance} min
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={giftDialogOpen && selectedUserId === user.user_id} onOpenChange={(open) => {
                            setGiftDialogOpen(open);
                            if (open) setSelectedUserId(user.user_id);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Gift className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Gift Minutes</DialogTitle>
                                <DialogDescription>
                                  Gift voice minutes to {user.profile?.display_name || user.user_id.substring(0, 8)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Minutes to gift</Label>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 10"
                                    value={giftAmount}
                                    onChange={(e) => setGiftAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Reason (optional)</Label>
                                  <Input
                                    placeholder="e.g., Customer support resolution"
                                    value={giftReason}
                                    onChange={(e) => setGiftReason(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleGiftMinutes} disabled={isGifting}>
                                  {isGifting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Gift className="h-4 w-4 mr-2" />
                                  )}
                                  Gift Minutes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.transaction_type === "purchase" 
                            ? "bg-green-500/20" 
                            : tx.transaction_type === "bonus"
                            ? "bg-purple-500/20"
                            : "bg-red-500/20"
                        }`}>
                          {tx.transaction_type === "purchase" || tx.transaction_type === "bonus" ? (
                            <ArrowUpRight className={`h-4 w-4 ${
                              tx.transaction_type === "purchase" ? "text-green-500" : "text-purple-500"
                            }`} />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {tx.transaction_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.amount > 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount} min
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Package Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Minute Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {packages?.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-4 rounded-xl border ${
                  pkg.is_popular ? "border-blue-500/50 bg-blue-500/10" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{pkg.name}</p>
                  {pkg.is_popular && (
                    <Badge className="bg-blue-500 text-white text-xs">Popular</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{pkg.minutes} min</p>
                <p className="text-sm text-muted-foreground">
                  ${(pkg.price_cents / 100).toFixed(2)}
                </p>
                {pkg.savings_percent && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Save {pkg.savings_percent}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};