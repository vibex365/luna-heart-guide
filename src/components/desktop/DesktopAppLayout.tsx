import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Wind, 
  Settings, 
  Users,
  ChevronLeft,
  ChevronRight,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import LunaAvatar from "@/components/LunaAvatar";
import OfflineIndicator from "@/components/OfflineIndicator";
import SocialLinks from "@/components/SocialLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DesktopAppLayoutProps {
  children: ReactNode;
  showContextPanel?: boolean;
}

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/chat", icon: null, label: "Luna", isLuna: true },
  { to: "/mood", icon: TrendingUp, label: "Mood" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/breathe", icon: Wind, label: "Breathe" },
  { to: "/couples", icon: Heart, label: "Couples" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
];

const DesktopAppLayout = ({ children, showContextPanel = false }: DesktopAppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { isTrialActive, isTrialExpired, trial } = useCouplesTrial();
  const daysRemaining = trial?.ends_at ? Math.max(0, Math.ceil((new Date(trial.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getCouplesBadge = () => {
    if (isTrialActive) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{daysRemaining}d left</Badge>;
    }
    if (isTrialExpired) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <OfflineIndicator />
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm shrink-0"
      >
        {/* Logo Area */}
        <div className="p-4 border-b border-border">
          <div className={cn(
            "flex items-center gap-3 transition-all",
            sidebarCollapsed && "justify-center"
          )}>
            <div className="relative">
              <LunaAvatar size="md" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-card" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <h1 className="font-heading font-bold text-foreground whitespace-nowrap">Luna</h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Your wellness companion</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || 
                (item.to !== "/" && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              
              if (!user && item.to !== "/chat" && item.to !== "/") return null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                    isActive 
                      ? "bg-accent/15 text-accent shadow-soft" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    sidebarCollapsed && "justify-center px-3"
                  )}
                >
                  {item.isLuna ? (
                    <LunaAvatar size="xs" />
                  ) : Icon ? (
                    <Icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive && "text-accent"
                    )} />
                  ) : null}
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && item.to === "/couples" && getCouplesBadge()}
                </NavLink>
              );
            })}

            <Separator className="my-3" />

            <NavLink
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                location.pathname === "/settings"
                  ? "bg-accent/15 text-accent shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                sidebarCollapsed && "justify-center px-3"
              )}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">Settings</span>
              )}
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  location.pathname.startsWith("/admin")
                    ? "bg-accent/15 text-accent shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-3"
                )}
              >
                <Users className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium">Admin</span>
                )}
              </NavLink>
            )}
          </nav>
        </ScrollArea>

        {/* Upgrade CTA */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-border">
            <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-peach/10 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Unlock unlimited conversations and premium features
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => navigate("/subscription")}
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  View Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* Social Links */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Follow Luna</p>
            <SocialLinks className="flex-wrap" />
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Navigation */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <LunaAvatar size="sm" />
              <span className="font-heading font-semibold">Luna</span>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                
                if (!user && item.to !== "/chat" && item.to !== "/") return null;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isActive ? "bg-accent/15 text-accent" : "text-muted-foreground"
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
        <main className="flex-1 min-h-0 lg:max-w-5xl lg:mx-auto w-full">
          <div className="lg:pt-0 pt-16 min-h-screen">
            {children}
          </div>
        </main>
      </div>

      {/* Context Panel (Optional) */}
      {showContextPanel && (
        <aside className="hidden xl:block w-80 border-l border-border bg-card/30 p-6">
          <div className="space-y-6">
            {/* Daily Insight */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Today's Insight</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Small moments of mindfulness throughout the day can create lasting peace."
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Mood check-ins</span>
                  <span className="text-sm font-medium">5</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Journal entries</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Breathing sessions</span>
                  <span className="text-sm font-medium">7</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default DesktopAppLayout;
