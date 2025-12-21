import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { VideoMessagePlayer } from "./VideoMessagePlayer";
import { ReactionPicker } from "./ReactionPicker";
import { ReplyPreview } from "./ReplyPreview";
import { Check, CheckCheck, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReplyToMessage {
  id: string;
  content: string | null;
  message_type: string;
  sender_id: string;
}

interface ChatMessageProps {
  id: string;
  messageType: "text" | "voice" | "video" | "image" | "sticker";
  content?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  thumbnailUrl?: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  reactions?: Record<string, string> | null;
  replyTo?: ReplyToMessage | null;
  replyToSenderName?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onScrollToMessage?: (messageId: string) => void;
  currentUserId?: string;
}

export const ChatMessage = ({
  id,
  messageType,
  content,
  mediaUrl,
  mediaDuration,
  thumbnailUrl,
  isOwn,
  isRead,
  createdAt,
  senderName,
  reactions,
  replyTo,
  replyToSenderName,
  onReact,
  onReply,
  onScrollToMessage,
  currentUserId,
}: ChatMessageProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const time = format(new Date(createdAt), "h:mm a");

  // Get reactions display
  const reactionEntries = reactions ? Object.entries(reactions) : [];
  const myReaction = currentUserId && reactions ? reactions[currentUserId] : undefined;

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDoubleTap = () => {
    if (onReact) {
      // Quick react with heart on double tap
      onReact("❤️");
    }
  };

  const handleReactionSelect = (emoji: string) => {
    if (onReact) {
      // If same reaction, remove it
      if (myReaction === emoji) {
        onReact("");
      } else {
        onReact(emoji);
      }
    }
    setShowReactionPicker(false);
    setShowActions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex relative", isOwn ? "justify-end" : "justify-start")}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onDoubleClick={handleDoubleTap}
    >
      {/* Action Overlay */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setShowActions(false)}
          />
        )}
      </AnimatePresence>

      <div className={cn("relative max-w-[80%]", showActions && "z-40")}>
        {/* Quick Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "absolute -top-12 flex items-center gap-2",
                isOwn ? "right-0" : "left-0"
              )}
            >
              <button
                onClick={() => {
                  setShowReactionPicker(true);
                  setShowActions(false);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-card shadow-lg border border-border"
              >
                <span className="text-lg">😊</span>
              </button>
              {onReply && (
                <button
                  onClick={() => {
                    onReply();
                    setShowActions(false);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-card shadow-lg border border-border"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction Picker */}
        <div className="relative">
          <ReactionPicker
            isOpen={showReactionPicker}
            onSelect={handleReactionSelect}
            onClose={() => setShowReactionPicker(false)}
            existingReaction={myReaction}
          />
        </div>

        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          )}
        >
          {/* Sender name for partner messages */}
          {!isOwn && senderName && (
            <div className="px-3 pt-2 pb-0">
              <span className="text-xs font-medium text-muted-foreground">
                {senderName}
              </span>
            </div>
          )}

          {/* Reply Quote */}
          {replyTo && (
            <div className="px-3 pt-2">
              <ReplyPreview
                replyTo={replyTo}
                senderName={replyToSenderName || ""}
                onClear={() => {}}
                isInMessage
                onClick={() => onScrollToMessage?.(replyTo.id)}
              />
            </div>
          )}

          {/* Message content based on type */}
          {messageType === "text" && content && (
            <div className="px-3 py-2">
              <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
            </div>
          )}

          {messageType === "sticker" && content && (
            <div className="p-3 flex items-center justify-center">
              <span className="text-6xl">{content}</span>
            </div>
          )}

          {messageType === "voice" && mediaUrl && (
            <div className="p-2">
              <VoiceMessagePlayer
                audioUrl={mediaUrl}
                className={cn(
                  "bg-transparent border-0",
                  isOwn ? "text-primary-foreground" : ""
                )}
              />
            </div>
          )}

          {messageType === "video" && mediaUrl && (
            <div className="w-64 aspect-[9/16]">
              <VideoMessagePlayer
                videoUrl={mediaUrl}
                thumbnailUrl={thumbnailUrl}
                duration={mediaDuration}
                className="w-full h-full"
              />
            </div>
          )}

          {messageType === "image" && mediaUrl && (
            <img
              src={mediaUrl}
              alt="Shared image"
              className="w-64 max-h-96 object-cover"
            />
          )}

          {/* Time and read status */}
          <div
            className={cn(
              "flex items-center gap-1 px-3 pb-1.5 pt-0.5",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {time}
            </span>
            {isOwn && (
              <span className={cn(isRead ? "text-primary-foreground" : "text-primary-foreground/50")}>
                {isRead ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Display */}
        {reactionEntries.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute -bottom-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-card shadow-md border border-border",
              isOwn ? "right-2" : "left-2"
            )}
          >
            {reactionEntries.map(([userId, emoji]) => (
              <motion.span
                key={userId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm"
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
