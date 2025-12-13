import { motion } from "framer-motion";
import { Heart, ArrowLeft, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { PartnerInviteCard } from "@/components/couples/PartnerInviteCard";
import { CouplesLinkedStatus } from "@/components/couples/CouplesLinkedStatus";
import { RelationshipHealthCard } from "@/components/couples/RelationshipHealthCard";
import { RelationshipAssessment } from "@/components/couples/RelationshipAssessment";
import { RelationshipTrendsChart } from "@/components/couples/RelationshipTrendsChart";
import { SharedMoodTracker } from "@/components/couples/SharedMoodTracker";
import { SharedActivities } from "@/components/couples/SharedActivities";
import { ConflictResolutionTools } from "@/components/couples/ConflictResolutionTools";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Couples = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLinked, isLoading } = useCouplesAccount();

  // Check if user has couples subscription
  const { data: hasCouplesAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ["couples-access", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Check subscription tier
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(`
          tier_id,
          subscription_tiers!inner(slug)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      // Allow if couples tier or for demo purposes
      return subscription?.subscription_tiers?.slug === "couples" || true; // TODO: Remove || true for production
    },
    enabled: !!user,
  });

  if (isLoading || isLoadingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  if (!hasCouplesAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Couples</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Couples Plan Required</h2>
              <p className="text-muted-foreground mt-2">
                Upgrade to the Couples plan to unlock shared features with your partner.
              </p>
            </div>
            <Link to="/subscription">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
                Upgrade Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            Couples
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Connection Status */}
          {isLinked ? (
            <CouplesLinkedStatus />
          ) : (
            <PartnerInviteCard />
          )}
        </motion.div>

        {isLinked && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <RelationshipAssessment />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <RelationshipHealthCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <RelationshipTrendsChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SharedMoodTracker />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SharedActivities />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ConflictResolutionTools />
            </motion.div>
          </>
        )}

        {!isLinked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center py-8"
          >
            <p className="text-muted-foreground">
              Connect with your partner to unlock shared mood tracking, 
              relationship health scores, and couples activities.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Couples;
