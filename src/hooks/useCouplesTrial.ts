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
      // Detailed auth check
      if (!user) {
        console.error("[CouplesTrial] No user found in auth context");
        throw new Error("NOT_AUTHENTICATED");
      }

      if (!user.id) {
        console.error("[CouplesTrial] User exists but has no ID", user);
        throw new Error("INVALID_USER");
      }

      console.log("[CouplesTrial] Starting trial for user:", user.id);

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + TRIAL_DURATION_DAYS);

      const insertData = {
        user_id: user.id,
        ends_at: endsAt.toISOString(),
        status: "active",
      };

      console.log("[CouplesTrial] Insert data:", insertData);

      const { data, error } = await supabase
        .from("couples_trials")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("[CouplesTrial] Supabase error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log("[CouplesTrial] Trial created successfully:", data);
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
      console.error("[CouplesTrial] Mutation error:", error);

      // Handle specific error types
      if (error.message === "NOT_AUTHENTICATED") {
        toast.error("Please sign in to start your trial");
        return;
      }

      if (error.message === "INVALID_USER") {
        toast.error("Session error - please log out and back in");
        return;
      }

      if (error.code === "23505") {
        toast.error("You've already used your free trial");
        return;
      }

      if (error.code === "42501") {
        toast.error("Access denied - please log out and back in");
        return;
      }

      if (error.code === "PGRST301") {
        toast.error("Database connection issue - please try again");
        return;
      }

      // Network errors
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        toast.error("Connection issue - please check your internet");
        return;
      }

      // Fallback with error details for debugging
      toast.error(`Failed to start trial: ${error.message || error.code || "Unknown error"}`);
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
