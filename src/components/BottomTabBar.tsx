import { NavLink, useLocation } from "react-router-dom";
import { MessageCircle, SmilePlus, BookOpen, Wind, User } from "lucide-react";
import { motion } from "framer-motion";
import LunaAvatar from "./LunaAvatar";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

const tabs = [
  { to: "/chat", icon: MessageCircle, label: "Chat", isLuna: true },
  { to: "/mood", icon: SmilePlus, label: "Mood" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/breathe", icon: Wind, label: "Breathe" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomTabBar = () => {
  const location = useLocation();
  const { trigger } = useHapticFeedback();

  const handleTabPress = () => {
    trigger("selection");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          const Icon = tab.icon;

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
                      className="absolute inset-x-2 top-0 h-0.5 bg-accent rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className={`flex flex-col items-center justify-center gap-0.5 ${
                      routeActive ? "text-accent" : "text-muted-foreground"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                  >
                    {tab.isLuna ? (
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
                      <Icon className={`w-5 h-5 ${routeActive ? "stroke-[2.5]" : ""}`} />
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
