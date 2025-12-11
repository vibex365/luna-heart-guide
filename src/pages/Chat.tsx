import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "luna";
  content: string;
  timestamp: Date;
}

const quickPrompts = [
  { label: "I feel hurt", message: "I'm feeling really hurt right now..." },
  { label: "I feel confused", message: "I'm so confused about my situation..." },
  { label: "I want advice", message: "I need some advice about my relationship..." },
  { label: "I need a script", message: "Can you help me with what to say to my partner?" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "luna",
      content: "Hi, I'm Luna. 💜 I'm here to listen and support you through whatever you're going through. There's no judgment here — just a safe space to explore your feelings.\n\nWhat's on your heart today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const generateLunaResponse = (userMessage: string): string => {
    // Simulated responses - in production this would call an AI API
    const responses = [
      `I hear you. ${userMessage.includes("hurt") ? "That sounds really painful, and I'm sorry you're carrying that." : "Thank you for sharing that with me."}\n\nCan you tell me more about what happened? What did that moment feel like for you?`,
      `That sounds incredibly difficult. 💜 It takes courage to open up about these feelings.\n\nWhen you say that, what do you wish the other person understood about how you're feeling right now?`,
      `I understand. Sometimes our hearts carry so much weight, and it helps just to let it out.\n\nWhat feels like the biggest weight on your heart right now?`,
      `Thank you for trusting me with this. Your feelings are completely valid.\n\nLet's explore this together. What outcome would feel most healing for you in this situation?`,
      `I can feel how much this matters to you. 💜\n\nSometimes when we're in the middle of something painful, it's hard to see clearly. What would you tell a close friend if they were going through the same thing?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    const lunaResponse: Message = {
      id: `luna-${Date.now()}`,
      role: "luna",
      content: generateLunaResponse(messageText),
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, lunaResponse]);
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <LunaAvatar size="sm" />
            <div>
              <h1 className="font-heading font-semibold text-foreground">Luna</h1>
              <p className="text-xs text-muted-foreground">Your relationship therapist</p>
            </div>
          </div>
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
                {message.role === "luna" && (
                  <div className="flex-shrink-0">
                    <LunaAvatar size="sm" showGlow={false} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "luna"
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
            {isTyping && (
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
  );
};

export default Chat;
