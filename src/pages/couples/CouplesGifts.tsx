import { motion } from "framer-motion";
import { ArrowLeft, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { supabase } from "@/integrations/supabase/client";
import { CoinBalance } from "@/components/couples/CoinBalance";
import { GiftButton } from "@/components/couples/GiftButton";
import { GiftCollection } from "@/components/couples/GiftCollection";
import { TimeCapsuleComposer } from "@/components/couples/TimeCapsuleComposer";
import { TimeCapsuleInbox } from "@/components/couples/TimeCapsuleInbox";

const CouplesGifts = () => {
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
            <Gift className="w-5 h-5 text-pink-500" />
            Gifts & Time Capsules
          </h1>
          <CoinBalance />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {isLinked && partnerLink?.id && partnerId ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <TimeCapsuleComposer partnerName={partnerName} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <TimeCapsuleInbox partnerName={partnerName} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <GiftButton
                partnerLinkId={partnerLink.id}
                partnerId={partnerId}
                partnerName={partnerName}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GiftCollection
                partnerLinkId={partnerLink.id}
                partnerId={partnerId}
              />
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Link with your partner to send gifts!</p>
            <Button onClick={() => navigate("/couples")} className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouplesGifts;
