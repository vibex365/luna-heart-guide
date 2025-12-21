import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, Gift, Search, ArrowUpRight, ArrowDownRight, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const AdminCoinManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [giveReason, setGiveReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all user coin balances with profile info
  const { data: userCoins = [], isLoading } = useQuery({
    queryKey: ["admin-user-coins", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("user_coins")
        .select(`
          *,
          profiles!inner(display_name, avatar_url)
        `)
        .order("balance", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search if provided
      if (searchQuery.trim()) {
        return (data || []).filter((u: any) =>
          u.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data || [];
    },
  });

  // Fetch recent transactions with user info
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["admin-all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles for display names
      const userIds = [...new Set((data || []).map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      return (data || []).map((t) => ({
        ...t,
        display_name: profileMap.get(t.user_id) || "Unknown",
      }));
    },
  });

  // Give coins mutation
  const giveCoins = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      // Get current user for admin ID
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Check if user has coin balance
      const { data: existing } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            balance: existing.balance + amount,
            lifetime_earned: existing.lifetime_earned + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from("user_coins")
          .insert({
            user_id: userId,
            balance: amount,
            lifetime_earned: amount,
          });

        if (insertError) throw insertError;
      }

      // Record transaction
      const { error: txError } = await supabase
        .from("coin_transactions")
        .insert({
          user_id: userId,
          amount,
          transaction_type: "admin_gift",
          description: reason || "Admin gift",
        });

      if (txError) throw txError;

      // Log admin action
      if (adminUser) {
        await supabase.from("admin_action_logs").insert({
          admin_id: adminUser.id,
          action_type: "give_coins",
          target_user_id: userId,
          details: { amount, reason },
          reason: `Gave ${amount} coins: ${reason}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-coins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coin-stats"] });
      toast.success("Coins given successfully!");
      setDialogOpen(false);
      setCoinAmount("");
      setGiveReason("");
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error("Error giving coins:", error);
      toast.error("Failed to give coins");
    },
  });

  const handleGiveCoins = () => {
    if (!selectedUser || !coinAmount) return;
    giveCoins.mutate({
      userId: selectedUser,
      amount: parseInt(coinAmount),
      reason: giveReason,
    });
  };

  // Stats
  const totalBalance = userCoins.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
  const totalUsers = userCoins.length;
  const purchaseTransactions = recentTransactions.filter((t: any) => t.transaction_type === "purchase");

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Coins className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBalance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Users with Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{purchaseTransactions.length}</p>
                <p className="text-xs text-muted-foreground">Purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Gift className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recentTransactions.filter((t: any) => t.transaction_type === "admin_gift").length}
                </p>
                <p className="text-xs text-muted-foreground">Admin Gifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Coin Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              User Balances
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48 h-8 text-sm"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCoins.map((uc: any) => (
                    <TableRow key={uc.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {uc.profiles?.display_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {uc.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="gap-1">
                          <Coins className="w-3 h-3" />
                          {uc.balance}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={dialogOpen && selectedUser === uc.user_id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setSelectedUser(uc.user_id)}
                            >
                              <Gift className="w-3 h-3 mr-1" />
                              Give
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Give Coins to {uc.profiles?.display_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Amount</Label>
                                <Input
                                  type="number"
                                  value={coinAmount}
                                  onChange={(e) => setCoinAmount(e.target.value)}
                                  placeholder="Enter coin amount"
                                />
                              </div>
                              <div>
                                <Label>Reason</Label>
                                <Textarea
                                  value={giveReason}
                                  onChange={(e) => setGiveReason(e.target.value)}
                                  placeholder="Why are you giving these coins?"
                                />
                              </div>
                              <Button
                                onClick={handleGiveCoins}
                                disabled={!coinAmount || giveCoins.isPending}
                                className="w-full"
                              >
                                <Gift className="w-4 h-4 mr-2" />
                                Give {coinAmount || "0"} Coins
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{tx.display_name}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.transaction_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tx.description || tx.transaction_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      tx.amount > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
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