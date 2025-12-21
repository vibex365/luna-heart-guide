import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseTypingIndicatorProps {
  partnerLinkId: string;
  partnerId: string;
}

export const useTypingIndicator = ({ partnerLinkId, partnerId }: UseTypingIndicatorProps) => {
  const { user } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Update own typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !partnerLinkId) return;

    // Throttle updates to prevent too many requests
    const now = Date.now();
    if (isTyping && now - lastUpdateRef.current < 1000) return;
    lastUpdateRef.current = now;

    try {
      const { error } = await supabase
        .from("couples_typing_status")
        .upsert({
          partner_link_id: partnerLinkId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "partner_link_id,user_id",
        });

      if (error) console.error("Error updating typing status:", error);
    } catch (err) {
      console.error("Error updating typing status:", err);
    }
  }, [user, partnerLinkId]);

  // Handle input change - set typing with auto-clear
  const handleTyping = useCallback(() => {
    setTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing status after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Clear typing on unmount or send
  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Subscribe to partner's typing status
  useEffect(() => {
    if (!partnerLinkId || !partnerId) return;

    const channel = supabase
      .channel(`typing-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples_typing_status",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          const data = payload.new as { user_id: string; is_typing: boolean } | undefined;
          if (data && data.user_id === partnerId) {
            setIsPartnerTyping(data.is_typing);
            
            // Auto-clear after 5 seconds if no update
            if (data.is_typing) {
              setTimeout(() => {
                setIsPartnerTyping(false);
              }, 5000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, partnerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing status on unmount
      if (user && partnerLinkId) {
        supabase
          .from("couples_typing_status")
          .upsert({
            partner_link_id: partnerLinkId,
            user_id: user.id,
            is_typing: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "partner_link_id,user_id",
          })
          .then(() => {});
      }
    };
  }, [user, partnerLinkId]);

  return {
    isPartnerTyping,
    handleTyping,
    clearTyping,
  };
};
