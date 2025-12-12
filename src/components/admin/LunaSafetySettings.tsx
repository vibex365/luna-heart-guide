import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, Bell } from "lucide-react";

interface LunaSafetySettingsProps {
  settings: Record<string, boolean>;
  onChange: (settings: Record<string, boolean>) => void;
}

const safetyOptions = [
  {
    key: "enabled",
    label: "Safety Filters Enabled",
    description: "Master switch for all safety features",
    icon: AlertTriangle,
  },
  {
    key: "crisis_detection",
    label: "Crisis Detection",
    description: "Detect self-harm and crisis language",
    icon: AlertTriangle,
  },
  {
    key: "content_filter",
    label: "Content Filter",
    description: "Filter harmful or inappropriate content",
    icon: Eye,
  },
  {
    key: "escalation_alerts",
    label: "Escalation Alerts",
    description: "Alert admins for serious concerns",
    icon: Bell,
  },
];

export const LunaSafetySettings = ({ settings, onChange }: LunaSafetySettingsProps) => {
  const handleToggle = (key: string, value: boolean) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const masterEnabled = settings.enabled !== false;

  return (
    <div className="space-y-4">
      {safetyOptions.map((option) => {
        const Icon = option.icon;
        const isDisabled = option.key !== "enabled" && !masterEnabled;

        return (
          <div
            key={option.key}
            className={`flex items-start justify-between p-3 rounded-lg transition-colors ${
              isDisabled 
                ? "bg-muted/30 opacity-50" 
                : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-4 w-4 mt-0.5 ${
                option.key === "enabled" ? "text-accent" : "text-muted-foreground"
              }`} />
              <div className="space-y-0.5">
                <Label 
                  htmlFor={option.key} 
                  className={`text-sm font-medium cursor-pointer ${
                    isDisabled ? "cursor-not-allowed" : ""
                  }`}
                >
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              id={option.key}
              checked={settings[option.key] !== false}
              onCheckedChange={(checked) => handleToggle(option.key, checked)}
              disabled={isDisabled}
            />
          </div>
        );
      })}
    </div>
  );
};
