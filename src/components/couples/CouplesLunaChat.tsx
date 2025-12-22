import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Loader2, Sparkles, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LunaAvatar from "@/components/LunaAvatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CouplesLunaChatProps {
  isOpen: boolean;
  onClose: () => void;
  partnerLinkId: string;
  partnerName?: string;
  myName?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  user_id: string;
  created_at: string;
}

const UserBubbleAvatar = ({ isMe, name }: { isMe: boolean; name?: string }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
    isMe ? 'bg-primary/20' : 'bg-pink-500/20'
  }`}>
    <span className="text-xs font-medium">{name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}</span>
  </div>
);

export const CouplesLunaChat = ({ isOpen, onClose, partnerLinkId, partnerName, myName }: CouplesLunaChatProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["couples-luna-messages", partnerLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_luna_messages")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: isOpen && !!partnerLinkId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!isOpen || !partnerLinkId) return;

    const channel = supabase
      .channel(`couples-luna-${partnerLinkId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couples_luna_messages",
          filter: `partner_link_id=eq.${partnerLinkId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["couples-luna-messages", partnerLinkId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, partnerLinkId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("couples_luna_messages")
        .delete()
        .eq("partner_link_id", partnerLinkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-luna-messages", partnerLinkId] });
      toast.success("Chat cleared");
    },
    onError: () => {
      toast.error("Failed to clear chat");
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      // Save user message to database
      const { error: insertError } = await supabase
        .from("couples_luna_messages")
        .insert({
          partner_link_id: partnerLinkId,
          user_id: user.id,
          role: "user",
          content: userMessage,
        });

      if (insertError) throw insertError;

      // Get conversation history for context
      const conversationHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];

      // Call the edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/couples-luna-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: conversationHistory,
            partnerLinkId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Save Luna's response to database
      if (fullContent.trim()) {
        const { error: lunaInsertError } = await supabase
          .from("couples_luna_messages")
          .insert({
            partner_link_id: partnerLinkId,
            user_id: user.id, // Store who triggered this response
            role: "assistant",
            content: fullContent.trim(),
          });

        if (lunaInsertError) {
          console.error("Error saving Luna response:", lunaInsertError);
        }
      }

      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: ["couples-luna-messages", partnerLinkId] });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-pink-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LunaAvatar size="md" />
              <div>
                <SheetTitle className="text-lg">Chat with Luna Together</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {partnerName ? `You & ${partnerName}` : "Shared couples chat"}
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearChatMutation.mutate()}
                disabled={clearChatMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(85vh-140px)] p-4" ref={scrollRef}>
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full p-4 mb-4">
                <Sparkles className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="font-semibold mb-2">Welcome to Couples Luna Chat!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Chat with Luna together. Both of you can see and participate in this conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  {message.role === "assistant" && <LunaAvatar size="sm" />}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "assistant"
                        ? "bg-muted text-foreground"
                        : message.user_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-pink-500 text-white"
                    }`}
                  >
                    {message.role === "user" && message.user_id !== user?.id && (
                      <p className="text-xs opacity-80 mb-1">{partnerName || "Partner"}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <UserBubbleAvatar 
                      isMe={message.user_id === user?.id} 
                      name={message.user_id === user?.id ? myName : partnerName} 
                    />
                  )}
                </div>
              ))}

              {streamingContent && (
                <div className="flex gap-3 justify-start">
                  <LunaAvatar size="sm" />
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground">
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                  </div>
                </div>
              )}

              {isLoading && !streamingContent && (
                <div className="flex gap-3 justify-start">
                  <LunaAvatar size="sm" />
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luna together..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
