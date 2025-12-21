import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";

import { RelationshipHealthCard } from "@/components/couples/RelationshipHealthCard";
import { RelationshipAssessment } from "@/components/couples/RelationshipAssessment";
import { RelationshipTrendsChart } from "@/components/couples/RelationshipTrendsChart";
import { SharedMoodTracker } from "@/components/couples/SharedMoodTracker";
import { CoupleGoals } from "@/components/couples/CoupleGoals";
import { ConflictResolutionTools } from "@/components/couples/ConflictResolutionTools";
import { SharedActivities } from "@/components/couples/SharedActivities";
import { DateNightGenerator } from "@/components/couples/DateNightGenerator";

const CouplesHealth = () => {
  const navigate = useNavigate();
  const { isLinked, partnerLink } = useCouplesAccount();
  const { hasCouplesAccess } = useCouplesTrial();

  if (!hasCouplesAccess) {
    navigate("/couples");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/couples")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Relationship Health
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {isLinked ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <RelationshipHealthCard />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <RelationshipAssessment />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <RelationshipTrendsChart />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SharedMoodTracker />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <CoupleGoals />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ConflictResolutionTools />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <SharedActivities />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <DateNightGenerator partnerLinkId={partnerLink?.id} />
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Link with your partner to track your relationship health!</p>
            <Button onClick={() => navigate("/couples")} className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouplesHealth;
