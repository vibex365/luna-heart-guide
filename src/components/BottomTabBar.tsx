import { NavLink, useLocation } from "react-router-dom";
import { MessageCircle, SmilePlus, BookOpen, Wind, User, Heart } from "lucide-react";
import { motion } from "framer-motion";
import LunaAvatar from "./LunaAvatar";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const baseTabs = [
  { to: "/chat", icon: MessageCircle, label: "Chat", isLuna: true },
  { to: "/mood", icon: SmilePlus, label: "Mood" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/breathe", icon: Wind, label: "Breathe" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomTabBar = () => {
  const location = useLocation();
  const { trigger } = useHapticFeedback();
  const { user } = useAuth();

  // Check if user has couples subscription
  const { data: hasCouplesAccess } = useQuery({
    queryKey: ["couples-access-nav", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select(`
          tier_id,
          subscription_tiers!inner(slug)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      return subscription?.subscription_tiers?.slug === "couples";
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Build tabs with couples if subscribed
  const tabs = hasCouplesAccess
    ? [
        baseTabs[0], // Chat
        baseTabs[1], // Mood
        { to: "/couples", icon: Heart, label: "Couples", isCouples: true },
        baseTabs[3], // Breathe
        baseTabs[4], // Profile
      ]
    : baseTabs;

  const handleTabPress = () => {
    trigger("selection");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          const Icon = tab.icon;
          const isCouples = 'isCouples' in tab && tab.isCouples;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={handleTabPress}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {({ isActive: routeActive }) => (
                <>
                  {routeActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-x-2 top-0 h-0.5 rounded-full ${
                        isCouples ? "bg-pink-500" : "bg-accent"
                      }`}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className={`flex flex-col items-center justify-center gap-0.5 ${
                      routeActive 
                        ? isCouples ? "text-pink-500" : "text-accent" 
                        : "text-muted-foreground"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                  >
                    {'isLuna' in tab && tab.isLuna ? (
                      <div className="relative">
                        <LunaAvatar size="xs" showGlow={routeActive} />
                        {routeActive && (
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-accent/20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    ) : (
                      <Icon className={`w-5 h-5 ${routeActive ? "stroke-[2.5]" : ""} ${
                        isCouples && routeActive ? "fill-pink-500/20" : ""
                      }`} />
                    )}
                    <span className={`text-[10px] font-medium ${routeActive ? "font-semibold" : ""}`}>
                      {tab.label}
                    </span>
                  </motion.div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
