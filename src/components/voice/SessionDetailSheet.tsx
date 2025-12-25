import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  MessageSquare, 
  Lightbulb, 
  CheckCircle2, 
  FileText,
  Volume2,
  Sparkles,
  User,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

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

interface SessionDetailSheetProps {
  session: VoiceSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionDetailSheet = ({ session, open, onOpenChange }: SessionDetailSheetProps) => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    ai_summary: string | null;
    ai_notes: string[] | null;
    ai_recommendations: string[] | null;
  } | null>(null);

  useEffect(() => {
    if (session) {
      setAnalysis({
        ai_summary: session.ai_summary,
        ai_notes: session.ai_notes,
        ai_recommendations: session.ai_recommendations
      });
    }
  }, [session]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const analyzeSession = async () => {
    if (!session) return;
    
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-session-analyze', {
        body: { sessionId: session.id }
      });

      if (error) throw error;

      setAnalysis({
        ai_summary: data.ai_summary,
        ai_notes: data.ai_notes,
        ai_recommendations: data.ai_recommendations
      });

      toast({
        title: "Analysis Complete",
        description: "Your session has been analyzed successfully."
      });
    } catch (error) {
      console.error("Error analyzing session:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze this session.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadAudio = async () => {
    if (!session?.audio_url) return;
    
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
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        title: "Download Failed",
        description: "Could not download audio recording.",
        variant: "destructive"
      });
    }
  };

  const downloadTranscript = () => {
    if (!session) return;
    
    const sessionDate = format(new Date(session.start_time), 'yyyy-MM-dd HH:mm');
    let content = `Luna Voice Session - ${sessionDate}\n`;
    content += `Duration: ${formatDuration(session.duration_seconds)}\n`;
    content += `Type: ${session.session_type}\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    
    // Use structured transcript if available
    const structuredTranscript = session.structured_transcript as TranscriptMessage[] | null;
    if (structuredTranscript && Array.isArray(structuredTranscript) && structuredTranscript.length > 0) {
      content += "CONVERSATION:\n\n";
      structuredTranscript.forEach((msg) => {
        const speaker = msg.speaker === 'user' ? 'You' : 'Luna';
        content += `${speaker}: ${msg.text}\n\n`;
      });
    } else {
      if (session.transcript) {
        content += `YOUR WORDS:\n${session.transcript}\n\n`;
      }
      if (session.luna_transcript) {
        content += `LUNA'S RESPONSES:\n${session.luna_transcript}\n`;
      }
    }

    if (analysis?.ai_summary) {
      content += `\n${'='.repeat(50)}\n`;
      content += `\nSESSION SUMMARY:\n${analysis.ai_summary}\n`;
      
      if (analysis.ai_notes && analysis.ai_notes.length > 0) {
        content += `\nKEY NOTES:\n`;
        analysis.ai_notes.forEach((note, i) => {
          content += `${i + 1}. ${note}\n`;
        });
      }
      
      if (analysis.ai_recommendations && analysis.ai_recommendations.length > 0) {
        content += `\nRECOMMENDATIONS:\n`;
        analysis.ai_recommendations.forEach((rec, i) => {
          content += `${i + 1}. ${rec}\n`;
        });
      }
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

  // Return early if no session to prevent null access errors
  if (!session) return null;

  const structuredTranscriptForCheck = session.structured_transcript as TranscriptMessage[] | null;
  const hasConversation = (
    (structuredTranscriptForCheck && Array.isArray(structuredTranscriptForCheck) && structuredTranscriptForCheck.length > 0) ||
    session.transcript ||
    session.luna_transcript
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Session Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Session Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium capitalize">{session.session_type} Session</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.start_time), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatDuration(session.duration_seconds)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.minutes_billed} min billed
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {session.audio_url && (
                <Button variant="outline" size="sm" onClick={downloadAudio} className="flex-1">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Audio
                </Button>
              )}
              {hasConversation && (
                <Button variant="outline" size="sm" onClick={downloadTranscript} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Transcript
                </Button>
              )}
              {!analysis?.ai_summary && hasConversation && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={analyzeSession}
                  disabled={analyzing}
                  className="flex-1"
                >
                  <Sparkles className={`w-4 h-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              )}
            </div>

            {/* AI Analysis Section */}
            {analyzing ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : analysis?.ai_summary ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-primary">Session Summary</span>
                  </div>
                  <p className="text-sm">{analysis.ai_summary}</p>
                </div>

                {/* Notes */}
                {analysis.ai_notes && analysis.ai_notes.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">Key Notes</span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.ai_notes.map((note, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.ai_recommendations && analysis.ai_recommendations.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Recommendations</span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.ai_recommendations.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Conversation Transcript */}
            {hasConversation && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversation
                </h3>
                <div className="space-y-3 p-4 rounded-lg bg-muted/30 max-h-[400px] overflow-y-auto">
                  {(() => {
                    const transcript = session.structured_transcript as TranscriptMessage[] | null;
                    if (transcript && Array.isArray(transcript) && transcript.length > 0) {
                      return transcript.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`flex gap-3 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.speaker === 'luna' && (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div 
                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                              msg.speaker === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-br-md' 
                                : 'bg-muted rounded-bl-md'
                            }`}
                          >
                            {msg.text}
                          </div>
                          {msg.speaker === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ));
                    }
                    return (
                      <div className="space-y-4 text-sm">
                        {session.transcript && (
                          <div>
                            <Badge variant="outline" className="mb-2">You said</Badge>
                            <p className="whitespace-pre-wrap">{session.transcript}</p>
                          </div>
                        )}
                        {session.luna_transcript && (
                          <div>
                            <Badge variant="outline" className="mb-2">Luna responded</Badge>
                            <p className="whitespace-pre-wrap">{session.luna_transcript}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
