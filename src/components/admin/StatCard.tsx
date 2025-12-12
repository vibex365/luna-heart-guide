import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
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
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className 
}: StatCardProps) => {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-6 shadow-soft transition-all hover:shadow-luna",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn(
            "text-sm font-medium",
            trend.value >= 0 ? "text-green-600" : "text-destructive"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-sm text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
