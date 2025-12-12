import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Plus, MessageCircle, LogOut, Trash2, Settings, Heart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import UserAvatar from "@/components/UserAvatar";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

const quickPrompts = [
  { label: "I feel hurt", message: "I'm feeling really hurt right now..." },
  { label: "I feel confused", message: "I'm so confused about my situation..." },
  { label: "I want advice", message: "I need some advice about my relationship..." },
  { label: "I need a script", message: "Can you help me with what to say to my partner?" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/luna-chat`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I'm Luna. 💜 I'm here to listen and support you through whatever you're going through. There's no judgment here — just a safe space to explore your feelings.\n\nWhat's on your heart today?",
  timestamp: new Date(),
};

const Chat = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load conversations and profile
  useEffect(() => {
    if (user) {
      loadConversations();
      loadProfile();
    }
  }, [user]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    setConversations(data || []);
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const loadedMessages: Message[] = data.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: new Date(m.created_at),
    }));

    setMessages([WELCOME_MESSAGE, ...loadedMessages]);
    setCurrentConversationId(conversationId);
    setShowSidebar(false);
  };

  const createNewConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    setConversations((prev) => [data, ...prev]);
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role, content });

    if (error) {
      console.error("Error saving message:", error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Could not delete conversation.",
        variant: "destructive",
      });
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      startNewChat();
    }

    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed.",
    });
  };

  const startNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentConversationId(null);
    setShowSidebar(false);
  };

  const streamChat = async (
    messagesToSend: { role: string; content: string }[],
    onDelta: (deltaText: string) => void,
    onDone: () => void
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: messagesToSend, userId: user?.id }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      
      if (resp.status === 429) {
        toast({
          title: "Please slow down",
          description: "Luna is a bit overwhelmed. Try again in a moment.",
          variant: "destructive",
        });
      } else if (resp.status === 402) {
        toast({
          title: "Service unavailable",
          description: "Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: errorData.error || "Please try again.",
          variant: "destructive",
        });
      }
      throw new Error(errorData.error || "Failed to start stream");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Create or get conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation(messageText.trim());
      if (!convId) {
        setIsTyping(false);
        toast({
          title: "Error",
          description: "Could not save conversation.",
          variant: "destructive",
        });
        return;
      }
      setCurrentConversationId(convId);
    }

    // Save user message
    await saveMessage(convId, "user", messageText.trim());

    // Prepare messages for API
    const apiMessages = [...messages, userMessage]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.id.startsWith("luna-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: `luna-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      await streamChat(apiMessages, updateAssistantMessage, async () => {
        setIsTyping(false);
        // Save assistant message
        if (assistantContent && convId) {
          await saveMessage(convId, "assistant", assistantContent);
          // Update conversation list
          loadConversations();
        }
      });
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      
      if (!assistantContent) {
        const errorMessage = "I'm sorry, I'm having trouble connecting right now. 💜 Please try again in a moment.";
        setMessages((prev) => [
          ...prev,
          {
            id: `luna-error-${Date.now()}`,
            role: "assistant",
            content: errorMessage,
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LunaAvatar size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-border">
                <Button
                  variant="peach"
                  className="w-full"
                  onClick={startNewChat}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No conversations yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                          currentConversationId === conv.id
                            ? "bg-primary/50"
                            : "hover:bg-primary/30"
                        }`}
                        onClick={() => loadConversation(conv.id)}
                      >
                        <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">
                          {conv.title || "Untitled"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <div
                  className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-primary/30 cursor-pointer transition-colors"
                  onClick={() => navigate("/profile")}
                >
                  <UserAvatar
                    avatarUrl={profile?.avatar_url || null}
                    displayName={profile?.display_name || null}
                    email={user?.email}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.display_name || user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground mb-1"
                  onClick={() => navigate("/mood")}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Mood Tracker
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground mb-1"
                  onClick={() => navigate("/journal")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Journal
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <LunaAvatar size="sm" />
              <div>
                <h1 className="font-heading font-semibold text-foreground">Luna</h1>
                <p className="text-xs text-muted-foreground">Your relationship therapist</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {message.role === "assistant" ? (
                    <div className="flex-shrink-0">
                      <LunaAvatar size="sm" showGlow={false} />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      <UserAvatar
                        avatarUrl={profile?.avatar_url || null}
                        displayName={profile?.display_name || null}
                        email={user?.email}
                        size="sm"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "assistant"
                        ? "bg-luna-bubble text-foreground rounded-tl-md"
                        : "bg-user-bubble text-foreground rounded-tr-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0">
                    <LunaAvatar size="sm" showGlow={false} />
                  </div>
                  <div className="bg-luna-bubble rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <motion.span
                        className="w-2 h-2 bg-accent rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-accent rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-accent rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-2xl px-4 py-4">
            {/* Quick prompts */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt.label}
                  variant="pill"
                  size="sm"
                  onClick={() => sendMessage(prompt.message)}
                  disabled={isTyping}
                  className="flex-shrink-0 text-sm"
                >
                  {prompt.label}
                </Button>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent min-h-[48px] max-h-[120px]"
                  rows={1}
                  disabled={isTyping}
                />
              </div>
              <Button
                type="submit"
                variant="peach"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="h-12 w-12 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Luna is an AI companion. For emergencies, please contact a professional.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
