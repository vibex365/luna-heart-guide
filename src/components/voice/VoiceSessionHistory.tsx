import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageSquare, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { SessionDetailSheet } from "./SessionDetailSheet";

interface TranscriptMessage {
  speaker: 'user' | 'luna';
  text: string;
  timestamp?: string;
}

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
  transcript: string | null;
  luna_transcript: string | null;
  structured_transcript: unknown;
  audio_url: string | null;
  safety_flagged: boolean;
  ai_summary: string | null;
  ai_notes: string[] | null;
  ai_recommendations: string[] | null;
  created_at: string;
}

export const VoiceSessionHistory = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<VoiceSession | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
      return data as unknown as VoiceSession[];
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

  const openSessionDetail = (session: VoiceSession) => {
    setSelectedSession(session);
    setSheetOpen(true);
  };

  const getPreviewText = (session: VoiceSession) => {
    // Try structured transcript first
    const structuredTranscript = session.structured_transcript as TranscriptMessage[] | null;
    if (structuredTranscript && Array.isArray(structuredTranscript) && structuredTranscript.length > 0) {
      const firstMessage = structuredTranscript[0];
      const text = firstMessage.text;
      return text.length > 60 ? text.slice(0, 60) + '...' : text;
    }
    // Fall back to regular transcript
    if (session.transcript) {
      const text = session.transcript.split('\n')[0] || session.transcript;
      return text.length > 60 ? text.slice(0, 60) + '...' : text;
    }
    return 'No transcript available';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => openSessionDetail(session)}
              className="w-full text-left p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {session.session_type} Session
                      </span>
                      {session.safety_flagged && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      {session.ai_summary && (
                        <Sparkles className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getPreviewText(session)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {session.start_time && formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(session.duration_seconds)}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <SessionDetailSheet
        session={selectedSession}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};
