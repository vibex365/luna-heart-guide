import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface LunaSliderControlProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (value: number) => void;
}

export const LunaSliderControl = ({
  label,
  description,
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  onChange,
}: LunaSliderControlProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([val]) => onChange(val)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span className="font-medium text-foreground">
            {Math.round(value * 100)}%
          </span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
};
