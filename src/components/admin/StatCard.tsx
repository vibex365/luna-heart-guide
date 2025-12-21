import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  default: {
    card: "bg-card",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground"
  },
  accent: {
    card: "bg-gradient-to-br from-accent/10 via-primary/5 to-peach/10",
    iconBg: "bg-accent/20",
    iconColor: "text-accent"
  },
  success: {
    card: "bg-gradient-to-br from-emerald-500/10 to-green-500/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-600"
  },
  warning: {
    card: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-600"
  }
};

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = "default",
  className 
}: StatCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "rounded-2xl border border-border p-6 shadow-soft transition-all hover:shadow-romantic",
      styles.card,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border/50">
          {trend.value >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className={cn(
            "text-sm font-semibold",
            trend.value >= 0 ? "text-emerald-600" : "text-destructive"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-sm text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
