import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Mic, MessageCircle, Heart, Smile } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { VideoRecorderButton } from "./VideoRecorderButton";
import { StickerPicker } from "./StickerPicker";
import { FlirtyEmojiButton } from "./FlirtyEmojiButton";
import { ReplyPreview } from "./ReplyPreview";
import { TypingIndicator } from "./TypingIndicator";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { notifyPartner } from "@/utils/smsNotifications";
import { cn } from "@/lib/utils";
import { Sticker } from "@/data/chatStickers";

interface CouplesChatProps {
  partnerLinkId: string;
  partnerName: string;
  partnerId: string;
  senderName: string;
  onClose: () => void;
}

interface ReplyToMessage {
  id: string;
  content: string | null;
  message_type: string;
  sender_id: string;
}

interface Message {
  id: string;
  partner_link_id: string;
  sender_id: string;
  message_type: "text" | "voice" | "video" | "image" | "sticker";
  content: string | null;
  media_url: string | null;
  media_duration: number | null;
  thumbnail_url: string | null;
  is_read: boolean;
  created_at: string;
  reactions: Record<string, string> | null;
  reply_to_id: string | null;
}

export const CouplesChat = ({ partnerLinkId, partnerName, partnerId, senderName, onClose }: CouplesChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const voiceRecorder = useVoiceRecorder({ maxDuration: 60 });
  const videoRecorder = useVideoRecorder({ maxDuration: 60 });
  const { isPartnerTyping, handleTyping, clearTyping } = useTypingIndicator({
    partnerLinkId,
    partnerId,
  });

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

  // Create a map of messages for quick lookup
  const messagesMap = new Map(messages.map((m) => [m.id, m]));

  // Subscribe to real-time messages and updates
  useEffect(() => {
    const channel = supabase
      .channel(`couples-chat-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples_messages",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["couples-messages", partnerLinkId] });
          
          // Mark as read if new message from partner
          if (payload.eventType === "INSERT" && payload.new.sender_id !== user?.id) {
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
      messageType: "text" | "voice" | "video" | "image" | "sticker";
      content?: string;
      mediaUrl?: string;
      mediaDuration?: number;
      thumbnailUrl?: string;
      replyToId?: string;
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
        reply_to_id: data.replyToId || null,
      });

      if (error) throw error;

      // Send SMS notification to partner
      if (partnerId) {
        const notifyType = data.messageType === "sticker" ? "text" : data.messageType;
        notifyPartner.newMessage(partnerId, senderName, notifyType);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-messages", partnerLinkId] });
      setMessage("");
      setReplyTo(null);
      clearTyping();
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Update reaction mutation
  const updateReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");

      const msg = messagesMap.get(messageId);
      if (!msg) throw new Error("Message not found");

      const currentReactions = msg.reactions || {};
      let newReactions: Record<string, string>;

      if (emoji === "" || currentReactions[user.id] === emoji) {
        // Remove reaction
        const { [user.id]: _, ...rest } = currentReactions;
        newReactions = rest;
      } else {
        // Add/update reaction
        newReactions = { ...currentReactions, [user.id]: emoji };
      }

      const { error } = await supabase
        .from("couples_messages")
        .update({ reactions: newReactions })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-messages", partnerLinkId] });
    },
  });

  const handleSendText = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      messageType: "text",
      content: message.trim(),
      replyToId: replyTo?.id,
    });
  };

  const handleSendSticker = (sticker: Sticker) => {
    sendMessageMutation.mutate({
      messageType: "sticker",
      content: sticker.emoji,
      replyToId: replyTo?.id,
    });
    setShowStickerPicker(false);
  };

  const handleSendVoice = async () => {
    if (!user) return;
    const audioUrl = await voiceRecorder.uploadAudio(user.id, partnerLinkId);
    if (audioUrl) {
      sendMessageMutation.mutate({
        messageType: "voice",
        mediaUrl: audioUrl,
        mediaDuration: voiceRecorder.duration,
        replyToId: replyTo?.id,
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
        replyToId: replyTo?.id,
      });
      videoRecorder.clearVideo();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleReply = (msg: Message) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      message_type: msg.message_type,
      sender_id: msg.sender_id,
    });
    inputRef.current?.focus();
  };

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current.get(messageId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("animate-pulse");
      setTimeout(() => element.classList.remove("animate-pulse"), 1000);
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
          <AnimatePresence mode="wait">
            {isPartnerTyping ? (
              <motion.p
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-primary"
              >
                typing...
              </motion.p>
            ) : (
              <motion.p
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                Private chat
              </motion.p>
            )}
          </AnimatePresence>
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
          <div className="space-y-4">
            {messages.map((msg) => {
              const replyToMsg = msg.reply_to_id ? messagesMap.get(msg.reply_to_id) : null;
              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    if (el) messageRefs.current.set(msg.id, el);
                  }}
                >
                  <ChatMessage
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
                    reactions={msg.reactions}
                    replyTo={replyToMsg ? {
                      id: replyToMsg.id,
                      content: replyToMsg.content,
                      message_type: replyToMsg.message_type,
                      sender_id: replyToMsg.sender_id,
                    } : null}
                    replyToSenderName={replyToMsg?.sender_id === user?.id ? "You" : partnerName}
                    currentUserId={user?.id}
                    onReact={(emoji) => updateReactionMutation.mutate({ messageId: msg.id, emoji })}
                    onReply={() => handleReply(msg)}
                    onScrollToMessage={scrollToMessage}
                  />
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {isPartnerTyping && (
                <TypingIndicator partnerName={partnerName} />
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-background/95 backdrop-blur-lg relative">
        {/* Sticker Picker */}
        <StickerPicker
          isOpen={showStickerPicker}
          onSelect={handleSendSticker}
          onClose={() => setShowStickerPicker(false)}
        />

        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <ReplyPreview
              replyTo={replyTo}
              senderName={replyTo.sender_id === user?.id ? "You" : partnerName}
              onClear={() => setReplyTo(null)}
            />
          )}
        </AnimatePresence>

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
              {/* Sticker button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              >
                <Smile className="w-5 h-5" />
              </Button>

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
                className="h-10 w-10 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
              />

              {/* Flirty emoji button */}
              <FlirtyEmojiButton onSelect={handleSendSticker} />

              {/* Voice button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVoiceMode(true)}
                className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
              >
                <Mic className="w-5 h-5" />
              </Button>

              {/* Text input */}
              <Input
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
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
                  "rounded-full h-10 w-10 transition-all",
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
