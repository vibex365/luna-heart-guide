import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { VideoMessagePlayer } from "./VideoMessagePlayer";
import { Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  id: string;
  messageType: "text" | "voice" | "video" | "image";
  content?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  thumbnailUrl?: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
}

export const ChatMessage = ({
  messageType,
  content,
  mediaUrl,
  mediaDuration,
  thumbnailUrl,
  isOwn,
  isRead,
  createdAt,
  senderName,
}: ChatMessageProps) => {
  const time = format(new Date(createdAt), "h:mm a");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl overflow-hidden",
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

        {/* Message content based on type */}
        {messageType === "text" && content && (
          <div className="px-3 py-2">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
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
    </motion.div>
  );
};
