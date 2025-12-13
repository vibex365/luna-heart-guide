import { motion } from "framer-motion";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LunaAvatar from "@/components/LunaAvatar";
import { articlesData } from "./ArticleDetail";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

const Resources = () => {
  const navigate = useNavigate();

  const featuredArticles = articlesData.filter((_, i) => i < 3);
  const allArticles = articlesData;

  return (
    <MobileOnlyLayout hideTabBar>
      <div className="bg-background safe-area-top">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <LunaAvatar size="xs" showGlow={false} />
            <span className="font-heading font-bold text-lg text-foreground">Resources</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-8 px-6 gradient-hero">
          <motion.h1
            className="font-heading text-2xl font-bold text-foreground mb-2 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Mental Health Resources
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Expert-curated articles for your wellbeing
          </motion.p>
        </section>

        {/* Featured Articles */}
        <section className="py-6 px-4">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            Featured
          </h2>

          <div className="space-y-3">
            {featuredArticles.map((article, index) => (
              <motion.article
                key={article.id}
                onClick={() => navigate(`/resources/${article.id}`)}
                className="bg-card rounded-2xl border border-border overflow-hidden active:scale-[0.98] transition-transform"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-20 gradient-luna flex items-center justify-center">
                  <article.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-medium text-accent bg-primary px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mt-3 flex items-center text-accent text-xs font-medium">
                    Read article <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* All Articles */}
        <section className="py-6 px-4 bg-muted/30">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            All Resources
          </h2>

          <div className="space-y-3">
            {allArticles.map((article, index) => (
              <motion.article
                key={article.id}
                onClick={() => navigate(`/resources/${article.id}`)}
                className="bg-card rounded-xl p-4 border border-border active:scale-[0.98] transition-transform"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 6) * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <article.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-accent">
                        {article.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 px-4">
          <motion.div
            className="gradient-peach rounded-2xl p-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">
              Ready to Apply What You've Learned?
            </h2>
            <p className="text-foreground/80 text-sm mb-4">
              Talk to Luna about what resonated with you.
            </p>
            <Button variant="accent" className="w-full" onClick={() => navigate("/auth")}>
              Start a Conversation
            </Button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <LunaAvatar size="xs" showGlow={false} />
            <span className="font-heading font-semibold text-foreground text-sm">LUNA</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Your private AI therapist.
          </p>
        </footer>
      </div>
    </MobileOnlyLayout>
  );
};

export default Resources;
