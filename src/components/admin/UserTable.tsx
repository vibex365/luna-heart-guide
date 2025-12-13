import { format } from "date-fns";
import { Eye, Ban, CheckCircle, MoreHorizontal, Crown, CreditCard, UserCog } from "lucide-react";
import { UserProfile } from "@/pages/admin/AdminUsers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
  onViewUser: (user: UserProfile) => void;
  onSuspendUser: (userId: string, suspend: boolean) => void;
}

interface UserSubscriptionInfo {
  tier_name: string;
  tier_slug: string;
  source: string;
}

export const UserTable = ({ 
  users, 
  isLoading, 
  onViewUser, 
  onSuspendUser 
}: UserTableProps) => {
  // Fetch all user subscriptions in one query
  const { data: subscriptions = {} } = useQuery({
    queryKey: ["admin-user-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          user_id,
          source,
          subscription_tiers(name, slug)
        `)
        .eq("status", "active");

      if (error) throw error;

      const subMap: Record<string, UserSubscriptionInfo> = {};
      data?.forEach((sub) => {
        subMap[sub.user_id] = {
          tier_name: (sub.subscription_tiers as any)?.name || "Free",
          tier_slug: (sub.subscription_tiers as any)?.slug || "free",
          source: sub.source || "system",
        };
      });
      return subMap;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const sub = subscriptions[user.user_id];
            const tierSlug = sub?.tier_slug || "free";
            const tierName = sub?.tier_name || "Free";
            const source = sub?.source || "system";

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                        {(user.display_name || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.display_name || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {user.user_id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`gap-1 ${
                        tierSlug === "couples" 
                          ? "border-pink-500 text-pink-600" 
                          : tierSlug === "pro" 
                          ? "border-primary text-primary" 
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      <Crown className="h-3 w-3" />
                      {tierName}
                    </Badge>
                    {source === "stripe" ? (
                      <span title="Stripe"><CreditCard className="h-3 w-3 text-blue-500" /></span>
                    ) : source === "admin" ? (
                      <span title="Admin"><UserCog className="h-3 w-3 text-amber-500" /></span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {user.suspended ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" />
                      Suspended
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewUser(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user.suspended ? (
                        <DropdownMenuItem onClick={() => onSuspendUser(user.user_id, false)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Restore Access
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => onSuspendUser(user.user_id, true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
