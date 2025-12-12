import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TierCard } from "@/components/admin/TierCard";
import { TierEditDialog } from "@/components/admin/TierEditDialog";
import { SubscriptionStats } from "@/components/admin/SubscriptionStats";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  is_active: boolean;
  features: string[];
  limits: Record<string, number | boolean>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const AdminSubscriptions = () => {
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tiers
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ["admin-subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data as unknown as SubscriptionTier[]) || [];
    },
  });

  // Update tier mutation
  const updateMutation = useMutation({
    mutationFn: async (tier: Partial<SubscriptionTier> & { id: string }) => {
      const { error } = await supabase
        .from("subscription_tiers")
        .update({
          name: tier.name,
          description: tier.description,
          price_monthly: tier.price_monthly,
          is_active: tier.is_active,
          features: tier.features,
          limits: tier.limits,
        })
        .eq("id", tier.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-tiers"] });
      toast({
        title: "Tier Updated",
        description: "Subscription tier has been updated successfully.",
      });
      setDialogOpen(false);
      setEditingTier(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tier. Please try again.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  const handleEditTier = (tier: SubscriptionTier) => {
    setEditingTier(tier);
    setDialogOpen(true);
  };

  const handleSaveTier = (tier: Partial<SubscriptionTier> & { id: string }) => {
    updateMutation.mutate(tier);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscription Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans and pricing
          </p>
        </div>

        {/* Stats */}
        <SubscriptionStats tiers={tiers} />

        {/* Tiers Grid */}
        <div>
          <h2 className="text-lg font-medium text-foreground mb-4">Plans</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  onEdit={() => handleEditTier(tier)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <TierEditDialog
          tier={editingTier}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveTier}
          isUpdating={updateMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
