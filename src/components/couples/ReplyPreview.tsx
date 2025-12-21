import { X, Reply, Mic, Video, Image } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string | null;
    message_type: string;
    sender_id: string;
  };
  senderName: string;
  onClear: () => void;
  isInMessage?: boolean;
  onClick?: () => void;
}

export const ReplyPreview = ({ replyTo, senderName, onClear, isInMessage, onClick }: ReplyPreviewProps) => {
  const getTypeIcon = () => {
    switch (replyTo.message_type) {
      case "voice":
        return <Mic className="w-3 h-3" />;
      case "video":
        return <Video className="w-3 h-3" />;
      case "image":
        return <Image className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getPreviewText = () => {
    if (replyTo.content) {
      return replyTo.content.length > 80
        ? replyTo.content.substring(0, 80) + "..."
        : replyTo.content;
    }

    switch (replyTo.message_type) {
      case "voice":
        return "Voice message";
      case "video":
        return "Video message";
      case "image":
        return "Photo";
      case "sticker":
        return "Sticker";
      default:
        return "Message";
    }
  };

  // Compact version shown inside the message bubble
  if (isInMessage) {
    return (
      <button
        onClick={onClick}
        className="flex items-start gap-2 p-2 mb-1 rounded-lg bg-background/10 border-l-2 border-primary/50 text-left w-full hover:bg-background/20 transition-colors"
      >
        <Reply className="w-3 h-3 mt-0.5 opacity-70 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium opacity-70">{senderName}</p>
          <p className="text-xs truncate flex items-center gap-1">
            {getTypeIcon()}
            <span className="opacity-80">{getPreviewText()}</span>
          </p>
        </div>
      </button>
    );
  }

  // Full version shown above input
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-muted border-l-4 border-primary"
    >
      <Reply className="w-4 h-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">{senderName}</p>
        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
          {getTypeIcon()}
          {getPreviewText()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onClear}
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
