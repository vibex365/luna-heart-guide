import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FeatureMatrix } from "@/components/admin/FeatureMatrix";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  limits: Record<string, number | boolean>;
}

export interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number";
}

// Define all features that can be toggled
export const featureDefinitions: FeatureDefinition[] = [
  {
    key: "messages_per_day",
    label: "Daily Message Limit",
    description: "Number of messages allowed per day (-1 for unlimited)",
    type: "number",
  },
  {
    key: "analytics",
    label: "Advanced Analytics",
    description: "Access to mood trends and conversation insights",
    type: "boolean",
  },
  {
    key: "priority_responses",
    label: "Priority AI Responses",
    description: "Faster response times from Luna",
    type: "boolean",
  },
  {
    key: "data_export",
    label: "Data Export",
    description: "Export conversations, moods, and journals",
    type: "boolean",
  },
  {
    key: "ambient_sounds",
    label: "Ambient Sound Library",
    description: "Access to relaxation sounds",
    type: "boolean",
  },
  {
    key: "personalized_insights",
    label: "Personalized Insights",
    description: "Weekly AI-generated insights",
    type: "boolean",
  },
  {
    key: "couples_features",
    label: "Couples Features",
    description: "Linked accounts and shared tracking",
    type: "boolean",
  },
  {
    key: "conflict_resolution",
    label: "Conflict Resolution Scripts",
    description: "Guided exercises for couples",
    type: "boolean",
  },
  {
    key: "relationship_score",
    label: "Relationship Health Score",
    description: "Track relationship wellness over time",
    type: "boolean",
  },
];

const AdminFeatures = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tiers
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ["admin-feature-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("id, name, slug, limits")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data as unknown as SubscriptionTier[]) || [];
    },
  });

  // Update tier limits mutation
  const updateMutation = useMutation({
    mutationFn: async ({ 
      tierId, 
      limits 
    }: { 
      tierId: string; 
      limits: Record<string, number | boolean>;
    }) => {
      const { error } = await supabase
        .from("subscription_tiers")
        .update({ limits })
        .eq("id", tierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-tiers"] });
      toast({
        title: "Feature Updated",
        description: "Feature access has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update feature. Please try again.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  const handleFeatureToggle = (
    tierId: string, 
    featureKey: string, 
    value: boolean | number
  ) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return;

    const updatedLimits = {
      ...tier.limits,
      [featureKey]: value,
    };

    updateMutation.mutate({ tierId, limits: updatedLimits });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Feature Access</h1>
          <p className="text-muted-foreground mt-1">
            Control which features are available for each subscription tier
          </p>
        </div>

        {/* Feature Matrix */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <FeatureMatrix
            tiers={tiers}
            features={featureDefinitions}
            onToggle={handleFeatureToggle}
            isUpdating={updateMutation.isPending}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeatures;
