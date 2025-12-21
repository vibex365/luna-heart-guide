import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageSquare,
  Video,
  Gamepad2,
  Search,
  Eye,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  Heart,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const AdminModeration = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Fetch couples messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["admin-couples-messages", searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_messages")
        .select(`
          *,
          partner_links!inner(
            user_id,
            partner_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user profiles
      const allUserIds = new Set<string>();
      (data || []).forEach((m) => {
        allUserIds.add(m.sender_id);
        if (m.partner_links?.user_id) allUserIds.add(m.partner_links.user_id);
        if (m.partner_links?.partner_id) allUserIds.add(m.partner_links.partner_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(allUserIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      return (data || []).map((m) => ({
        ...m,
        sender_name: profileMap.get(m.sender_id) || "Unknown",
        recipient_name: m.sender_id === m.partner_links?.user_id
          ? profileMap.get(m.partner_links?.partner_id || "") || "Unknown"
          : profileMap.get(m.partner_links?.user_id || "") || "Unknown",
      }));
    },
  });

  // Fetch game sessions
  const { data: gameSessions = [] } = useQuery({
    queryKey: ["admin-game-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_game_sessions")
        .select(`
          *,
          partner_links!inner(user_id, partner_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profiles
      const userIds = new Set<string>();
      (data || []).forEach((g) => {
        userIds.add(g.started_by);
        if (g.partner_links?.user_id) userIds.add(g.partner_links.user_id);
        if (g.partner_links?.partner_id) userIds.add(g.partner_links.partner_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      return (data || []).map((g) => ({
        ...g,
        started_by_name: profileMap.get(g.started_by) || "Unknown",
      }));
    },
  });

  // Fetch intimate game sessions
  const { data: intimateSessions = [] } = useQuery({
    queryKey: ["admin-intimate-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intimate_game_sessions")
        .select(`
          *,
          partner_links!inner(user_id, partner_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const userIds = new Set<string>();
      (data || []).forEach((g) => {
        userIds.add(g.started_by);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      return (data || []).map((g) => ({
        ...g,
        started_by_name: profileMap.get(g.started_by) || "Unknown",
      }));
    },
  });

  // Stats
  const textMessages = messages.filter((m: any) => m.message_type === "text");
  const voiceMessages = messages.filter((m: any) => m.message_type === "voice");
  const videoMessages = messages.filter((m: any) => m.message_type === "video");

  const filteredMessages = searchQuery.trim()
    ? messages.filter(
        (m: any) =>
          m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review user messages, media, and game activity for safety
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{textMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Text Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{voiceMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Voice Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Video className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{videoMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Video Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Gamepad2 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{gameSessions.length + intimateSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Game Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Video className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Couples Messages</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64 h-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {msg.message_type}
                              </Badge>
                              <span className="text-sm font-medium">{msg.sender_name}</span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-sm text-muted-foreground">{msg.recipient_name}</span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {msg.content || `[${msg.message_type} message]`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="shrink-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Voice & Video Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {[...voiceMessages, ...videoMessages].map((msg: any) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {msg.message_type === "video" ? (
                              <div className="p-2 rounded-lg bg-pink-500/10">
                                <Video className="w-5 h-5 text-pink-500" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <MessageSquare className="w-5 h-5 text-green-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{msg.sender_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {msg.media_duration ? `${msg.media_duration}s` : "Unknown duration"} •{" "}
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {msg.media_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {voiceMessages.length === 0 && videoMessages.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No media messages found</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Regular Game Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {gameSessions.map((session: any) => (
                        <div
                          key={session.id}
                          className="p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="outline" className="mb-1 capitalize">
                                {session.game_type.replace(/_/g, " ")}
                              </Badge>
                              <p className="text-sm font-medium">
                                Started by {session.started_by_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Card {session.current_card_index} •{" "}
                                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Intimate Game Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {intimateSessions.map((session: any) => (
                        <div
                          key={session.id}
                          className="p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="outline" className="mb-1 capitalize border-pink-500 text-pink-600">
                                {session.game_type.replace(/_/g, " ")}
                              </Badge>
                              <p className="text-sm font-medium">
                                Started by {session.started_by_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Prompt {session.current_prompt_index} •{" "}
                                {session.revealed ? "Revealed" : "Not revealed"} •{" "}
                                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Detail Sheet */}
        <Sheet open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Message Details</SheetTitle>
            </SheetHeader>
            {selectedMessage && (
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{selectedMessage.sender_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">{selectedMessage.recipient_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sent:</span>
                    <span>{format(new Date(selectedMessage.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{selectedMessage.message_type}</Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Content</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedMessage.content || "[No text content]"}
                  </p>
                </div>

                {selectedMessage.media_url && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Media</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={selectedMessage.media_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        View Media
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="destructive" className="flex-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Flag Content
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;