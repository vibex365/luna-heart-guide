import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";

export type PresenceStatus = 'online' | 'in_call' | 'in_chat' | 'offline';

interface PartnerPresenceState {
  isOnline: boolean;
  status: PresenceStatus;
  lastSeen: string | null;
  activity: string | null;
}

export const usePartnerPresence = () => {
  const { user } = useAuth();
  const { partnerLink, partnerId, isLinked } = useCouplesAccount();
  
  const [partnerPresence, setPartnerPresence] = useState<PartnerPresenceState>({
    isOnline: false,
    status: 'offline',
    lastSeen: null,
    activity: null
  });
  
  const [myStatus, setMyStatus] = useState<PresenceStatus>('online');

  // Track my presence
  const updateMyPresence = useCallback(async (status: PresenceStatus, activity?: string) => {
    if (!partnerLink?.id || !user) return;
    
    setMyStatus(status);
    
    const channel = supabase.channel(`couples-presence-${partnerLink.id}`);
    await channel.track({
      user_id: user.id,
      status,
      activity: activity || null,
      online_at: new Date().toISOString()
    });
  }, [partnerLink?.id, user]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!partnerLink?.id || !user || !isLinked) return;

    const channel = supabase.channel(`couples-presence-${partnerLink.id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Find partner's presence
        for (const [key, presences] of Object.entries(state)) {
          const presence = (presences as any[])[0];
          if (presence?.user_id === partnerId) {
            setPartnerPresence({
              isOnline: true,
              status: presence.status || 'online',
              lastSeen: presence.online_at,
              activity: presence.activity
            });
            return;
          }
        }
        
        // Partner not found in presence
        setPartnerPresence(prev => ({
          ...prev,
          isOnline: false,
          status: 'offline'
        }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0];
        if (presence?.user_id === partnerId) {
          setPartnerPresence({
            isOnline: true,
            status: presence.status || 'online',
            lastSeen: presence.online_at,
            activity: presence.activity
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presence = leftPresences[0];
        if (presence?.user_id === partnerId) {
          setPartnerPresence({
            isOnline: false,
            status: 'offline',
            lastSeen: presence.online_at,
            activity: null
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track my presence when subscribed
          await channel.track({
            user_id: user.id,
            status: myStatus,
            activity: null,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLink?.id, user, partnerId, isLinked, myStatus]);

  return {
    partnerPresence,
    myStatus,
    updateMyPresence,
    isPartnerOnline: partnerPresence.isOnline,
    isPartnerInCall: partnerPresence.status === 'in_call',
    isPartnerInChat: partnerPresence.status === 'in_chat'
  };
};
