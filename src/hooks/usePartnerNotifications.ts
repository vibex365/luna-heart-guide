import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "./useCouplesAccount";
import { useToast } from "./use-toast";
import { useQuery } from "@tanstack/react-query";

export const usePartnerNotifications = () => {
  const { partnerLink, partnerId, isLinked } = useCouplesAccount();
  const { toast } = useToast();

  // Fetch partner's display name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-notifications", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .maybeSingle();

      return data;
    },
    enabled: !!partnerId,
  });

  const partnerName = partnerProfile?.display_name || "Your partner";

  useEffect(() => {
    if (!isLinked || !partnerLink?.id || !partnerId) return;

    // Subscribe to shared mood entries
    const moodChannel = supabase
      .channel('partner-mood-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_mood_entries',
          filter: `partner_link_id=eq.${partnerLink.id}`,
        },
        (payload) => {
          // Only notify if the mood was logged by partner (not self)
          if (payload.new.user_id === partnerId) {
            const moodLabel = payload.new.mood_label || "their mood";
            toast({
              title: `💜 ${partnerName} shared a mood`,
              description: `They're feeling ${moodLabel.toLowerCase()}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to completed activities
    const activityChannel = supabase
      .channel('partner-activity-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completed_activities',
          filter: `partner_link_id=eq.${partnerLink.id}`,
        },
        (payload) => {
          // Only notify if the activity was completed by partner
          if (payload.new.completed_by === partnerId) {
            toast({
              title: `🎉 ${partnerName} completed an activity!`,
              description: "Check the Couples dashboard to see details",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(moodChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [isLinked, partnerLink?.id, partnerId, partnerName, toast]);
};