import { NavLink, useLocation } from "react-router-dom";
import { MessageCircle, SmilePlus, BookOpen, Wind, User, Heart, Shield, Sparkles, Headphones, Gift } from "lucide-react";
import { motion } from "framer-motion";
import LunaAvatar from "./LunaAvatar";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { Badge } from "@/components/ui/badge";

const baseTabs: { to: string; icon: any; label: string; isLuna?: boolean; isCouples?: boolean; isAdmin?: boolean }[] = [
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
  const { isAdmin } = useUserRole();
  const { hasCouplesAccess, isTrialActive, canStartTrial, trialDaysLeft } = useCouplesTrial();

  // Always show Couples tab for all logged-in users
  let tabs = user
    ? [
        baseTabs[0], // Chat
        { to: "/couples", icon: Heart, label: "Couples", isCouples: true },
        { to: "/referrals", icon: Gift, label: "Referrals", isReferral: true },
        { to: "/library", icon: BookOpen, label: "Library" },
        baseTabs[4], // Profile
      ]
    : baseTabs;

  // Add admin tab if user is admin
  if (isAdmin) {
    tabs = [
      ...tabs.slice(0, 4),
      { to: "/admin", icon: Shield, label: "Admin", isAdmin: true },
    ];
  }

  const handleTabPress = () => {
    trigger("selection");
  };

  // Get badge for couples tab
  const getCouplesBadge = () => {
    if (isTrialActive && trialDaysLeft <= 2) {
      return (
        <Badge 
          variant="outline" 
          className="absolute -top-1.5 -right-0.5 px-1 py-0 text-[8px] bg-orange-500/20 text-orange-500 border-orange-500/50"
        >
          {trialDaysLeft}d
        </Badge>
      );
    }
    if (canStartTrial && !hasCouplesAccess) {
      return (
        <Badge 
          variant="outline" 
          className="absolute -top-1.5 -right-0.5 px-1 py-0 text-[8px] bg-pink-500/20 text-pink-500 border-pink-500/50 flex items-center gap-0.5"
        >
          <Sparkles className="w-2 h-2" />
        </Badge>
      );
    }
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to || 
            ('isAdmin' in tab && tab.isAdmin && location.pathname.startsWith('/admin'));
          const Icon = tab.icon;
          const isCouples = 'isCouples' in tab && tab.isCouples;
          const isAdminTab = 'isAdmin' in tab && tab.isAdmin;
          const isVoice = 'isVoice' in tab && tab.isVoice;
          const isReferral = 'isReferral' in tab && tab.isReferral;

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
                        isCouples ? "bg-pink-500" : isAdminTab ? "bg-yellow-500" : isVoice ? "bg-primary" : isReferral ? "bg-green-500" : "bg-accent"
                      }`}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className={`flex flex-col items-center justify-center gap-0.5 ${
                      routeActive 
                        ? isCouples ? "text-pink-500" : isAdminTab ? "text-yellow-500" : isVoice ? "text-primary" : isReferral ? "text-green-500" : "text-accent" 
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
                      <div className="relative">
                        <Icon className={`w-5 h-5 ${routeActive ? "stroke-[2.5]" : ""} ${
                          isCouples && routeActive ? "fill-pink-500/20" : ""
                        }`} />
                        {isCouples && getCouplesBadge()}
                      </div>
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
