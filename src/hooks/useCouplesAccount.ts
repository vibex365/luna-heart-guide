import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyPartner } from "@/utils/smsNotifications";

export interface PartnerLink {
  id: string;
  user_id: string;
  partner_id: string | null;
  invite_code: string;
  invite_email: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
  accepted_at: string | null;
}

export interface RelationshipHealthScore {
  id: string;
  partner_link_id: string;
  communication_score: number;
  trust_score: number;
  intimacy_score: number;
  conflict_resolution_score: number;
  overall_score: number;
  last_assessment_at: string;
}

export interface SharedMoodEntry {
  id: string;
  partner_link_id: string;
  user_id: string;
  mood_level: number;
  mood_label: string;
  notes: string | null;
  is_visible_to_partner: boolean;
  created_at: string;
}

export const useCouplesAccount = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partner link
  const { data: partnerLink, isLoading: isLoadingLink } = useQuery({
    queryKey: ["partner-link", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq("status", "accepted")
        .maybeSingle();

      if (error) throw error;
      return data as PartnerLink | null;
    },
    enabled: !!user,
  });

  // Fetch pending invites (sent by user)
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["pending-invites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data as PartnerLink[];
    },
    enabled: !!user,
  });

  // Fetch relationship health score
  const { data: healthScore, isLoading: isLoadingHealth } = useQuery({
    queryKey: ["health-score", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return null;
      
      const { data, error } = await supabase
        .from("relationship_health_scores")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .maybeSingle();

      if (error) throw error;
      return data as RelationshipHealthScore | null;
    },
    enabled: !!partnerLink,
  });

  // Fetch shared mood entries
  const { data: sharedMoods = [] } = useQuery({
    queryKey: ["shared-moods", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const { data, error } = await supabase
        .from("shared_mood_entries")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .order("created_at", { ascending: false })
        .limit(14);

      if (error) throw error;
      return data as SharedMoodEntry[];
    },
    enabled: !!partnerLink,
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (email?: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Generate invite code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let inviteCode = "";
      for (let i = 0; i < 8; i++) {
        inviteCode += chars[Math.floor(Math.random() * chars.length)];
      }

      const { data, error } = await supabase
        .from("partner_links")
        .insert({
          user_id: user.id,
          invite_code: inviteCode,
          invite_email: email || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({
        title: "Invite Created",
        description: "Share your invite code with your partner!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept invite mutation - uses secure RPC to prevent enumeration of all pending invites
  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error("Not authenticated");

      // Find the invite using secure RPC function (prevents viewing all pending invites)
      const { data: invites, error: findError } = await supabase
        .rpc("get_pending_invite_by_code", { p_invite_code: inviteCode.toUpperCase() });

      if (findError) throw findError;
      
      const invite = invites?.[0];
      if (!invite) throw new Error("Invalid or expired invite code");

      // Accept the invite
      const { data, error } = await supabase
        .from("partner_links")
        .update({
          partner_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-link"] });
      queryClient.invalidateQueries({ queryKey: ["health-score"] });
      toast({
        title: "Partner Linked!",
        description: "You're now connected with your partner.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite.",
        variant: "destructive",
      });
    },
  });

  // Unlink partner mutation
  const unlinkPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!partnerLink) throw new Error("No partner link found");

      const { error } = await supabase
        .from("partner_links")
        .delete()
        .eq("id", partnerLink.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-link"] });
      queryClient.invalidateQueries({ queryKey: ["health-score"] });
      queryClient.invalidateQueries({ queryKey: ["shared-moods"] });
      toast({
        title: "Unlinked",
        description: "You've been unlinked from your partner.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unlink partner.",
        variant: "destructive",
      });
    },
  });

  // Calculate partnerId early so it can be used in mutations
  const partnerId = partnerLink 
    ? (partnerLink.user_id === user?.id ? partnerLink.partner_id : partnerLink.user_id)
    : null;

  // Add shared mood mutation
  const addSharedMoodMutation = useMutation({
    mutationFn: async (mood: { mood_level: number; mood_label: string; notes?: string; is_visible_to_partner?: boolean }) => {
      if (!user || !partnerLink) throw new Error("Not connected");

      const { data, error } = await supabase
        .from("shared_mood_entries")
        .insert({
          partner_link_id: partnerLink.id,
          user_id: user.id,
          mood_level: mood.mood_level,
          mood_label: mood.mood_label,
          notes: mood.notes || null,
          is_visible_to_partner: mood.is_visible_to_partner ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["shared-moods"] });
      
      // Send SMS notification to partner if mood is visible
      if (data?.is_visible_to_partner && partnerId) {
        notifyPartner.moodLogged(partnerId, data.mood_label);
      }
    },
  });

  const isLinked = !!partnerLink && partnerLink.status === "accepted";

  return {
    partnerLink,
    isLinked,
    partnerId,
    pendingInvites,
    healthScore,
    sharedMoods,
    isLoading: isLoadingLink,
    isLoadingHealth,
    createInvite: createInviteMutation.mutate,
    acceptInvite: acceptInviteMutation.mutate,
    unlinkPartner: unlinkPartnerMutation.mutate,
    addSharedMood: addSharedMoodMutation.mutate,
    isCreatingInvite: createInviteMutation.isPending,
    isAcceptingInvite: acceptInviteMutation.isPending,
  };
};
