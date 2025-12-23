import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, MessageCircle, LogOut, Trash2, Heart, BookOpen, Wind, LifeBuoy, History, Search, X, Pencil, Check, Settings, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import UserAvatar from "@/components/UserAvatar";
import { MessageFeedback } from "@/components/MessageFeedback";
import { MessageLimitBanner } from "@/components/MessageLimitBanner";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { ChatSkeleton } from "@/components/skeletons/PageSkeletons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const getWelcomeMessage = (firstName: string | null): Message => ({
  id: "welcome",
  role: "assistant",
  content: firstName 
    ? `Hi ${firstName}, I'm Luna. 💜 I'm here to listen and support you through whatever you're going through. There's no judgment here — just a safe space to explore your feelings.\n\nWhat's on your heart today?`
    : "Hi, I'm Luna. 💜 I'm here to listen and support you through whatever you're going through. There's no judgment here — just a safe space to explore your feelings.\n\nWhat's on your heart today?",
  timestamp: new Date(),
});

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage(null)]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Handle checkout success from URL params
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast({
        title: "Subscription Active! 🎉",
        description: "Your subscription has been activated.",
      });
      // Clear the param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      // Extract first name and update welcome message if it's the only message
      const firstName = data.display_name?.trim().split(/\s+/)[0] || null;
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome") {
          return [getWelcomeMessage(firstName)];
        }
        return prev;
      });
    }
  };

  const loadConversations = useCallback(async () => {
    if (!isOnline) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      // Try to load from cache
      const cached = localStorage.getItem("cached_conversations");
      if (cached) {
        setConversations(JSON.parse(cached));
      }
      return;
    }

    setConversations(data || []);
    localStorage.setItem("cached_conversations", JSON.stringify(data || []));
  }, [isOnline]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Can't refresh right now.",
        variant: "destructive",
      });
      return;
    }
    setIsRefreshing(true);
    await loadConversations();
    await loadProfile();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Conversations updated.",
    });
  }, [isOnline, loadConversations]);

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

    const firstName = profile?.display_name?.trim().split(/\s+/)[0] || null;
    setMessages([getWelcomeMessage(firstName), ...loadedMessages]);
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

  const startEditingTitle = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conv.id);
    setEditingTitle(conv.title || "");
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveConversationTitle = async () => {
    if (!editingConversationId) return;

    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) {
      setEditingConversationId(null);
      return;
    }

    const { error } = await supabase
      .from("conversations")
      .update({ title: trimmedTitle })
      .eq("id", editingConversationId);

    if (error) {
      console.error("Error renaming conversation:", error);
      toast({
        title: "Error",
        description: "Could not rename conversation.",
        variant: "destructive",
      });
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === editingConversationId ? { ...c, title: trimmedTitle } : c
        )
      );
    }

    setEditingConversationId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveConversationTitle();
    } else if (e.key === "Escape") {
      setEditingConversationId(null);
    }
  };

  const startNewChat = () => {
    const firstName = profile?.display_name?.trim().split(/\s+/)[0] || null;
    setMessages([getWelcomeMessage(firstName)]);
    setCurrentConversationId(null);
    setShowSidebar(false);
  };

  const streamChat = async (
    messagesToSend: { role: string; content: string }[],
    onDelta: (deltaText: string) => void,
    onDone: () => void
  ) => {
    // Get user's JWT token for proper authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please log in to chat with Luna.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: messagesToSend, conversationId: currentConversationId }),
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
        const errorData = await resp.json().catch(() => ({}));
        if (errorData.limitReached) {
          toast({
            title: "Daily limit reached",
            description: "Upgrade to Pro for unlimited conversations with Luna.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Service unavailable",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
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
      <MobileOnlyLayout hideTabBar>
        <ChatSkeleton />
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout>
      <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing || isTyping}>
        <div className="h-full flex flex-col bg-background">
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
              <div className="p-4 border-b border-border space-y-3">
                <Button
                  variant="peach"
                  className="w-full"
                  onClick={startNewChat}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
                
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No conversations yet
                  </p>
                ) : (
                  (() => {
                    const filteredConversations = conversations.filter(conv =>
                      (conv.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    if (filteredConversations.length === 0) {
                      return (
                        <p className="text-center text-muted-foreground text-sm py-8">
                          No conversations match "{searchQuery}"
                        </p>
                      );
                    }

                    // Group conversations by date
                    const grouped = filteredConversations.reduce((acc, conv) => {
                      const date = parseISO(conv.updated_at);
                      let group: string;
                      
                      if (isToday(date)) {
                        group = "Today";
                      } else if (isYesterday(date)) {
                        group = "Yesterday";
                      } else if (isThisWeek(date)) {
                        group = "This Week";
                      } else {
                        group = "Older";
                      }
                      
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(conv);
                      return acc;
                    }, {} as Record<string, typeof filteredConversations>);

                    const groupOrder = ["Today", "Yesterday", "This Week", "Older"];
                    
                    return (
                      <div className="space-y-4">
                        {groupOrder.map(groupName => {
                          const groupConvs = grouped[groupName];
                          if (!groupConvs || groupConvs.length === 0) return null;
                          
                          return (
                            <div key={groupName}>
                              <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                {groupName}
                              </p>
                              <div className="space-y-1">
                                {groupConvs.map((conv) => (
                                  <div
                                    key={conv.id}
                                    className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                                      currentConversationId === conv.id
                                        ? "bg-primary/50"
                                        : "hover:bg-primary/30"
                                    }`}
                                    onClick={() => editingConversationId !== conv.id && loadConversation(conv.id)}
                                  >
                                    <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    
                                    {editingConversationId === conv.id ? (
                                      <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onKeyDown={handleEditKeyDown}
                                        onBlur={saveConversationTitle}
                                        className="flex-1 text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <span 
                                        className="text-sm text-foreground truncate flex-1"
                                        onDoubleClick={(e) => startEditingTitle(conv, e)}
                                      >
                                        {conv.title || "Untitled"}
                                      </span>
                                    )}
                                    
                                    {editingConversationId === conv.id ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveConversationTitle();
                                        }}
                                        className="p-1 hover:bg-primary/30 rounded transition-all"
                                      >
                                        <Check className="w-3 h-3 text-primary" />
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={(e) => startEditingTitle(conv, e)}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/20 rounded transition-all"
                                        >
                                          <Pencil className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmId(conv.id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                                        >
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
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
                  className="w-full justify-start text-muted-foreground mb-1"
                  onClick={() => navigate("/breathe")}
                >
                  <Wind className="w-4 h-4 mr-2" />
                  Breathe
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground mb-1"
                  onClick={() => navigate("/luna-voice")}
                >
                  <Headphones className="w-4 h-4 mr-2" />
                  Luna Voice
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground mb-3"
                  onClick={() => navigate("/crisis")}
                >
                  <LifeBuoy className="w-4 h-4 mr-2" />
                  Crisis Resources
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
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {conversations.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <LunaAvatar size="sm" />
              <div>
                <h1 className="font-heading font-semibold text-foreground">Luna</h1>
                <p className="text-xs text-muted-foreground">Your relationship therapist</p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/luna-voice")}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Headphones className="w-4 h-4" />
              Voice
            </Button>
          </div>
        </header>

        {/* Message Limit Banner for Free Users */}
        <MessageLimitBanner />

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
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "assistant"
                          ? "bg-luna-bubble text-foreground rounded-tl-md"
                          : "bg-user-bubble text-foreground rounded-tr-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                    {/* Feedback button for assistant messages (not welcome message) */}
                    {message.role === "assistant" && message.id !== "welcome" && !message.id.startsWith("luna-error") && (
                      <div className="mt-1 flex justify-start">
                        <MessageFeedback messageId={message.id} />
                      </div>
                    )}
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
                    <LunaAvatar size="sm" showGlow={true} isTyping={true} />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteConversation(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      </PullToRefresh>
    </MobileOnlyLayout>
  );
};

export default Chat;
