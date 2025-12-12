import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageFeedbackProps {
  messageId: string;
}

const feedbackTypes = [
  { value: "helpful", label: "Helpful", icon: ThumbsUp },
  { value: "not_helpful", label: "Not helpful", icon: ThumbsDown },
  { value: "inaccurate", label: "Inaccurate", icon: X },
  { value: "other", label: "Other", icon: MessageSquare },
];

export function MessageFeedback({ messageId }: MessageFeedbackProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Check if feedback already exists for this message
  const { data: existingFeedback } = useQuery({
    queryKey: ["message-feedback", messageId],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("message_feedback")
        .select("*")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("message_feedback").insert([
        {
          message_id: messageId,
          user_id: user.id,
          rating,
          feedback_type: feedbackType,
          feedback_text: feedbackText || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-feedback", messageId] });
      toast.success("Thank you for your feedback!");
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    },
  });

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setFeedbackType(null);
    setFeedbackText("");
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    submitFeedbackMutation.mutate();
  };

  // If feedback already submitted, show a subtle indicator
  if (existingFeedback) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3" />
        <span>Feedback submitted</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Rate response
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Rate this response</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              What type of feedback? (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {feedbackTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={feedbackType === type.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setFeedbackType(feedbackType === type.value ? null : type.value)
                  }
                >
                  <type.icon className="h-3 w-3 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Additional comments (optional)
            </p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us more..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={rating === 0 || submitFeedbackMutation.isPending}
            >
              Submit
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
