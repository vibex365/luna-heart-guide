import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, Loader2, ExternalLink, ArrowLeft, Sparkles, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  subscription_end: string | null;
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Heart,
    features: [
      "5 messages per day",
      "Basic mood tracking",
      "Breathing exercises",
      "Journal entries",
    ],
    priceId: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/month",
    icon: Sparkles,
    popular: true,
    features: [
      "Unlimited conversations",
      "Advanced mood analytics",
      "Priority AI responses",
      "Personalized insights",
      "Export your data",
      "Ambient sound library",
    ],
    priceId: "price_1SdhyfAsrgxssNTVTPpZuI3t",
  },
  {
    id: "couples",
    name: "Couples",
    price: "$19",
    period: "/month",
    icon: Users,
    features: [
      "Everything in Pro",
      "2 user accounts linked",
      "Shared progress tracking",
      "Couples communication tools",
      "Conflict resolution scripts",
      "Relationship health score",
    ],
    priceId: "price_1SdhytAsrgxssNTVvlvnqvZr",
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkSubscription();
  }, [user, navigate]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setStatus(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      setStatus({ subscribed: false, plan: "free", subscription_end: null });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) return;
    
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error(error.message || "Failed to open subscription management.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileOnlyLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading font-bold text-lg">Subscription</h1>
              <p className="text-xs text-muted-foreground">Manage your plan</p>
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 space-y-6">
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    Current Plan
                  </CardTitle>
                  <Badge variant={status?.subscribed ? "default" : "secondary"}>
                    {status?.plan?.charAt(0).toUpperCase() + status?.plan?.slice(1) || "Free"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {status?.subscribed && status?.subscription_end ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your subscription renews on{" "}
                      <span className="font-medium text-foreground">
                        {new Date(status.subscription_end).toLocaleDateString()}
                      </span>
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You're on the free plan. Upgrade to unlock all features!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Plans */}
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">Available Plans</h2>
            
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = status?.plan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative ${isCurrentPlan ? "border-primary ring-2 ring-primary/20" : ""} ${plan.popular ? "border-accent" : ""}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-4">
                        <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="outline" className="bg-background">Your Plan</Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-2 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${plan.popular ? "bg-accent/20" : "bg-muted"}`}>
                            <Icon className={`w-5 h-5 ${plan.popular ? "text-accent" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{plan.name}</CardTitle>
                            <CardDescription>
                              <span className="text-xl font-bold text-foreground">{plan.price}</span>
                              <span className="text-muted-foreground">{plan.period}</span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {plan.priceId && !isCurrentPlan && (
                        <Button
                          className="w-full"
                          variant={plan.popular ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan.priceId!)}
                          disabled={checkoutLoading === plan.priceId}
                        >
                          {checkoutLoading === plan.priceId ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {status?.subscribed ? "Switch to " : "Upgrade to "}{plan.name}
                        </Button>
                      )}
                      
                      {isCurrentPlan && plan.priceId && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Manage Plan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </MobileOnlyLayout>
  );
};

export default Subscription;
