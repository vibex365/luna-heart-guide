import { motion } from "framer-motion";
import { ArrowLeft, Clock, Heart, MessageCircle, Brain, Users, Sparkles, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import LunaAvatar from "@/components/LunaAvatar";
import ThemeToggle from "@/components/ThemeToggle";

interface ArticleContent {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  icon: typeof Heart;
  content: string[];
  keyTakeaways: string[];
}

export const articlesData: ArticleContent[] = [
  {
    id: "attachment-styles",
    title: "Understanding Your Attachment Style",
    excerpt: "Discover how your early relationships shape the way you connect with partners today, and learn strategies to build more secure bonds.",
    category: "Relationships",
    readTime: "8 min read",
    icon: Heart,
    content: [
      "Our attachment styles form in early childhood through our relationships with primary caregivers. These patterns become the blueprint for how we connect with romantic partners as adults. Understanding your attachment style is one of the most powerful tools for improving your relationships.",
      "There are four main attachment styles: secure, anxious, avoidant, and disorganized. People with secure attachment feel comfortable with intimacy and independence. Those with anxious attachment often worry about their partner's love and seek constant reassurance. Avoidant individuals tend to maintain emotional distance and value independence over closeness. Disorganized attachment combines elements of both anxious and avoidant patterns.",
      "The good news is that attachment styles are not set in stone. Through self-awareness, therapy, and healthy relationships, you can develop what researchers call 'earned secure attachment.' This means learning new patterns of relating that feel safer and more fulfilling.",
      "Start by noticing your triggers. When do you feel most anxious in relationships? When do you want to pull away? These reactions often point to your attachment wounds. With patience and practice, you can learn to respond differently.",
      "Communication is key to building secure attachment. Practice expressing your needs clearly and listening to your partner without becoming defensive. Remember that vulnerability is strength, not weakness. When both partners feel safe to be authentic, deeper connection becomes possible."
    ],
    keyTakeaways: [
      "Attachment styles form in childhood but can be changed",
      "The four styles are: secure, anxious, avoidant, and disorganized",
      "Self-awareness of your triggers is the first step to change",
      "Secure attachment can be earned through conscious effort",
      "Vulnerability and clear communication build stronger bonds"
    ]
  },
  {
    id: "healthy-communication",
    title: "5 Keys to Healthy Communication",
    excerpt: "Learn the essential communication techniques that therapists recommend for resolving conflicts and deepening intimacy.",
    category: "Communication",
    readTime: "6 min read",
    icon: MessageCircle,
    content: [
      "Healthy communication is the foundation of every strong relationship. Yet many of us were never taught how to express our feelings effectively or truly listen to our partners. These five keys can transform how you connect.",
      "First, use 'I' statements instead of 'you' accusations. Instead of saying 'You never listen to me,' try 'I feel unheard when I share something important and don't get a response.' This reduces defensiveness and opens dialogue.",
      "Second, practice active listening. This means giving your full attention, reflecting back what you hear, and asking clarifying questions. Put away your phone, make eye contact, and show genuine curiosity about your partner's experience.",
      "Third, take breaks when emotions run high. It's okay to say, 'I need 20 minutes to calm down before we continue this conversation.' Research shows that when our heart rate exceeds 100 BPM, we lose access to our rational brain.",
      "Fourth, express appreciation regularly. The ratio of positive to negative interactions in healthy relationships is 5:1. Make it a habit to notice and verbalize what you love about your partner.",
      "Fifth, repair quickly after conflicts. Don't let resentment build. A sincere apology and willingness to understand your partner's perspective can heal wounds before they become chronic."
    ],
    keyTakeaways: [
      "Use 'I' statements to express feelings without blame",
      "Active listening means full attention and reflection",
      "Take breaks when emotionally flooded (heart rate over 100 BPM)",
      "Maintain a 5:1 ratio of positive to negative interactions",
      "Repair conflicts quickly before resentment builds"
    ]
  },
  {
    id: "anxiety-relationships",
    title: "Managing Anxiety in Relationships",
    excerpt: "Practical strategies for when worries about your relationship feel overwhelming. Calm your mind and reconnect with your partner.",
    category: "Mental Health",
    readTime: "7 min read",
    icon: Brain,
    content: [
      "Relationship anxiety is incredibly common, yet it can feel isolating when you're caught in spirals of worry. Whether you're anxious about your partner's feelings, the future of your relationship, or your own worthiness of love, there are effective strategies to find peace.",
      "First, recognize that anxiety lies. It tells you worst-case scenarios are inevitable. In reality, the worried thoughts are usually just thoughts, not facts. Learning to observe your anxiety without believing every thought is a powerful skill.",
      "Grounding techniques can interrupt anxiety spirals. Try the 5-4-3-2-1 method: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings you back to the present moment.",
      "Communicate your anxiety to your partner, but avoid seeking constant reassurance. Instead, share what you need: 'I'm feeling anxious today. A hug would help.' This invites connection without putting pressure on your partner to fix your feelings.",
      "Build a self-soothing toolkit. This might include deep breathing, journaling, talking to a friend, or engaging in activities that calm your nervous system. The goal is to learn to comfort yourself so you can show up more securely in your relationship.",
      "Consider whether your anxiety is pointing to something real that needs addressing, or if it's a pattern from your past. Sometimes anxiety is protective, alerting us to genuine concerns. Other times, it's old wounds surfacing. Distinguishing between the two is crucial."
    ],
    keyTakeaways: [
      "Anxious thoughts are not facts — learn to observe them",
      "Use grounding techniques like 5-4-3-2-1 to stay present",
      "Share your feelings without seeking constant reassurance",
      "Build a personal self-soothing toolkit",
      "Distinguish between protective anxiety and old patterns"
    ]
  },
  {
    id: "setting-boundaries",
    title: "Setting Healthy Boundaries",
    excerpt: "Why boundaries are acts of love, not rejection — and how to communicate them clearly without guilt.",
    category: "Self-Care",
    readTime: "5 min read",
    icon: Sparkles,
    content: [
      "Boundaries are the invisible lines that define where you end and another person begins. Far from being walls that push people away, healthy boundaries actually create the safety needed for deeper intimacy.",
      "Many people struggle with boundaries because they confuse them with selfishness. In truth, boundaries protect your energy, values, and wellbeing. When you have clear boundaries, you can give more genuinely because you're not depleting yourself.",
      "Start by identifying what you need. What drains you? What feels like a violation of your values or peace? These are clues to where boundaries are needed. Common areas include time, emotional energy, physical space, and personal values.",
      "Communicate boundaries clearly and kindly. You don't need to over-explain or apologize. A simple statement works: 'I'm not available for calls after 9 PM' or 'I need some alone time to recharge this weekend.'",
      "Expect pushback, especially from people who benefited from your lack of boundaries. Stay firm but compassionate. Their discomfort is not your responsibility. Over time, the people who truly respect you will adjust."
    ],
    keyTakeaways: [
      "Boundaries create safety for deeper intimacy",
      "Having boundaries is self-care, not selfishness",
      "Identify what drains you to find where boundaries are needed",
      "Communicate clearly without over-explaining",
      "Expect pushback but stay firm — others will adjust"
    ]
  },
  {
    id: "love-languages",
    title: "The 5 Love Languages Explained",
    excerpt: "Understanding how you and your partner give and receive love can transform your relationship overnight.",
    category: "Relationships",
    readTime: "6 min read",
    icon: Heart,
    content: [
      "Dr. Gary Chapman's concept of love languages has helped millions understand why they sometimes feel unloved despite their partner's efforts. The idea is simple: we each have preferred ways of expressing and receiving love.",
      "Words of Affirmation: Some people feel most loved through verbal expressions — compliments, words of appreciation, verbal encouragement, and hearing 'I love you.' If this is your language, criticism can be particularly painful.",
      "Acts of Service: For others, actions speak louder than words. Doing the dishes, running errands, or taking on a task your partner dreads says 'I love you' more powerfully than any words could.",
      "Receiving Gifts: This isn't about materialism. It's about the thought and effort behind a gift. A small, thoughtful present can make someone with this love language feel deeply cherished.",
      "Quality Time: Undivided attention is the key here. Put away distractions and be fully present. For quality time people, distracted presence feels like rejection.",
      "Physical Touch: Holding hands, hugs, kisses, and physical closeness communicate love for those with this language. Physical presence and accessibility are crucial.",
      "The key is learning your partner's primary love language and making an effort to speak it, even if it doesn't come naturally to you. Love is a choice we make in how we show up for our partners."
    ],
    keyTakeaways: [
      "We each have preferred ways of giving and receiving love",
      "The 5 languages: Words, Acts, Gifts, Time, and Touch",
      "Learn your partner's language, not just your own",
      "Speaking their language takes intentional effort",
      "Mismatched languages often cause feeling unloved despite effort"
    ]
  },
  {
    id: "healing-after-breakup",
    title: "Healing After a Breakup",
    excerpt: "A compassionate guide to processing grief, rediscovering yourself, and opening your heart again when you're ready.",
    category: "Healing",
    readTime: "10 min read",
    icon: BookOpen,
    content: [
      "Breakups can feel like a death — and in many ways, they are. You're grieving the loss of a relationship, a future you imagined, and sometimes a version of yourself. Be patient with yourself through this process.",
      "Allow yourself to feel everything. Sadness, anger, relief, confusion, hope, despair — they may all visit, sometimes within the same hour. Trying to skip the painful parts only prolongs the healing. Let the waves come.",
      "Resist the urge to immediately 'move on.' Our culture pushes us to be productive and positive, but healing takes time. Give yourself permission to be sad, to stay in on Friday nights, to not have it all figured out.",
      "Use this time for self-discovery. Who are you outside of that relationship? What dreams did you put on hold? What do you actually want in a partner? Breakups, painful as they are, offer a chance to rebuild on a stronger foundation.",
      "Be mindful of the stories you tell yourself. 'I'll never find love again' or 'I wasted those years' are not facts — they're pain talking. Challenge these narratives with compassion and curiosity.",
      "Reach out for support. Friends, family, a therapist, or support groups can provide perspective and comfort. You don't have to go through this alone. Healing happens in connection.",
      "Eventually, you'll notice the pain visiting less often. One day you'll think of them without that sharp ache. This doesn't mean you've forgotten or that the relationship didn't matter. It means you're healing, and your heart is making room for what's next."
    ],
    keyTakeaways: [
      "Grief after a breakup is normal — allow yourself to feel",
      "Don't rush to 'move on' — healing takes time",
      "Use this period for self-discovery and growth",
      "Challenge negative stories with compassion",
      "Seek support — healing happens in connection"
    ]
  },
  {
    id: "conflict-resolution",
    title: "Fighting Fair: Conflict Resolution 101",
    excerpt: "Disagreements are normal — it's how you handle them that matters. Learn to fight in ways that bring you closer.",
    category: "Communication",
    readTime: "7 min read",
    icon: Users,
    content: [
      "Conflict is inevitable in any close relationship. The goal isn't to eliminate disagreements but to handle them in ways that strengthen rather than damage your bond. Here's how to fight fair.",
      "Attack the problem, not the person. Keep the focus on the specific issue at hand. 'I'm frustrated that the dishes weren't done' is very different from 'You're so lazy and inconsiderate.'",
      "Avoid the Four Horsemen identified by relationship researcher Dr. John Gottman: criticism, contempt, defensiveness, and stonewalling. These patterns predict relationship failure with remarkable accuracy.",
      "Seek to understand before being understood. Truly listen to your partner's perspective, even when you disagree. Repeat back what you hear to ensure you've got it right. Often, feeling heard is more important than 'winning.'",
      "Look for the need beneath the complaint. When your partner criticizes, they're usually expressing an unmet need. 'You never help around the house' might mean 'I need to feel like we're a team.' Responding to the need, not just the words, can de-escalate quickly.",
      "Know when to take a break. If either of you is too flooded to think clearly, pause the conversation. Agree on a time to come back to it — this prevents stonewalling while allowing space to calm down.",
      "End with repair and reconnection. Even after difficult conversations, find a way to come back together. A hug, a word of appreciation, or simply saying 'I love you even when we disagree' can restore your bond."
    ],
    keyTakeaways: [
      "Attack problems, not people — stay specific",
      "Avoid criticism, contempt, defensiveness, and stonewalling",
      "Seek to understand your partner's perspective first",
      "Look for the unmet need beneath complaints",
      "Take breaks when flooded, but always return to repair"
    ]
  },
  {
    id: "self-compassion",
    title: "The Power of Self-Compassion",
    excerpt: "Before you can fully love another, you must learn to be kind to yourself. Start your self-compassion practice here.",
    category: "Self-Care",
    readTime: "5 min read",
    icon: Sparkles,
    content: [
      "Self-compassion is treating yourself with the same kindness you'd offer a good friend. For many of us, this is surprisingly difficult. We hold ourselves to impossible standards and berate ourselves for every perceived failure.",
      "Dr. Kristin Neff, a leading researcher on self-compassion, identifies three components: self-kindness (vs. self-judgment), common humanity (vs. isolation), and mindfulness (vs. over-identification with thoughts).",
      "Self-kindness means speaking to yourself gently, especially when you make mistakes. Instead of 'I'm such an idiot,' try 'I made a mistake. That's human. What can I learn from this?'",
      "Common humanity reminds us that suffering and imperfection are part of the shared human experience. You're not uniquely flawed. Everyone struggles. This perspective reduces the isolation that often accompanies self-criticism.",
      "Mindfulness allows us to observe our pain without being swept away by it. We can acknowledge 'This is really hard right now' without dramatizing or suppressing our feelings.",
      "Try this self-compassion break: When you're struggling, pause and say to yourself: 'This is a moment of suffering. Suffering is part of life. May I be kind to myself in this moment. May I give myself the compassion I need.'"
    ],
    keyTakeaways: [
      "Self-compassion = treating yourself as you'd treat a friend",
      "Three components: self-kindness, common humanity, mindfulness",
      "Replace self-judgment with gentle, supportive inner talk",
      "Remember: imperfection is part of being human",
      "Practice the self-compassion break during difficult moments"
    ]
  },
  {
    id: "emotional-intelligence",
    title: "Building Emotional Intelligence",
    excerpt: "Develop your ability to recognize, understand, and manage emotions — both yours and your partner's.",
    category: "Mental Health",
    readTime: "8 min read",
    icon: Brain,
    content: [
      "Emotional intelligence (EQ) is the ability to recognize, understand, and manage our own emotions while also being attuned to others' feelings. In relationships, EQ often matters more than IQ.",
      "The first step is self-awareness: being able to identify what you're feeling in the moment. Many of us are disconnected from our emotions, describing everything as 'fine' or 'stressed.' Start building a richer emotional vocabulary.",
      "Notice where emotions live in your body. Anxiety might feel like chest tightness. Anger might show up as heat in your face. Sadness might feel like heaviness. This body awareness helps you catch emotions early.",
      "Learn to regulate your emotions rather than being controlled by them. This doesn't mean suppressing feelings — it means having strategies to calm yourself when emotions threaten to overwhelm your rational thinking.",
      "Develop empathy by truly trying to understand your partner's experience. Ask curious questions. Resist the urge to fix or advise. Sometimes people just need to feel understood.",
      "Put it all together in your relationship: notice your emotions, express them appropriately, stay curious about your partner's inner world, and respond with compassion. This is EQ in action, and it transforms relationships."
    ],
    keyTakeaways: [
      "EQ is recognizing, understanding, and managing emotions",
      "Build self-awareness by expanding your emotional vocabulary",
      "Notice where emotions appear in your body",
      "Learn regulation strategies, not suppression",
      "Practice empathy through curiosity and presence"
    ]
  },
];

const ArticleDetail = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();

  const article = articlesData.find((a) => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <Button variant="peach" onClick={() => navigate("/resources")}>
            Back to Resources
          </Button>
        </div>
      </div>
    );
  }

  const Icon = article.icon;

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
                onClick={() => navigate("/resources")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-xl text-foreground hidden md:inline">Resources</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="peach" size="sm" onClick={() => navigate("/auth")}>
                Talk to Luna
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Article Hero */}
      <section className="py-12 md:py-20 gradient-hero">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl gradient-luna flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8 text-accent" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-sm font-medium text-accent bg-primary px-3 py-1 rounded-full">
                {article.category}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {article.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {article.excerpt}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="prose prose-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {article.content.map((paragraph, index) => (
                <motion.p
                  key={index}
                  className="text-foreground leading-relaxed mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </motion.div>

            {/* Key Takeaways */}
            <motion.div
              className="mt-12 bg-card rounded-2xl p-8 border border-border shadow-soft"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Key Takeaways
              </h2>
              <ul className="space-y-3">
                {article.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-accent">{index + 1}</span>
                    </span>
                    <span className="text-foreground">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-3xl mx-auto gradient-peach rounded-3xl p-10 text-center shadow-luna"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Want to Explore This Topic Further?
            </h2>
            <p className="text-foreground/80 mb-8">
              Luna can help you apply these insights to your unique situation. Start a conversation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" onClick={() => navigate("/auth")}>
                Talk to Luna
              </Button>
              <Button variant="luna" size="lg" onClick={() => navigate("/resources")}>
                Read More Articles
              </Button>
            </div>
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

export default ArticleDetail;
