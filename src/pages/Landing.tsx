import { motion } from "framer-motion";
import { Heart, MessageCircle, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Heart,
      title: "Emotional Support",
      description: "Feel heard and validated with compassionate, judgment-free conversations.",
    },
    {
      icon: MessageCircle,
      title: "Communication Scripts",
      description: "Get gentle scripts to express your feelings clearly and kindly.",
    },
    {
      icon: Shield,
      title: "Safe Space",
      description: "Your conversations are private. Heal at your own pace.",
    },
    {
      icon: Sparkles,
      title: "Pattern Recognition",
      description: "Understand your relationship dynamics and attachment styles.",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LunaAvatar size="sm" showGlow={false} />
            <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button variant="soft" size="sm" onClick={() => navigate("/chat")}>
              Start Talking
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <LunaAvatar size="xl" />
          </motion.div>

          <motion.h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Your AI Relationship Therapist
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Luna listens. Luna understands. Start healing your heart with compassionate, 
            judgment-free guidance whenever you need it.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button variant="peach" size="xl" onClick={() => navigate("/auth")}>
              Talk to Luna
            </Button>
            <Button variant="luna" size="xl" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Trust Banner */}
      <motion.section
        className="bg-card/50 backdrop-blur-sm py-8 border-y border-border"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-lg italic">
            "Healing starts with one honest message."
          </p>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Luna Helps You Heal
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            More than just a chatbot — Luna is your emotional companion through life's hardest moments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-luna transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-xl gradient-luna flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 pb-20 md:pb-32">
        <motion.div
          className="gradient-peach rounded-3xl p-10 md:p-16 text-center shadow-luna"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            You're Not Alone in This
          </h2>
          <p className="text-foreground/80 text-lg mb-8 max-w-lg mx-auto">
            Whether you're hurting, confused, or just need someone to listen — Luna is here for you, 24/7.
          </p>
          <Button variant="accent" size="xl" onClick={() => navigate("/auth")}>
            Start Your Journey
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
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

export default Landing;
