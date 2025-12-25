import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { supabase } from "@/integrations/supabase/client";

import { QuickDailyHub } from "@/components/couples/QuickDailyHub";
import { DailyQuestionCard } from "@/components/couples/DailyQuestionCard";
import { DailyJournalCard } from "@/components/couples/DailyJournalCard";
import { DailyTip } from "@/components/couples/DailyTip";
import { DailyChallenges } from "@/components/couples/DailyChallenges";
import { CouplesStreakTracker } from "@/components/couples/CouplesStreakTracker";
import { MilestoneTracker } from "@/components/couples/MilestoneTracker";
import { AppreciationPrompts } from "@/components/couples/AppreciationPrompts";
import { DailySparksCard } from "@/components/couples/DailySparksCard";

const CouplesDaily = () => {
  const navigate = useNavigate();
  const { isLinked, partnerLink, partnerId } = useCouplesAccount();
  const { hasCouplesAccess } = useCouplesTrial();

  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .single();
      return data;
    },
    enabled: !!partnerId,
  });

  if (!hasCouplesAccess) {
    navigate("/couples");
    return null;
  }

  const partnerName = partnerProfile?.display_name || "Your Partner";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/couples")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Daily Activities
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {isLinked ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <QuickDailyHub currentStreak={0} hasDoneChallenge={false} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <DailySparksCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <DailyQuestionCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <DailyJournalCard partnerName={partnerName} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <DailyTip />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <DailyChallenges />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <CouplesStreakTracker partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <MilestoneTracker partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <AppreciationPrompts partnerLinkId={partnerLink?.id} />
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Link with your partner to access daily activities!</p>
            <Button onClick={() => navigate("/couples")} className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouplesDaily;
