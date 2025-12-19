import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Eye, Shuffle, Heart, Bell, Loader2, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { finishSentencePrompts } from "@/data/intimateGameContent";
import { notifyPartner } from "@/utils/smsNotifications";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

interface FinishMySentenceProps {
  partnerLinkId?: string;
}

export const FinishMySentence = ({ partnerLinkId }: FinishMySentenceProps) => {
  const { user } = useAuth();
  const { partnerId } = useCouplesAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [myResponse, setMyResponse] = useState("");
  const [partnerResponse, setPartnerResponse] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [useVoice, setUseVoice] = useState(false);
  const [myVoiceUrl, setMyVoiceUrl] = useState<string | null>(null);
  const [partnerVoiceUrl, setPartnerVoiceUrl] = useState<string | null>(null);

  const voiceRecorder = useVoiceRecorder({
    maxDuration: 30,
    onRecordingComplete: (url) => setMyVoiceUrl(url),
  });

  // Fetch partner name
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .single();
      return data;
    },
    enabled: !!partnerId,
  });

  const partnerName = partnerProfile?.display_name || "Partner";

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId || !user) return;

    const channel = supabase
      .channel(`finish-sentence-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "intimate_game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const responses = newData.player_responses || {};
          
          // Update partner response
          if (partnerId && responses[partnerId]) {
            setPartnerResponse(responses[partnerId]);
          }
          
          // Update partner voice message
          const voiceMessages = newData.voice_messages || {};
          if (partnerId && voiceMessages[partnerId]) {
            setPartnerVoiceUrl(voiceMessages[partnerId]);
          }
          
          // Update revealed state
          if (newData.revealed) {
            setIsRevealed(true);
          }
          
          // Update prompt index
          if (newData.current_prompt_index !== currentPromptIndex) {
            setCurrentPromptIndex(newData.current_prompt_index);
            setMyResponse("");
            setPartnerResponse(null);
            setMyVoiceUrl(null);
            setPartnerVoiceUrl(null);
            setIsRevealed(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, partnerId, currentPromptIndex]);

  const startGame = async () => {
    if (!partnerLinkId || !user) return;

    try {
      // Delete any existing session
      await supabase
        .from("intimate_game_sessions")
        .delete()
        .eq("partner_link_id", partnerLinkId)
        .eq("game_type", "finish_sentence");

      // Create new session
      const randomIndex = Math.floor(Math.random() * finishSentencePrompts.length);
      const { data, error } = await supabase
        .from("intimate_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          started_by: user.id,
          game_type: "finish_sentence",
          current_prompt_index: randomIndex,
          player_responses: {},
          revealed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setCurrentPromptIndex(randomIndex);
      setIsPlaying(true);
      setMyResponse("");
      setPartnerResponse(null);
      setMyVoiceUrl(null);
      setPartnerVoiceUrl(null);
      setIsRevealed(false);

      // Notify partner - get current user's name for notification
      if (partnerId) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        const myName = myProfile?.display_name || "Your partner";
        await notifyPartner.gameStarted(partnerId, myName, "Finish My Sentence");
      }

      toast.success("Game started! Your partner has been notified.");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const submitResponse = async () => {
    if (!sessionId || !user || (!myResponse.trim() && !myVoiceUrl)) return;

    setIsSubmitting(true);
    try {
      // Get current session data
      const { data: session } = await supabase
        .from("intimate_game_sessions")
        .select("player_responses, voice_messages")
        .eq("id", sessionId)
        .single();

      const currentResponses = (session?.player_responses as Record<string, string>) || {};
      const currentVoice = (session?.voice_messages as Record<string, string>) || {};
      
      const updatedResponses = {
        ...currentResponses,
        [user.id]: myResponse.trim() || "[Voice Message]",
      };

      const updatedVoice = myVoiceUrl 
        ? { ...currentVoice, [user.id]: myVoiceUrl }
        : currentVoice;

      await supabase
        .from("intimate_game_sessions")
        .update({ 
          player_responses: updatedResponses,
          voice_messages: updatedVoice,
        })
        .eq("id", sessionId);

      toast.success("Response submitted!");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (voiceRecorder.isRecording) {
      if (sessionId && user) {
        await voiceRecorder.uploadAudio(user.id, sessionId);
      }
    } else {
      voiceRecorder.startRecording();
    }
  };

  const revealResponses = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from("intimate_game_sessions")
        .update({ revealed: true })
        .eq("id", sessionId);

      setIsRevealed(true);
    } catch (error) {
      console.error("Error revealing responses:", error);
    }
  };

  const nextPrompt = async () => {
    if (!sessionId) return;

    const newIndex = Math.floor(Math.random() * finishSentencePrompts.length);
    
    try {
      await supabase
        .from("intimate_game_sessions")
        .update({
          current_prompt_index: newIndex,
          player_responses: {},
          revealed: false,
        })
        .eq("id", sessionId);

      setCurrentPromptIndex(newIndex);
      setMyResponse("");
      setPartnerResponse(null);
      setMyVoiceUrl(null);
      setPartnerVoiceUrl(null);
      voiceRecorder.clearAudio();
      setIsRevealed(false);
    } catch (error) {
      console.error("Error going to next prompt:", error);
    }
  };

  const remindPartner = async () => {
    if (!partnerId || !user) return;
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    const myName = myProfile?.display_name || "Your partner";
    await notifyPartner.gameStarted(partnerId, myName, "Finish My Sentence");
    toast.success(`Reminder sent to ${partnerName}!`);
  };

  // Check if I've submitted
  const hasSubmitted = (myResponse.trim().length > 0 || myVoiceUrl) && !isRevealed;
  const bothSubmitted = partnerResponse !== null && (myResponse.trim().length > 0 || myVoiceUrl);

  if (!isPlaying) {
    return (
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            Finish My Sentence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Complete intimate sentence prompts and see how your partner finishes them. 
            A playful way to discover shared thoughts and desires! 💕
          </p>
          <Button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPrompt = finishSentencePrompts[currentPromptIndex];

  return (
    <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            Finish My Sentence
          </div>
          <Badge variant="outline" className="text-pink-300 border-pink-500/30">
            <Heart className="w-3 h-3 mr-1 fill-pink-400" />
            Intimate
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Prompt */}
        <motion.div
          key={currentPromptIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-background/50 rounded-lg border border-pink-500/20"
        >
          <p className="text-lg font-medium text-center italic">
            "{currentPrompt}"
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Voice/Text Toggle */}
              <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                <Label htmlFor="voice-mode" className="flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4" />
                  Voice Mode
                </Label>
                <Switch
                  id="voice-mode"
                  checked={useVoice}
                  onCheckedChange={setUseVoice}
                />
              </div>

              {/* My Response Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Your completion:</label>
                
                {useVoice ? (
                  <div className="space-y-3">
                    <VoiceRecorderButton
                      isRecording={voiceRecorder.isRecording}
                      isUploading={voiceRecorder.isUploading}
                      duration={voiceRecorder.duration}
                      onStartRecording={voiceRecorder.startRecording}
                      onStopRecording={handleVoiceRecord}
                      className="w-full"
                    />
                    {myVoiceUrl && (
                      <VoiceMessagePlayer 
                        audioUrl={myVoiceUrl} 
                        label="Your voice message"
                      />
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={myResponse}
                    onChange={(e) => setMyResponse(e.target.value)}
                    placeholder="Type how you'd finish this sentence..."
                    className="min-h-[80px] bg-background/50"
                  />
                )}
                
                <Button
                  onClick={submitResponse}
                  disabled={(!myResponse.trim() && !myVoiceUrl) || isSubmitting}
                  className="w-full"
                  variant="secondary"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Response
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm">
                <span className={myResponse.trim() ? "text-green-400" : "text-muted-foreground"}>
                  {myResponse.trim() ? "✓ You submitted" : "Waiting for your response..."}
                </span>
                <span className={partnerResponse ? "text-green-400" : "text-muted-foreground"}>
                  {partnerResponse ? `✓ ${partnerName} submitted` : `Waiting for ${partnerName}...`}
                </span>
              </div>

              {/* Reveal or Remind */}
              <div className="flex gap-2">
                {bothSubmitted ? (
                  <Button
                    onClick={revealResponses}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Responses
                  </Button>
                ) : (
                  <Button
                    onClick={remindPartner}
                    variant="outline"
                    className="flex-1"
                    disabled={!partnerId}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Remind {partnerName}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Revealed Responses */}
              <div className="grid gap-3">
                <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20 space-y-2">
                  <p className="text-xs text-pink-300">Your response:</p>
                  {myVoiceUrl ? (
                    <VoiceMessagePlayer audioUrl={myVoiceUrl} />
                  ) : (
                    <p className="text-sm">"{myResponse}"</p>
                  )}
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 space-y-2">
                  <p className="text-xs text-purple-300">{partnerName}'s response:</p>
                  {partnerVoiceUrl ? (
                    <VoiceMessagePlayer audioUrl={partnerVoiceUrl} />
                  ) : (
                    <p className="text-sm">"{partnerResponse || "No response yet"}"</p>
                  )}
                </div>
              </div>

              {/* Next Prompt */}
              <Button
                onClick={nextPrompt}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Next Sentence
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End Game */}
        <Button
          onClick={() => setIsPlaying(false)}
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
        >
          End Game
        </Button>
      </CardContent>
    </Card>
  );
};
