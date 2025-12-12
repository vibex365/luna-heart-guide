import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }
      
      return (data as UserRole[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasRole = (role: AppRole): boolean => {
    return roles.some((r) => r.role === role);
  };

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator");
  const isAdminOrModerator = isAdmin || isModerator;

  return {
    roles,
    isLoading,
    hasRole,
    isAdmin,
    isModerator,
    isAdminOrModerator,
    refetch,
  };
};
