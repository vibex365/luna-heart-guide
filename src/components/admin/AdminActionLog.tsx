import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, 
  Ban, 
  CheckCircle, 
  Settings, 
  History,
  User
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActionLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, any>;
  reason: string | null;
  created_at: string;
}

const actionTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  subscription_change: { 
    icon: Crown, 
    label: "Subscription Change", 
    color: "text-amber-500" 
  },
  user_suspended: { 
    icon: Ban, 
    label: "User Suspended", 
    color: "text-destructive" 
  },
  user_restored: { 
    icon: CheckCircle, 
    label: "User Restored", 
    color: "text-green-500" 
  },
  settings_change: { 
    icon: Settings, 
    label: "Settings Updated", 
    color: "text-blue-500" 
  },
};

export const AdminActionLog = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-action-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_action_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as ActionLog[]) || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Admin Action Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Admin Action Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No actions recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => {
                const config = actionTypeConfig[log.action_type] || {
                  icon: Settings,
                  label: log.action_type,
                  color: "text-muted-foreground"
                };
                const Icon = config.icon;

                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`p-2 rounded-full bg-background ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {log.reason && (
                        <p className="text-sm text-foreground mt-1">
                          {log.reason}
                        </p>
                      )}
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-x-2">
                          {log.details.previous_tier && (
                            <span>
                              <span className="line-through">{log.details.previous_tier}</span>
                              {" → "}
                              <span className="text-foreground font-medium">{log.details.new_tier}</span>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {log.target_user_id && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{log.target_user_id}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};