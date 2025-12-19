import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const { useState } = React;

// Hook to check if user should be prompted for phone number
export const usePhonePrompt = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-phone-check", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("phone_number, phone_verified")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const shouldPrompt = !dismissed && profile && !profile.phone_verified;

  return {
    shouldPrompt,
    dismiss: () => setDismissed(true),
  };
};
