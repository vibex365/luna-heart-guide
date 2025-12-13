import { motion } from "framer-motion";
import { Heart, Unlink, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const CouplesLinkedStatus = () => {
  const { user } = useAuth();
  const { partnerLink, partnerId, unlinkPartner } = useCouplesAccount();

  // Fetch partner profile
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", partnerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch own profile
  const { data: ownProfile } = useQuery({
    queryKey: ["own-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!partnerLink) return null;

  const linkedDate = partnerLink.accepted_at 
    ? format(new Date(partnerLink.accepted_at), "MMMM d, yyyy")
    : format(new Date(partnerLink.created_at), "MMMM d, yyyy");

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Linked Avatars */}
            <div className="relative">
              <div className="flex -space-x-3">
                <Avatar className="w-12 h-12 border-2 border-background">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {ownProfile?.display_name?.[0]?.toUpperCase() || "Y"}
                  </AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12 border-2 border-background">
                  <AvatarFallback className="bg-pink-500/10 text-pink-500">
                    {partnerProfile?.display_name?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              >
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </motion.div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Connected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                with {partnerProfile?.display_name || "Your Partner"} since {linkedDate}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Unlink className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unlink Partner Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will disconnect your accounts. You'll lose access to shared mood entries, 
                  relationship health scores, and couples activities. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => unlinkPartner()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Unlink
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
