import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageCircle, Heart, BookOpen, Wind, Settings, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import LunaAvatar from "./LunaAvatar";
import DesktopBanner from "./DesktopBanner";
import OfflineIndicator from "./OfflineIndicator";
import SocialLinks from "./SocialLinks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DesktopLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/chat", icon: null, label: "Luna", isLuna: true },
  { to: "/mood", icon: Home, label: "Mood" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/breathe", icon: Wind, label: "Breathe" },
  { to: "/couples", icon: Heart, label: "Couples" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { isTrialActive, isTrialExpired } = useCouplesTrial();

  const getCouplesBadge = () => {
    if (isTrialActive) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Trial</Badge>;
    }
    if (isTrialExpired) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      <DesktopBanner />
      
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-card/50 hidden lg:flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <LunaAvatar size="md" />
              <div>
                <h1 className="font-semibold text-foreground">Luna</h1>
                <p className="text-xs text-muted-foreground">Your wellness companion</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              
              if (!user && item.to !== "/chat") return null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.isLuna ? (
                    <LunaAvatar size="xs" />
                  ) : Icon ? (
                    <Icon className="w-5 h-5" />
                  ) : null}
                  <span className="font-medium">{item.label}</span>
                  {item.to === "/couples" && getCouplesBadge()}
                </NavLink>
              );
            })}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  location.pathname.startsWith("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Social Links Footer */}
          <div className="p-4 border-t border-border mt-auto">
            <p className="text-xs text-muted-foreground mb-2">Follow Luna</p>
            <SocialLinks className="flex-wrap" />
          </div>
        </aside>

        {/* Top Navigation for smaller screens */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <LunaAvatar size="sm" />
              <span className="font-semibold">Luna</span>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                
                if (!user && item.to !== "/chat") return null;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.isLuna ? (
                      <MessageCircle className="w-5 h-5" />
                    ) : Icon ? (
                      <Icon className="w-5 h-5" />
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:max-w-4xl lg:mx-auto w-full">
          <div className="lg:pt-0 pt-16 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
