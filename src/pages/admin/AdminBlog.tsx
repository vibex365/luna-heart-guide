import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  FileText,
  Eye,
  Calendar,
  TrendingUp,
  Sparkles,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  ListTodo,
  Settings,
  Plus,
} from "lucide-react";

const AdminBlog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch blog posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["admin-blog-posts", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch blog topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["admin-blog-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_topics")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-blog-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalResult, todayResult, viewsResult, pendingResult] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("blog_posts").select("views_count"),
        supabase.from("blog_topics").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalViews = viewsResult.data?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0;

      return {
        totalPosts: totalResult.count || 0,
        postsToday: todayResult.count || 0,
        totalViews,
        pendingTopics: pendingResult.count || 0,
      };
    },
  });

  // Toggle post status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("blog_posts")
        .update({ status: newStatus, published_at: newStatus === "published" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: `Post ${newStatus === "published" ? "published" : "unpublished"}` });
    },
  });

  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-stats"] });
      toast({ title: "Post deleted" });
    },
  });

  // Generate new post
  const handleGeneratePost = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post");
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "Blog post generated!",
          description: `"${data.post.title}" has been published.`,
        });
        queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
        queryClient.invalidateQueries({ queryKey: ["admin-blog-stats"] });
        queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] });
      } else {
        throw new Error(data?.error || "Failed to generate post");
      }
    } catch (error: any) {
      toast({
        title: "Error generating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add new topic
  const addTopicMutation = useMutation({
    mutationFn: async (topic: string) => {
      const { error } = await supabase.from("blog_topics").insert({
        topic,
        category: "relationships",
        priority: 5,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] });
      toast({ title: "Topic added to queue" });
    },
  });

  const [newTopic, setNewTopic] = useState("");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
            <p className="text-muted-foreground">AI-powered content generation for SEO traffic</p>
          </div>
          <Button onClick={handleGeneratePost} disabled={isGenerating} variant="peach">
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Post Now
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalPosts || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.postsToday || 0}</p>
                    <p className="text-sm text-muted-foreground">Posts Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalViews?.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <ListTodo className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.pendingTopics || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending Topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Topic Queue
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : posts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No posts yet. Click "Generate Post Now" to create your first post.
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts?.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium text-foreground truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{post.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {post.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.views_count || 0}</TableCell>
                        <TableCell>
                          <Switch
                            checked={post.status === "published"}
                            onCheckedChange={() => toggleStatusMutation.mutate({ id: post.id, status: post.status })}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this post?")) {
                                  deletePostMutation.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Add a new topic to the queue..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="max-w-md"
              />
              <Button
                onClick={() => {
                  if (newTopic.trim()) {
                    addTopicMutation.mutate(newTopic.trim());
                    setNewTopic("");
                  }
                }}
                disabled={!newTopic.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Topic
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topicsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : topics?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No topics in the queue.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topics?.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell>
                          <p className="max-w-md truncate">{topic.topic}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {topic.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{topic.priority}</TableCell>
                        <TableCell>
                          <Badge
                            variant={topic.status === "pending" ? "default" : topic.status === "used" ? "secondary" : "destructive"}
                            className="capitalize"
                          >
                            {topic.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(topic.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Blog Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Auto-publish generated posts</p>
                    <p className="text-sm text-muted-foreground">Posts will be immediately visible on the blog</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Posts per day target</p>
                    <p className="text-sm text-muted-foreground">AI will generate up to this many posts daily</p>
                  </div>
                  <Input type="number" defaultValue={25} className="w-20" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Note: To set up automatic generation, a cron job needs to be configured to call the generate-blog-post function every 35 minutes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
