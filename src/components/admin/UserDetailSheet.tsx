import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/pages/admin/AdminUsers";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MessageSquare, 
  Heart, 
  BookOpen, 
  Ban, 
  CheckCircle,
  Calendar,
  Clock,
  Crown
} from "lucide-react";
import { toast } from "sonner";

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
}

interface UserDetailSheetProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuspend: (userId: string, suspend: boolean, reason?: string) => void;
  isUpdating: boolean;
}

export const UserDetailSheet = ({ 
  user, 
  open, 
  onOpenChange, 
  onSuspend,
  isUpdating 
}: UserDetailSheetProps) => {
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const queryClient = useQueryClient();

  // Fetch subscription tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return (data as SubscriptionTier[]) || [];
    },
  });

  // Fetch user's current subscription
  const { data: userSubscription, isLoading: subLoading } = useQuery({
    queryKey: ["admin-user-subscription", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          tier_id,
          status,
          expires_at,
          source,
          subscription_tiers(name, slug)
        `)
        .eq("user_id", user.user_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, tierId, tierName }: { userId: string; tierId: string; tierName: string }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const adminId = currentUser?.id;

      // Check if user has an existing subscription
      const { data: existing } = await supabase
        .from("user_subscriptions")
        .select("id, tier_id, subscription_tiers(name)")
        .eq("user_id", userId)
        .maybeSingle();

      const previousTier = (existing?.subscription_tiers as any)?.name || "None";

      if (existing) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            tier_id: tierId,
            status: "active",
            source: "admin",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            tier_id: tierId,
            status: "active",
            source: "admin",
            started_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Log the admin action
      if (adminId) {
        await supabase.from("admin_action_logs").insert({
          admin_id: adminId,
          action_type: "subscription_change",
          target_user_id: userId,
          details: {
            previous_tier: previousTier,
            new_tier: tierName,
          },
          reason: `Changed subscription from ${previousTier} to ${tierName}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-subscription", user?.user_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-action-logs"] });
      toast.success("Subscription updated successfully");
    },
    onError: (error) => {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    },
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["admin-user-stats", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return null;

      const [conversations, messages, moods, journals] = await Promise.all([
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.user_id),
        supabase
          .from("messages")
          .select("id, conversation_id")
          .limit(1000),
        supabase
          .from("mood_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.user_id),
        supabase
          .from("journal_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.user_id),
      ]);

      return {
        conversations: conversations.count || 0,
        messages: messages.data?.length || 0,
        moods: moods.count || 0,
        journals: journals.count || 0,
      };
    },
    enabled: !!user?.user_id && open,
  });

  // Fetch recent mood entries
  const { data: recentMoods = [] } = useQuery({
    queryKey: ["admin-user-moods", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];

      const { data, error } = await supabase
        .from("mood_entries")
        .select("id, mood_label, created_at")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.user_id && open,
  });

  if (!user) return null;

  const handleSuspendConfirm = () => {
    onSuspend(user.user_id, true, suspendReason);
    setSuspendDialogOpen(false);
    setSuspendReason("");
  };

  const handleSubscriptionChange = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    updateSubscriptionMutation.mutate({ userId: user.user_id, tierId, tierName: tier?.name || "Unknown" });
  };

  const currentTierSlug = userSubscription?.subscription_tiers?.slug || "free";
  const currentTierId = userSubscription?.tier_id || tiers.find(t => t.slug === "free")?.id;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                  {(user.display_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {user.display_name || "Unknown User"}
                </SheetTitle>
                <SheetDescription className="text-xs break-all">
                  {user.user_id}
                </SheetDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
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
              <Badge 
                variant="outline" 
                className={`gap-1 ${
                  currentTierSlug === "couples" 
                    ? "border-pink-500 text-pink-600" 
                    : currentTierSlug === "pro" 
                    ? "border-primary text-primary" 
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                <Crown className="h-3 w-3" />
                {userSubscription?.subscription_tiers?.name || "Free"}
              </Badge>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Subscription Management */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Subscription Tier
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Select
                  value={currentTierId || ""}
                  onValueChange={handleSubscriptionChange}
                  disabled={updateSubscriptionMutation.isPending || subLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        <span className="flex items-center gap-2">
                          {tier.name}
                          {tier.slug === "couples" && (
                            <span className="text-xs text-pink-500">(Partner features)</span>
                          )}
                          {tier.slug === "pro" && (
                            <span className="text-xs text-primary">(Unlimited)</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Source:</span>
                  <Badge variant="outline" className={`text-xs ${
                    userSubscription?.source === "stripe" 
                      ? "border-blue-500 text-blue-600" 
                      : userSubscription?.source === "admin"
                      ? "border-amber-500 text-amber-600"
                      : "border-muted-foreground"
                  }`}>
                    {userSubscription?.source || "system"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manually assign a subscription tier to this user. This overrides any Stripe subscription.
                </p>
                {userSubscription?.expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(userSubscription.expires_at), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Account Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Account Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-foreground">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {user.suspended && user.suspended_at && (
                <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-destructive font-medium">
                    Suspended {formatDistanceToNow(new Date(user.suspended_at), { addSuffix: true })}
                  </p>
                  {user.suspended_reason && (
                    <p className="text-sm text-muted-foreground">
                      Reason: {user.suspended_reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Activity Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {stats?.conversations || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Conversations</p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {stats?.moods || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Mood Entries</p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {stats?.journals || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Journal Entries</p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {stats?.messages || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Recent Moods */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Recent Moods</h3>
              {recentMoods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mood entries yet</p>
              ) : (
                <div className="space-y-2">
                  {recentMoods.map((mood) => (
                    <div 
                      key={mood.id} 
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{mood.mood_label}</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(mood.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Actions</h3>
              {user.suspended ? (
                <Button
                  onClick={() => onSuspend(user.user_id, false)}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Restore Access
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setSuspendDialogOpen(true)}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend User
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the user from accessing the platform. You can restore their access at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="suspend-reason">Reason (optional)</Label>
            <Textarea
              id="suspend-reason"
              placeholder="Enter reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
