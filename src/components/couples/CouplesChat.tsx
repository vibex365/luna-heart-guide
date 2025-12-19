import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Mic, MessageCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { VideoRecorderButton } from "./VideoRecorderButton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { cn } from "@/lib/utils";

interface CouplesChatProps {
  partnerLinkId: string;
  partnerName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  partner_link_id: string;
  sender_id: string;
  message_type: "text" | "voice" | "video" | "image";
  content: string | null;
  media_url: string | null;
  media_duration: number | null;
  thumbnail_url: string | null;
  is_read: boolean;
  created_at: string;
}

export const CouplesChat = ({ partnerLinkId, partnerName, onClose }: CouplesChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voiceRecorder = useVoiceRecorder({ maxDuration: 60 });
  const videoRecorder = useVideoRecorder({ maxDuration: 60 });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["couples-messages", partnerLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_messages")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!partnerLinkId,
  });

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`couples-chat-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couples_messages",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["couples-messages", partnerLinkId] });
          
          // Mark as read if from partner
          if (payload.new.sender_id !== user?.id) {
            markAsRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerLinkId, user?.id, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Mark messages as read
  const markAsRead = async (messageId: string) => {
    await supabase
      .from("couples_messages")
      .update({ is_read: true })
      .eq("id", messageId);
  };

  // Mark unread messages as read on mount
  useEffect(() => {
    const markUnreadAsRead = async () => {
      if (!user) return;
      await supabase
        .from("couples_messages")
        .update({ is_read: true })
        .eq("partner_link_id", partnerLinkId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    };
    markUnreadAsRead();
  }, [partnerLinkId, user]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      messageType: "text" | "voice" | "video" | "image";
      content?: string;
      mediaUrl?: string;
      mediaDuration?: number;
      thumbnailUrl?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("couples_messages").insert({
        partner_link_id: partnerLinkId,
        sender_id: user.id,
        message_type: data.messageType,
        content: data.content || null,
        media_url: data.mediaUrl || null,
        media_duration: data.mediaDuration || null,
        thumbnail_url: data.thumbnailUrl || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-messages", partnerLinkId] });
      setMessage("");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const handleSendText = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      messageType: "text",
      content: message.trim(),
    });
  };

  const handleSendVoice = async () => {
    if (!user) return;
    const audioUrl = await voiceRecorder.uploadAudio(user.id, partnerLinkId);
    if (audioUrl) {
      sendMessageMutation.mutate({
        messageType: "voice",
        mediaUrl: audioUrl,
        mediaDuration: voiceRecorder.duration,
      });
      voiceRecorder.clearAudio();
    }
  };

  const handleSendVideo = async () => {
    if (!user) return;
    const result = await videoRecorder.uploadVideo(partnerLinkId, user.id);
    if (result) {
      sendMessageMutation.mutate({
        messageType: "video",
        mediaUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        mediaDuration: videoRecorder.duration,
      });
      videoRecorder.clearVideo();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur-lg">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            {partnerName}
          </h2>
          <p className="text-xs text-muted-foreground">Private chat</p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground/70">
              Send a message, voice note, or video to start chatting
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                messageType={msg.message_type}
                content={msg.content || undefined}
                mediaUrl={msg.media_url || undefined}
                mediaDuration={msg.media_duration || undefined}
                thumbnailUrl={msg.thumbnail_url || undefined}
                isOwn={msg.sender_id === user?.id}
                isRead={msg.is_read}
                createdAt={msg.created_at}
                senderName={msg.sender_id !== user?.id ? partnerName : undefined}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-background/95 backdrop-blur-lg">
        <AnimatePresence mode="wait">
          {isVoiceMode ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVoiceMode(false);
                  voiceRecorder.cancelRecording();
                }}
              >
                Cancel
              </Button>
              <div className="flex-1 flex justify-center">
                <VoiceRecorderButton
                  isRecording={voiceRecorder.isRecording}
                  isUploading={voiceRecorder.isUploading}
                  duration={voiceRecorder.duration}
                  onStartRecording={voiceRecorder.startRecording}
                  onStopRecording={handleSendVoice}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
            >
              {/* Video button */}
              <VideoRecorderButton
                isRecording={videoRecorder.isRecording}
                isUploading={videoRecorder.isUploading}
                isPreviewing={videoRecorder.isPreviewing}
                duration={videoRecorder.duration}
                stream={videoRecorder.stream}
                previewUrl={videoRecorder.previewUrl}
                onStartCamera={videoRecorder.startCamera}
                onStartRecording={videoRecorder.startRecording}
                onStopRecording={videoRecorder.stopRecording}
                onSend={handleSendVideo}
                onRetake={videoRecorder.retakeVideo}
                onCancel={videoRecorder.cancelRecording}
              />

              {/* Voice button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVoiceMode(true)}
                className="text-primary"
              >
                <Mic className="w-5 h-5" />
              </Button>

              {/* Text input */}
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
              />

              {/* Send button */}
              <Button
                size="icon"
                onClick={handleSendText}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className={cn(
                  "rounded-full transition-all",
                  message.trim() ? "bg-primary" : "bg-muted"
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
