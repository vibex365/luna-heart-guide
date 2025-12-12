import { motion } from "framer-motion";
import { ArrowLeft, Clock, Heart, MessageCircle, Brain, Users, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LunaAvatar from "@/components/LunaAvatar";
import ThemeToggle from "@/components/ThemeToggle";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  icon: typeof Heart;
  featured?: boolean;
}

const articles: Article[] = [
  {
    id: "attachment-styles",
    title: "Understanding Your Attachment Style",
    excerpt: "Discover how your early relationships shape the way you connect with partners today, and learn strategies to build more secure bonds.",
    category: "Relationships",
    readTime: "8 min read",
    icon: Heart,
    featured: true,
  },
  {
    id: "healthy-communication",
    title: "5 Keys to Healthy Communication",
    excerpt: "Learn the essential communication techniques that therapists recommend for resolving conflicts and deepening intimacy.",
    category: "Communication",
    readTime: "6 min read",
    icon: MessageCircle,
    featured: true,
  },
  {
    id: "anxiety-relationships",
    title: "Managing Anxiety in Relationships",
    excerpt: "Practical strategies for when worries about your relationship feel overwhelming. Calm your mind and reconnect with your partner.",
    category: "Mental Health",
    readTime: "7 min read",
    icon: Brain,
    featured: true,
  },
  {
    id: "setting-boundaries",
    title: "Setting Healthy Boundaries",
    excerpt: "Why boundaries are acts of love, not rejection — and how to communicate them clearly without guilt.",
    category: "Self-Care",
    readTime: "5 min read",
    icon: Sparkles,
  },
  {
    id: "love-languages",
    title: "The 5 Love Languages Explained",
    excerpt: "Understanding how you and your partner give and receive love can transform your relationship overnight.",
    category: "Relationships",
    readTime: "6 min read",
    icon: Heart,
  },
  {
    id: "healing-after-breakup",
    title: "Healing After a Breakup",
    excerpt: "A compassionate guide to processing grief, rediscovering yourself, and opening your heart again when you're ready.",
    category: "Healing",
    readTime: "10 min read",
    icon: BookOpen,
  },
  {
    id: "conflict-resolution",
    title: "Fighting Fair: Conflict Resolution 101",
    excerpt: "Disagreements are normal — it's how you handle them that matters. Learn to fight in ways that bring you closer.",
    category: "Communication",
    readTime: "7 min read",
    icon: Users,
  },
  {
    id: "self-compassion",
    title: "The Power of Self-Compassion",
    excerpt: "Before you can fully love another, you must learn to be kind to yourself. Start your self-compassion practice here.",
    category: "Self-Care",
    readTime: "5 min read",
    icon: Sparkles,
  },
  {
    id: "emotional-intelligence",
    title: "Building Emotional Intelligence",
    excerpt: "Develop your ability to recognize, understand, and manage emotions — both yours and your partner's.",
    category: "Mental Health",
    readTime: "8 min read",
    icon: Brain,
  },
];

const categories = ["All", "Relationships", "Communication", "Mental Health", "Self-Care", "Healing"];

const Resources = () => {
  const navigate = useNavigate();

  const featuredArticles = articles.filter((a) => a.featured);
  const allArticles = articles;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-xl text-foreground">Resources</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="peach" size="sm" onClick={() => navigate("/auth")}>
                Talk to Luna
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Mental Health & Relationship Resources
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Expert-curated articles to help you understand yourself, improve your relationships, and nurture your emotional wellbeing.
          </motion.p>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.h2
            className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Featured Articles
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <motion.article
                key={article.id}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-luna transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="h-32 gradient-luna flex items-center justify-center">
                  <article.icon className="w-12 h-12 text-accent" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-accent bg-primary px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 flex items-center text-accent text-sm font-medium group-hover:gap-2 transition-all">
                    Read article <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.h2
            className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            All Resources
          </motion.h2>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-card border border-border text-muted-foreground hover:bg-primary hover:text-foreground"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allArticles.map((article, index) => (
              <motion.article
                key={article.id}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-accent/30 hover:shadow-soft transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <article.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-accent">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="gradient-peach rounded-3xl p-10 md:p-16 text-center shadow-luna"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Apply What You've Learned?
            </h2>
            <p className="text-foreground/80 text-lg mb-8 max-w-lg mx-auto">
              Talk to Luna about what resonated with you. She can help you put these insights into practice.
            </p>
            <Button variant="accent" size="xl" onClick={() => navigate("/auth")}>
              Start a Conversation
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LunaAvatar size="sm" showGlow={false} />
            <span className="font-heading font-semibold text-foreground">LUNA</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Your private AI relationship therapist. Always here, never judging.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Resources;
