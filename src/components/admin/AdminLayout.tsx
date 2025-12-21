import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Command,
  Newspaper
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    ]
  },
  {
    title: "Users & Revenue",
    items: [
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
      { icon: BarChart3, label: "Coins", path: "/admin/coins" },
    ]
  },
  {
    title: "Content & AI",
    items: [
      { icon: Brain, label: "Luna Settings", path: "/admin/luna" },
      { icon: FileText, label: "Content", path: "/admin/content" },
      { icon: Newspaper, label: "Blog", path: "/admin/blog" },
      { icon: Shield, label: "Feature Access", path: "/admin/features" },
    ]
  },
  {
    title: "Safety & Moderation",
    items: [
      { icon: AlertTriangle, label: "Safety", path: "/admin/safety" },
      { icon: MessageSquare, label: "Moderation", path: "/admin/moderation" },
    ]
  },
  {
    title: "Engagement",
    items: [
      { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
      { icon: Bell, label: "Notifications", path: "/admin/notifications" },
      { icon: BarChart3, label: "Funnels", path: "/admin/funnels" },
    ]
  },
  {
    title: "Settings",
    items: [
      { icon: Settings, label: "Settings", path: "/admin/settings" },
    ]
  }
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const currentPage = navSections
    .flatMap(s => s.items)
    .find(item => 
      location.pathname === item.path || 
      (item.path !== "/admin" && location.pathname.startsWith(item.path))
    );

  const NavContent = ({ onItemClick, isCollapsed }: { onItemClick?: () => void; isCollapsed?: boolean }) => (
    <TooltipProvider delayDuration={0}>
      <div className={cn("p-4", isCollapsed && "px-2")}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="p-2 rounded-xl bg-accent/20">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-heading font-bold text-foreground whitespace-nowrap">
                  Admin
                </h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Luna Dashboard</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 pr-12 bg-muted/50 border-0"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </div>
      )}
      
      <Separator />
      
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-6", isCollapsed ? "px-2" : "px-3")}>
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== "/admin" && location.pathname.startsWith(item.path));
                  
                  const linkContent = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onItemClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-accent text-accent-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator />
      
      {/* Footer Actions */}
      <div className={cn("p-3 space-y-1", isCollapsed && "px-2")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 text-muted-foreground hover:text-foreground",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={() => navigate("/chat")}
            >
              <Home className="h-4 w-4" />
              {!isCollapsed && <span>Back to App</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Back to App</TooltipContent>
          )}
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 text-muted-foreground hover:text-destructive",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Sign Out</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Collapse Toggle */}
      {!onItemClick && (
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </TooltipProvider>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex border-r border-border bg-card/50 backdrop-blur-sm flex-col shrink-0"
      >
        <NavContent isCollapsed={collapsed} />
      </motion.aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <LayoutDashboard className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <NavContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-4 w-4 text-accent shrink-0" />
            <span className="font-heading font-semibold text-sm truncate">
              {currentPage?.label || "Admin"}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto text-xs"
            onClick={() => navigate("/chat")}
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            App
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
