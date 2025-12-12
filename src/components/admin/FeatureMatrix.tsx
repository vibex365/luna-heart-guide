import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionTier, FeatureDefinition } from "@/pages/admin/AdminFeatures";

interface FeatureMatrixProps {
  tiers: SubscriptionTier[];
  features: FeatureDefinition[];
  onToggle: (tierId: string, featureKey: string, value: boolean | number) => void;
  isUpdating: boolean;
}

export const FeatureMatrix = ({
  tiers,
  features,
  onToggle,
  isUpdating,
}: FeatureMatrixProps) => {
  const getTierColor = (slug: string) => {
    switch (slug) {
      case "free":
        return "bg-muted";
      case "pro":
        return "bg-accent/10";
      case "couples":
        return "bg-peach/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-foreground min-w-[250px]">
                Feature
              </th>
              {tiers.map((tier) => (
                <th
                  key={tier.id}
                  className={cn(
                    "text-center p-4 font-medium text-foreground min-w-[140px]",
                    getTierColor(tier.slug)
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{tier.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {tier.slug}
                    </Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.key}
                className={cn(
                  "border-b border-border last:border-b-0",
                  index % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
              >
                <td className="p-4">
                  <div className="flex items-start gap-2">
                    <div>
                      <div className="font-medium text-foreground">
                        {feature.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {feature.description}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{feature.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
                {tiers.map((tier) => {
                  const value = tier.limits[feature.key];
                  const isBoolean = feature.type === "boolean";

                  return (
                    <td
                      key={tier.id}
                      className={cn(
                        "p-4 text-center",
                        getTierColor(tier.slug)
                      )}
                    >
                      {isBoolean ? (
                        <div className="flex justify-center">
                          <Switch
                            checked={!!value}
                            onCheckedChange={(checked) =>
                              onToggle(tier.id, feature.key, checked)
                            }
                            disabled={isUpdating}
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min="-1"
                            value={value as number || 0}
                            onChange={(e) =>
                              onToggle(tier.id, feature.key, parseInt(e.target.value) || 0)
                            }
                            disabled={isUpdating}
                            className="w-20 text-center"
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Feature enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-muted-foreground" />
            <span>Feature disabled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">-1</span>
            <span>Unlimited (for numeric limits)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
