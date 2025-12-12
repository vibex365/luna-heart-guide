import { Check, Edit, DollarSign } from "lucide-react";
import { SubscriptionTier } from "@/pages/admin/AdminSubscriptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TierCardProps {
  tier: SubscriptionTier;
  onEdit: () => void;
}

export const TierCard = ({ tier, onEdit }: TierCardProps) => {
  const isPro = tier.slug === "pro";
  const isCouples = tier.slug === "couples";

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-6 flex flex-col transition-all hover:shadow-luna",
        isPro && "border-accent ring-1 ring-accent/20",
        isCouples && "border-peach ring-1 ring-peach/20",
        !isPro && !isCouples && "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
            {!tier.is_active && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-6">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <span className="text-3xl font-bold text-foreground">{tier.price_monthly}</span>
        <span className="text-muted-foreground">/month</span>
      </div>

      {/* Features */}
      <div className="flex-1 space-y-3">
        {tier.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </div>
        ))}
      </div>

      {/* Limits Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Limits</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {tier.limits.messages_per_day === -1 
              ? "Unlimited messages" 
              : `${tier.limits.messages_per_day} msg/day`}
          </Badge>
          {tier.limits.analytics && (
            <Badge variant="outline" className="text-xs">Analytics</Badge>
          )}
          {tier.limits.data_export && (
            <Badge variant="outline" className="text-xs">Export</Badge>
          )}
          {tier.limits.couples_features && (
            <Badge variant="outline" className="text-xs">Couples</Badge>
          )}
        </div>
      </div>
    </div>
  );
};
