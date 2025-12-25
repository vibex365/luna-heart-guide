import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserTable } from "@/components/admin/UserTable";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
}

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with email from auth metadata
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery.trim()) {
        // Search in display_name or use ilike for partial matching
        query = query.or(`display_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as UserProfile[]) || [];
    },
  });

  // Suspend/unsuspend mutation with logging
  const suspendMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      suspend, 
      reason 
    }: { 
      userId: string; 
      suspend: boolean; 
      reason?: string;
    }) => {
      // Get current admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          suspended: suspend,
          suspended_at: suspend ? new Date().toISOString() : null,
          suspended_reason: suspend ? reason : null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Log admin action
      if (adminUser) {
        await supabase.from("admin_action_logs").insert({
          admin_id: adminUser.id,
          action_type: suspend ? "user_suspended" : "user_restored",
          target_user_id: userId,
          details: { reason: reason || null },
          reason: suspend 
            ? `Suspended user: ${reason || "No reason provided"}`
            : "Restored user access",
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-action-logs"] });
      toast({
        title: variables.suspend ? "User Suspended" : "User Restored",
        description: variables.suspend 
          ? "The user has been suspended from the platform."
          : "The user's access has been restored.",
      });
      setSheetOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
      console.error("Suspend error:", error);
    },
  });

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleSuspendUser = (userId: string, suspend: boolean, reason?: string) => {
    suspendMutation.mutate({ userId, suspend, reason });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Search, view, and manage user accounts
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by display name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <UserTable
          users={users}
          isLoading={isLoading}
          onViewUser={handleViewUser}
          onSuspendUser={handleSuspendUser}
        />

        {/* User Detail Sheet */}
        <UserDetailSheet
          user={selectedUser}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuspend={handleSuspendUser}
          isUpdating={suspendMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
