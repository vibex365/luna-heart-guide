import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, TrendingUp, Gift, Crown, Search, RefreshCw, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ReferralStats {
  totalReferrals: number;
  totalConversions: number;
  totalPointsAwarded: number;
  topReferrers: Array<{
    user_id: string;
    display_name: string;
    total_referrals: number;
    successful_conversions: number;
    lifetime_earned: number;
    level: string;
  }>;
  recentReferrals: Array<{
    id: string;
    referrer_name: string;
    referred_name: string;
    status: string;
    points_awarded: number;
    created_at: string;
  }>;
}

const AdminReferrals = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["admin-referral-stats"],
    queryFn: async (): Promise<ReferralStats> => {
      // Get total referrals
      const { count: totalReferrals } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true });

      // Get total conversions
      const { count: totalConversions } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("status", "converted");

      // Get total points awarded
      const { data: pointsData } = await supabase
        .from("referral_points")
        .select("lifetime_earned");
      
      const totalPointsAwarded = pointsData?.reduce((sum, p) => sum + (p.lifetime_earned || 0), 0) || 0;

      // Get top referrers
      const { data: topReferrers } = await supabase
        .from("referral_points")
        .select(`
          user_id,
          total_referrals,
          successful_conversions,
          lifetime_earned,
          level
        `)
        .order("lifetime_earned", { ascending: false })
        .limit(10);

      // Get display names for top referrers
      const userIds = topReferrers?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const topReferrersWithNames = topReferrers?.map(r => ({
        ...r,
        display_name: profiles?.find(p => p.user_id === r.user_id)?.display_name || "Unknown",
      })) || [];

      // Get recent referrals
      const { data: recentReferrals } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_user_id, status, points_awarded, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Get names for recent referrals
      const allUserIds = [...new Set([
        ...(recentReferrals?.map(r => r.referrer_id) || []),
        ...(recentReferrals?.map(r => r.referred_user_id) || []),
      ])];
      
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allUserIds);

      const recentWithNames = recentReferrals?.map(r => ({
        id: r.id,
        referrer_name: allProfiles?.find(p => p.user_id === r.referrer_id)?.display_name || "Unknown",
        referred_name: allProfiles?.find(p => p.user_id === r.referred_user_id)?.display_name || "Unknown",
        status: r.status,
        points_awarded: r.points_awarded,
        created_at: r.created_at,
      })) || [];

      return {
        totalReferrals: totalReferrals || 0,
        totalConversions: totalConversions || 0,
        totalPointsAwarded,
        topReferrers: topReferrersWithNames,
        recentReferrals: recentWithNames,
      };
    },
  });

  const getLevelBadge = (level: string) => {
    const config: Record<string, { color: string; icon: string }> = {
      starter: { color: "bg-gray-500/20 text-gray-500", icon: "🌱" },
      ambassador: { color: "bg-blue-500/20 text-blue-500", icon: "⭐" },
      champion: { color: "bg-purple-500/20 text-purple-500", icon: "🏆" },
      legend: { color: "bg-yellow-500/20 text-yellow-500", icon: "👑" },
    };
    const { color, icon } = config[level] || config.starter;
    return (
      <Badge className={color}>
        {icon} {level}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "converted") {
      return <Badge className="bg-green-500/20 text-green-500">Converted</Badge>;
    }
    if (status === "pending") {
      return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const filteredReferrals = stats?.recentReferrals.filter(r =>
    r.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.referred_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Referral Program</h1>
            <p className="text-muted-foreground">Monitor affiliate performance and rewards</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold">{stats?.totalReferrals}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{stats?.totalConversions}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalReferrals ? ((stats.totalConversions / stats.totalReferrals) * 100).toFixed(1) : 0}% rate
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Points Awarded
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold">{stats?.totalPointsAwarded.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold">{stats?.topReferrers.length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Referrers Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Points Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.topReferrers.map((referrer, index) => (
                    <TableRow key={referrer.user_id}>
                      <TableCell className="font-bold">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </TableCell>
                      <TableCell className="font-medium">{referrer.display_name}</TableCell>
                      <TableCell>{getLevelBadge(referrer.level)}</TableCell>
                      <TableCell>{referrer.total_referrals}</TableCell>
                      <TableCell>{referrer.successful_conversions}</TableCell>
                      <TableCell className="font-semibold text-primary">{referrer.lifetime_earned.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Referrals</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.referrer_name}</TableCell>
                      <TableCell>{referral.referred_name}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>{referral.points_awarded}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(referral.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
