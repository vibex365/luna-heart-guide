import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Module {
  enabled: boolean;
  label: string;
  description: string;
}

interface LunaModuleTogglesProps {
  modules: Record<string, Module>;
  onChange: (modules: Record<string, Module>) => void;
}

export const LunaModuleToggles = ({ modules, onChange }: LunaModuleTogglesProps) => {
  const handleToggle = (key: string, enabled: boolean) => {
    onChange({
      ...modules,
      [key]: { ...modules[key], enabled },
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(modules).map(([key, module]) => (
        <div
          key={key}
          className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="space-y-0.5 pr-4">
            <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
              {module.label}
            </Label>
            <p className="text-xs text-muted-foreground">
              {module.description}
            </p>
          </div>
          <Switch
            id={key}
            checked={module.enabled}
            onCheckedChange={(checked) => handleToggle(key, checked)}
          />
        </div>
      ))}
    </div>
  );
};
