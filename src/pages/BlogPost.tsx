import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, ChevronLeft, ChevronRight, Share2, Heart, ArrowUp } from "lucide-react";
import LunaAvatar from "@/components/LunaAvatar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count
  useEffect(() => {
    if (post?.id) {
      supabase
        .from("blog_posts")
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq("id", post.id)
        .then(() => {});
    }
  }, [post?.id]);

  // Get related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.category, post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, read_time_minutes")
        .eq("status", "published")
        .eq("category", post?.category)
        .neq("id", post?.id)
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!post?.category && !!post?.id,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/blog")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  // Check if content is HTML or markdown and render accordingly
  const isHtmlContent = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  const renderHtmlContent = (content: string) => {
    // Add proper styling classes to HTML content
    const styledContent = content
      .replace(/<h2>/g, '<h2 class="text-2xl font-bold text-foreground mt-10 mb-4">')
      .replace(/<h3>/g, '<h3 class="text-xl font-semibold text-foreground mt-8 mb-3">')
      .replace(/<h4>/g, '<h4 class="text-lg font-semibold text-foreground mt-6 mb-2">')
      .replace(/<p>/g, '<p class="text-muted-foreground leading-relaxed mb-4">')
      .replace(/<ul>/g, '<ul class="list-disc ml-6 mb-4 space-y-2">')
      .replace(/<ol>/g, '<ol class="list-decimal ml-6 mb-4 space-y-2">')
      .replace(/<li>/g, '<li class="text-muted-foreground">')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-accent pl-4 italic text-muted-foreground my-4">')
      .replace(/<strong>/g, '<strong class="font-semibold text-foreground">')
      .replace(/<em>/g, '<em class="italic">');
    
    return <div dangerouslySetInnerHTML={{ __html: styledContent }} />;
  };

  const renderMarkdownContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-semibold text-foreground mt-8 mb-3">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-6 text-muted-foreground">{line.replace('- ', '')}</li>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{line}</p>;
      });
  };

  const renderContent = (content: string) => {
    if (isHtmlContent(content)) {
      return renderHtmlContent(content);
    }
    return renderMarkdownContent(content);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.meta_description || post.excerpt,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: {
            "@type": "Organization",
            name: "Luna",
          },
          publisher: {
            "@type": "Organization",
            name: "Luna",
            logo: {
              "@type": "ImageObject",
              url: "https://luna-app.com/logo.png",
            },
          },
        })}
      </script>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="peach" size="sm" asChild>
              <Link to="/auth">Try Luna</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image Hero */}
      {post.featured_image && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <img 
            src={post.featured_image} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className={`max-w-3xl mx-auto px-4 ${post.featured_image ? '-mt-24 relative z-10' : 'py-12'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={post.featured_image ? 'bg-card rounded-xl p-8 shadow-lg border border-border/50' : ''}
        >
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-4 capitalize">
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground mb-6">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/50">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.read_time_minutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.views_count || 0} views
            </span>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3">Topics covered:</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </article>

      {/* CTA Banner */}
      <section className="py-12 px-4 bg-gradient-to-r from-accent/20 via-primary/10 to-peach/20">
        <div className="max-w-2xl mx-auto text-center">
          <LunaAvatar size="md" showGlow className="mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
            Need Someone to Talk To?
          </h2>
          <p className="text-muted-foreground mb-6">
            Luna is here 24/7 to help you process emotions, navigate relationships, and find clarity.
          </p>
          <Button variant="peach" size="lg" asChild>
            <Link to="/auth">
              Start Chatting with Luna — Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group bg-card rounded-xl p-6 border border-border/50 hover:border-accent/50 transition-all"
                >
                  <Badge variant="secondary" className="mb-3 capitalize">
                    {related.category}
                  </Badge>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-accent text-accent-foreground rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LunaAvatar size="sm" showGlow={false} />
            <span className="text-sm text-muted-foreground">© 2024 Luna. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
