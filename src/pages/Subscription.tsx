import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Check, Loader2, ExternalLink, ArrowLeft, Sparkles, Heart, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  subscription_end: string | null;
}

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Heart,
    features: [
      "5 messages per day",
      "Basic mood tracking",
      "Breathing exercises",
      "Journal entries",
    ],
    monthlyPriceId: null,
    annualPriceId: null,
  },
  {
    id: "pro",
    name: "Personal Pro",
    monthlyPrice: 3.99,
    annualPrice: 29.99,
    annualSavings: 18,
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
    monthlyPriceId: "price_1SgtXeAsrgxssNTVaje2ZpfF",
    annualPriceId: "price_1SgtXfAsrgxssNTVakdF9Ip2",
  },
  {
    id: "couples",
    name: "Couples",
    monthlyPrice: 7.99,
    annualPrice: 59.99,
    annualSavings: 36,
    icon: Users,
    features: [
      "Everything in Personal Pro",
      "2 user accounts linked",
      "Shared progress tracking",
      "Couples communication tools",
      "Conflict resolution scripts",
      "Relationship health score",
    ],
    monthlyPriceId: "price_1SgtXhAsrgxssNTVwWhWwzLb",
    annualPriceId: "price_1SgtXjAsrgxssNTVS4pbUHgj",
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);

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

  const handleSubscribe = async (monthlyPriceId: string | null, annualPriceId: string | null) => {
    const priceId = isAnnual ? annualPriceId : monthlyPriceId;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 safe-area-top">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading font-bold text-lg">Choose Your Plan</h1>
            <p className="text-xs text-muted-foreground">Invest in your wellbeing</p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 pb-24 max-w-6xl mx-auto space-y-8">
        {/* Current Plan Banner */}
        {status?.subscribed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-accent/30 bg-gradient-to-r from-accent/10 via-primary/5 to-peach/10">
              <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/20">
                    <Crown className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-lg">
                      You're on {status.plan?.charAt(0).toUpperCase() + status.plan?.slice(1)}
                    </p>
                    {status.subscription_end && (
                      <p className="text-sm text-muted-foreground">
                        Renews on {new Date(status.subscription_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="shrink-0"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-full">
            <span className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            )}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-accent"
            />
            <span className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              isAnnual ? "text-foreground" : "text-muted-foreground"
            )}>
              Annual
            </span>
            {isAnnual && (
              <Badge className="bg-accent/20 text-accent border-0">
                Save up to 37%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = status?.plan === plan.id;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.1 }}
                className="relative"
              >
                <Card className={cn(
                  "h-full flex flex-col transition-all duration-300 hover:shadow-romantic",
                  isCurrentPlan && "ring-2 ring-accent shadow-romantic",
                  plan.popular && "border-accent/50 bg-gradient-to-b from-accent/5 to-transparent"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground shadow-button px-4">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="bg-background border-accent text-accent">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pt-8 pb-4">
                    <div className={cn(
                      "mx-auto p-4 rounded-2xl mb-4",
                      plan.popular ? "bg-accent/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-8 h-8",
                        plan.popular ? "text-accent" : "text-muted-foreground"
                      )} />
                    </div>
                    <CardTitle className="text-xl font-heading">{plan.name}</CardTitle>
                    <CardDescription className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    </CardDescription>
                    {isAnnual && plan.annualSavings && (
                      <p className="text-sm text-accent font-medium mt-2">
                        Save ${plan.annualSavings} per year
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 pt-6 border-t border-border">
                      {priceId && !isCurrentPlan ? (
                        <Button
                          className={cn(
                            "w-full",
                            plan.popular && "bg-accent hover:bg-accent/90 shadow-button"
                          )}
                          variant={plan.popular ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan.monthlyPriceId, plan.annualPriceId)}
                          disabled={checkoutLoading === priceId}
                        >
                          {checkoutLoading === priceId ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {status?.subscribed ? "Switch to " : "Get Started with "}{plan.name}
                        </Button>
                      ) : isCurrentPlan && priceId ? (
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
                      ) : (
                        <Button className="w-full" variant="secondary" disabled>
                          Free Forever
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center font-heading">Compare Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-2 text-sm font-medium text-muted-foreground">Feature</th>
                      <th className="text-center py-4 px-2 text-sm font-medium">Free</th>
                      <th className="text-center py-4 px-2 text-sm font-medium">Personal Pro</th>
                      <th className="text-center py-4 px-2 text-sm font-medium">Couples</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">Daily Messages</td>
                      <td className="py-3 px-2 text-center">5</td>
                      <td className="py-3 px-2 text-center text-accent font-medium">Unlimited</td>
                      <td className="py-3 px-2 text-center text-accent font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">Mood Analytics</td>
                      <td className="py-3 px-2 text-center">Basic</td>
                      <td className="py-3 px-2 text-center text-accent font-medium">Advanced</td>
                      <td className="py-3 px-2 text-center text-accent font-medium">Advanced</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">AI Response Priority</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">Data Export</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">Linked Partner Account</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 text-muted-foreground">Couples Games & Activities</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 text-muted-foreground">Relationship Health Score</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center">—</td>
                      <td className="py-3 px-2 text-center"><Check className="w-4 h-4 text-accent mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Subscription;
