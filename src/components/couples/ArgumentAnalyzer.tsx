import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Pause, Play, Loader2, Brain, AlertCircle, CheckCircle2, Lightbulb, Target, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ArgumentAnalyzerProps {
  partnerLinkId: string;
  onAnalysisComplete?: () => void;
}

interface AnalysisScore {
  score: number;
  example: string;
  tip: string;
}

interface Analysis {
  summary: string;
  scores: {
    clarity: AnalysisScore;
    emotional_awareness: AnalysisScore;
    listening: AnalysisScore;
    resolution_focus: AnalysisScore;
  };
  patterns: {
    positive: string[];
    growth_areas: string[];
  };
  action_items: { title: string; description: string }[];
  overall_score: number;
}

export const ArgumentAnalyzer = ({ partnerLinkId, onAnalysisComplete }: ArgumentAnalyzerProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'idle' | 'recording' | 'paused' | 'analyzing' | 'complete'>('idle');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [duration, setDuration] = useState(0);
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setMode('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setMode('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setMode('recording');
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        mediaRecorderRef.current!.stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        resolve(blob);
      };
      mediaRecorderRef.current!.stop();
    });
  };

  const analyzeConversation = async (text: string) => {
    if (!text.trim() || !user) {
      toast.error("Please enter a conversation to analyze");
      return;
    }

    setMode('analyzing');

    try {
      // Create the analysis record
      const { data: analysisRecord, error: createError } = await supabase
        .from('argument_analyses')
        .insert({
          partner_link_id: partnerLinkId,
          recorded_by: user.id,
          title: `Analysis - ${new Date().toLocaleDateString()}`,
          duration_seconds: duration || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call the analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-argument', {
        body: { 
          analysisId: analysisRecord.id,
          transcript: text 
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      setMode('complete');
      toast.success("Analysis complete!");
      onAnalysisComplete?.();
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "Failed to analyze conversation");
      setMode('idle');
    }
  };

  const handleAudioAnalysis = async () => {
    const audioBlob = await stopRecording();
    // For now, we'll ask user to type what was said
    // In a production app, you'd use speech-to-text here
    toast.info("Audio captured! Please type a summary of what was discussed.");
    setMode('idle');
    setInputMode('text');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ScoreCard = ({ label, data, icon: Icon, color }: { 
    label: string; 
    data: AnalysisScore; 
    icon: any;
    color: string;
  }) => (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">{label}</span>
          </div>
          <div className="text-2xl font-bold">{data.score}/10</div>
        </div>
        <Progress value={data.score * 10} className="h-2" />
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground italic">"{data.example}"</p>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-foreground">{data.tip}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (mode === 'complete' && analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Overall Score */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-6xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {analysis.overall_score.toFixed(1)}
            </div>
            <p className="text-muted-foreground">Overall Communication Score</p>
            <p className="text-sm">{analysis.summary}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="scores" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="space-y-4 mt-4">
            <ScoreCard 
              label="Clarity of Points" 
              data={analysis.scores.clarity}
              icon={MessageSquare}
              color="bg-blue-500"
            />
            <ScoreCard 
              label="Emotional Awareness" 
              data={analysis.scores.emotional_awareness}
              icon={Heart}
              color="bg-pink-500"
            />
            <ScoreCard 
              label="Listening Quality" 
              data={analysis.scores.listening}
              icon={Brain}
              color="bg-purple-500"
            />
            <ScoreCard 
              label="Resolution Focus" 
              data={analysis.scores.resolution_focus}
              icon={Target}
              color="bg-green-500"
            />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  What's Working
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.patterns.positive.map((pattern, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {pattern}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.patterns.growth_areas.map((area, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {area}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            {analysis.action_items.map((item, i) => (
              <Card key={i} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <Button 
          onClick={() => {
            setMode('idle');
            setAnalysis(null);
            setTranscript('');
            setDuration(0);
          }}
          variant="outline"
          className="w-full"
        >
          Analyze Another Conversation
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">Turn Arguments Into Insights</h2>
          <p className="text-sm text-muted-foreground">
            Take a breath, reflect, and discover how to grow together—without blame or judgment.
          </p>
        </CardContent>
      </Card>

      {/* Input Mode Toggle */}
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'text' | 'audio')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Type Conversation</TabsTrigger>
          <TabsTrigger value="audio">Record Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 mt-4">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or paste your conversation here. Include both partners' words, for example:

Partner A: I feel like you never listen to me when I'm stressed about work.

Partner B: That's not true, I always try to help but you just want to vent.

Partner A: I do want to vent sometimes, is that so bad?

..."
            className="min-h-48 resize-none"
          />
          <Button
            onClick={() => analyzeConversation(transcript)}
            disabled={!transcript.trim() || mode === 'analyzing'}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {mode === 'analyzing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Conversation
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="audio" className="mt-4">
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Record your conversation. Both partners should be present.
                    </p>
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  </motion.div>
                )}

                {(mode === 'recording' || mode === 'paused') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
                      mode === 'recording' 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-amber-500'
                    }`}>
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-3xl font-mono font-bold">
                      {formatDuration(duration)}
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={mode === 'recording' ? pauseRecording : resumeRecording}
                        variant="outline"
                        size="lg"
                      >
                        {mode === 'recording' ? (
                          <><Pause className="w-4 h-4 mr-2" /> Pause</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" /> Resume</>
                        )}
                      </Button>
                      <Button
                        onClick={handleAudioAnalysis}
                        variant="default"
                        size="lg"
                        className="bg-gradient-to-r from-violet-500 to-purple-500"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop & Analyze
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 py-8"
                >
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-violet-500" />
                  <p className="text-muted-foreground">Analyzing your conversation...</p>
                  <p className="text-xs text-muted-foreground">This may take a moment</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Tips for best results:</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Include both partners' perspectives</li>
                <li>Be as accurate as possible about what was said</li>
                <li>It's okay to paraphrase if you don't remember exact words</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
