import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageSquare, AlertTriangle, Download, FileText, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

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
  audio_url: string | null;
  safety_flagged: boolean;
  created_at: string;
}

export const VoiceSessionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingAudio, setDownloadingAudio] = useState<string | null>(null);

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

  const downloadTranscript = (session: VoiceSession) => {
    const sessionDate = format(new Date(session.start_time), 'yyyy-MM-dd HH:mm');
    let content = `Luna Voice Session - ${sessionDate}\n`;
    content += `Duration: ${formatDuration(session.duration_seconds)}\n`;
    content += `Type: ${session.session_type}\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    
    if (session.transcript) {
      content += `YOUR WORDS:\n${session.transcript}\n\n`;
    }
    
    if (session.luna_transcript) {
      content += `LUNA'S RESPONSES:\n${session.luna_transcript}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-voice-${format(new Date(session.start_time), 'yyyy-MM-dd-HHmm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAudio = async (session: VoiceSession) => {
    if (!session.audio_url) return;
    
    setDownloadingAudio(session.id);
    try {
      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .download(session.audio_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const extension = session.audio_url.split('.').pop() || 'webm';
      a.download = `luna-voice-${format(new Date(session.start_time), 'yyyy-MM-dd-HHmm')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your audio recording is downloading."
      });
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        title: "Download Failed",
        description: "Could not download audio recording.",
        variant: "destructive"
      });
    } finally {
      setDownloadingAudio(null);
    }
  };

  const hasTranscript = (session: VoiceSession) => {
    return !!(session.transcript || session.luna_transcript);
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

            <div className="flex items-center gap-1">
              {session.audio_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadAudio(session)}
                  className="h-8 w-8"
                  title="Download audio"
                  disabled={downloadingAudio === session.id}
                >
                  <Volume2 className={`w-4 h-4 ${downloadingAudio === session.id ? 'animate-pulse' : ''}`} />
                </Button>
              )}
              {hasTranscript(session) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => downloadTranscript(session)}
                  className="h-8 w-8"
                  title="Download transcript"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
