import { useQuery } from "@tanstack/react-query";
import { Clock, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface VoiceSession {
  id: string;
  session_type: string;
  status: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  minutes_billed: number;
  cost_cents: number;
  luna_context_summary: string | null;
  safety_flagged: boolean;
  created_at: string;
}

export const VoiceSessionHistory = () => {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['voice-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as VoiceSession[];
    },
    enabled: !!user?.id
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ended':
        return <Badge variant="secondary">Completed</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'no_balance':
        return <Badge variant="outline">No Minutes</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No voice sessions yet</p>
            <p className="text-sm">Start your first conversation with Luna</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {session.session_type} Session
                  </span>
                  {session.safety_flagged && (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.start_time && formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                {getStatusBadge(session.status)}
              </div>
              {session.duration_seconds > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDuration(session.duration_seconds)} • {session.minutes_billed} min billed
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
