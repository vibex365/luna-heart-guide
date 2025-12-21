import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Shield,
  Brain,
  FileText,
  BarChart3,
  AlertTriangle,
  LogOut,
  MessageSquare,
  Bell,
  Megaphone,
  Menu,
  X,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: Shield, label: "Feature Access", path: "/admin/features" },
  { icon: Brain, label: "Luna Settings", path: "/admin/luna" },
  { icon: FileText, label: "Content", path: "/admin/content" },
  { icon: AlertTriangle, label: "Safety", path: "/admin/safety" },
  { icon: MessageSquare, label: "Moderation", path: "/admin/moderation" },
  { icon: BarChart3, label: "Coins", path: "/admin/coins" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: BarChart3, label: "Funnels", path: "/admin/funnels" },
  { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <>
      <div className="p-4 md:p-6">
        <h1 className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 md:h-5 md:w-5 text-accent" />
          Admin Panel
        </h1>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 px-2 md:px-3 py-3 md:py-4">
        <nav className="space-y-0.5 md:space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      
      <div className="p-2 md:p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 text-muted-foreground hover:text-foreground text-xs md:text-sm"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Get current page title
  const currentPage = navItems.find(item => 
    location.pathname === item.path || 
    (item.path !== "/admin" && location.pathname.startsWith(item.path))
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-border bg-card flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card sticky top-0 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <NavContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-4 w-4 text-accent shrink-0" />
            <span className="font-medium text-sm truncate">
              {currentPage?.label || "Admin"}
            </span>
          </div>

          <NavLink 
            to="/chat" 
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </NavLink>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
