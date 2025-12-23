import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Users, Sparkles, Heart, ArrowRight } from "lucide-react";

const ReferralLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [validCode, setValidCode] = useState(false);

  useEffect(() => {
    const checkCode = async () => {
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("referral_code", code.toUpperCase())
          .maybeSingle();

        if (data && !error) {
          setReferrerName(data.display_name || "A friend");
          setValidCode(true);
          // Store referral code for signup
          localStorage.setItem("referral_code", code.toUpperCase());
        }
      } catch (err) {
        console.error("Error checking referral code:", err);
      } finally {
        setLoading(false);
      }
    };

    checkCode();
  }, [code]);

  const handleGetStarted = () => {
    navigate(`/auth?ref=${code}`);
  };

  const ogImageUrl = `https://vbfccooslnruiyhtrbrm.supabase.co/storage/v1/object/public/blog-images/referral-og.png`;
  const pageUrl = `https://talkswithluna.com/r/${code}`;

  const benefits = [
    { icon: Heart, title: "24/7 Emotional Support", description: "Luna is always here to listen and help you process your feelings" },
    { icon: Users, title: "Couples Features", description: "Strengthen your relationship with games, insights, and shared activities" },
    { icon: Gift, title: "Exclusive Rewards", description: "Earn points for trying Luna and unlock premium features" },
    { icon: Sparkles, title: "AI-Powered Insights", description: "Get personalized advice based on your unique journey" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{referrerName ? `${referrerName} invited you to Luna` : "Join Luna - Your AI Companion"}</title>
        <meta name="description" content="Join Luna, your AI-powered emotional wellness companion. Get 24/7 support, relationship insights, and personalized guidance." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={referrerName ? `${referrerName} invited you to Luna!` : "Join Luna - Your AI Companion"} />
        <meta property="og:description" content="Your friend wants you to try Luna - the AI companion that helps with emotional wellness and relationships. Join now and both of you earn rewards!" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={referrerName ? `${referrerName} invited you to Luna!` : "Join Luna - Your AI Companion"} />
        <meta name="twitter:description" content="Your friend wants you to try Luna - the AI companion that helps with emotional wellness and relationships." />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero Section */}
        <div className="container max-w-4xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center space-y-6">
            {validCode && referrerName && (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Gift className="w-4 h-4" />
                {referrerName} invited you!
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Meet <span className="text-primary">Luna</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered companion for emotional wellness, relationship growth, and personal development.
            </p>

            <div className="pt-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="gap-2 text-lg px-8 py-6"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              {validCode && (
                <p className="text-sm text-muted-foreground mt-3">
                  🎁 You'll both earn bonus points when you join!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="p-8 text-center bg-primary/5 border-primary/20">
            <div className="space-y-4">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-lg italic text-foreground">
                "Luna has helped me understand my emotions better and improved my relationship with my partner."
              </p>
              <p className="text-sm text-muted-foreground">— Sarah M.</p>
            </div>
          </Card>
        </div>

        {/* Final CTA */}
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="gap-2"
          >
            Join Luna Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReferralLanding;
