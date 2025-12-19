import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TRIAL_DURATION_DAYS = 3;

interface CouplesTrialData {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  status: "active" | "expired" | "converted";
  features_used: string[];
}

export const useCouplesTrial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch trial status
  const { data: trial, isLoading } = useQuery({
    queryKey: ["couples-trial", user?.id],
    queryFn: async (): Promise<CouplesTrialData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("couples_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching trial:", error);
        return null;
      }

      return data as CouplesTrialData | null;
    },
    enabled: !!user,
  });

  // Check if user has couples subscription (shouldn't need trial)
  const { data: hasCouplesSubscription } = useQuery({
    queryKey: ["couples-subscription-check", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(`
          tier_id,
          subscription_tiers!inner(slug)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      return subscription?.subscription_tiers?.slug === "couples";
    },
    enabled: !!user,
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + TRIAL_DURATION_DAYS);

      const { data, error } = await supabase
        .from("couples_trials")
        .insert({
          user_id: user.id,
          ends_at: endsAt.toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-trial"] });
      queryClient.invalidateQueries({ queryKey: ["couples-access"] });
      toast.success("Your 3-day couples trial has started!", {
        description: "Explore all couples features with your partner.",
      });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("You've already used your free trial");
      } else {
        toast.error("Failed to start trial");
      }
    },
  });

  // Track feature usage
  const trackFeatureUsage = useMutation({
    mutationFn: async (featureName: string) => {
      if (!user || !trial) return;

      const updatedFeatures = [...(trial.features_used || [])];
      if (!updatedFeatures.includes(featureName)) {
        updatedFeatures.push(featureName);
      }

      await supabase
        .from("couples_trials")
        .update({ features_used: updatedFeatures })
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-trial"] });
    },
  });

  // Calculate trial status
  const now = new Date();
  const isTrialActive = trial?.status === "active" && new Date(trial.ends_at) > now;
  const isTrialExpired = trial && (trial.status === "expired" || new Date(trial.ends_at) <= now);
  const hasUsedTrial = !!trial;
  const canStartTrial = !trial && !hasCouplesSubscription;

  // Calculate days remaining
  let trialDaysLeft = 0;
  let trialHoursLeft = 0;
  if (trial && isTrialActive) {
    const endsAt = new Date(trial.ends_at);
    const diff = endsAt.getTime() - now.getTime();
    trialDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    trialHoursLeft = Math.ceil(diff / (1000 * 60 * 60));
  }

  // Check if user has access (via subscription OR active trial)
  const hasCouplesAccess = hasCouplesSubscription || isTrialActive;

  return {
    trial,
    isLoading,
    hasCouplesAccess,
    hasCouplesSubscription,
    isTrialActive,
    isTrialExpired,
    hasUsedTrial,
    canStartTrial,
    trialDaysLeft,
    trialHoursLeft,
    startTrial: startTrialMutation.mutate,
    isStartingTrial: startTrialMutation.isPending,
    trackFeatureUsage: trackFeatureUsage.mutate,
  };
};
