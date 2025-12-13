import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface SubscriptionLimits {
  messages_per_day: number;
  ambient_sounds: boolean;
  analytics: boolean;
  data_export: boolean;
  priority_responses: boolean;
  personalized_insights?: boolean;
  couples_features?: boolean;
  relationship_score?: boolean;
  conflict_resolution?: boolean;
}

interface SubscriptionData {
  subscribed: boolean;
  plan: "free" | "pro" | "couples";
  tierName: string;
  limits: SubscriptionLimits;
  subscriptionEnd: string | null;
}

const DEFAULT_FREE_LIMITS: SubscriptionLimits = {
  messages_per_day: 5,
  ambient_sounds: false,
  analytics: false,
  data_export: false,
  priority_responses: false,
  personalized_insights: false,
};

export const useSubscription = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user || !session) {
        return {
          subscribed: false,
          plan: "free",
          tierName: "Free",
          limits: DEFAULT_FREE_LIMITS,
          subscriptionEnd: null,
        };
      }

      // Check Stripe subscription via edge function
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data) {
        console.error("Error checking subscription:", error);
        return {
          subscribed: false,
          plan: "free",
          tierName: "Free",
          limits: DEFAULT_FREE_LIMITS,
          subscriptionEnd: null,
        };
      }

      const plan = data.plan as "free" | "pro" | "couples";
      
      // Get tier limits from database
      const { data: tierData } = await supabase
        .from("subscription_tiers")
        .select("name, limits")
        .eq("slug", plan)
        .maybeSingle();

      const limits = (tierData?.limits as unknown as SubscriptionLimits) || DEFAULT_FREE_LIMITS;

      return {
        subscribed: data.subscribed,
        plan,
        tierName: tierData?.name || (plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Couples"),
        limits,
        subscriptionEnd: data.subscription_end,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  // Refetch when auth state changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  const hasFeature = (feature: keyof SubscriptionLimits): boolean => {
    if (!subscription) return false;
    const value = subscription.limits[feature];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    return false;
  };

  const getLimit = (feature: keyof SubscriptionLimits): number => {
    if (!subscription) return 0;
    const value = subscription.limits[feature];
    if (typeof value === "number") return value;
    return value ? -1 : 0; // -1 for unlimited if true boolean
  };

  const isPro = subscription?.plan === "pro" || subscription?.plan === "couples";
  const isCouples = subscription?.plan === "couples";

  return {
    subscription,
    isLoading,
    refetch,
    hasFeature,
    getLimit,
    isPro,
    isCouples,
    plan: subscription?.plan || "free",
  };
};
