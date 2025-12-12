import { useState, useEffect } from "react";
import { SubscriptionTier } from "@/pages/admin/AdminSubscriptions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";

interface TierEditDialogProps {
  tier: SubscriptionTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tier: Partial<SubscriptionTier> & { id: string }) => void;
  isUpdating: boolean;
}

export const TierEditDialog = ({
  tier,
  open,
  onOpenChange,
  onSave,
  isUpdating,
}: TierEditDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [limits, setLimits] = useState<Record<string, number | boolean>>({});

  useEffect(() => {
    if (tier) {
      setName(tier.name);
      setDescription(tier.description || "");
      setPrice(String(tier.price_monthly));
      setIsActive(tier.is_active);
      setFeatures(tier.features || []);
      setLimits(tier.limits || {});
    }
  }, [tier]);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleLimitChange = (key: string, value: number | boolean) => {
    setLimits({ ...limits, [key]: value });
  };

  const handleSave = () => {
    if (!tier) return;
    onSave({
      id: tier.id,
      name,
      description,
      price_monthly: parseFloat(price),
      is_active: isActive,
      features,
      limits,
    });
  };

  if (!tier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {tier.name} Plan</DialogTitle>
          <DialogDescription>
            Update plan details, features, and limits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($/month)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Plan Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-4">
            <Label>Features</Label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[index] = e.target.value;
                      setFeatures(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new feature..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Limits */}
          <div className="space-y-4">
            <Label>Limits & Access</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="messages_per_day" className="text-sm font-normal">
                  Messages per day (-1 for unlimited)
                </Label>
                <Input
                  id="messages_per_day"
                  type="number"
                  min="-1"
                  value={limits.messages_per_day as number || 0}
                  onChange={(e) => handleLimitChange("messages_per_day", parseInt(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="text-sm font-normal">
                  Advanced Analytics
                </Label>
                <Switch
                  id="analytics"
                  checked={!!limits.analytics}
                  onCheckedChange={(checked) => handleLimitChange("analytics", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="priority_responses" className="text-sm font-normal">
                  Priority AI Responses
                </Label>
                <Switch
                  id="priority_responses"
                  checked={!!limits.priority_responses}
                  onCheckedChange={(checked) => handleLimitChange("priority_responses", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="data_export" className="text-sm font-normal">
                  Data Export
                </Label>
                <Switch
                  id="data_export"
                  checked={!!limits.data_export}
                  onCheckedChange={(checked) => handleLimitChange("data_export", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ambient_sounds" className="text-sm font-normal">
                  Ambient Sound Library
                </Label>
                <Switch
                  id="ambient_sounds"
                  checked={!!limits.ambient_sounds}
                  onCheckedChange={(checked) => handleLimitChange("ambient_sounds", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="couples_features" className="text-sm font-normal">
                  Couples Features
                </Label>
                <Switch
                  id="couples_features"
                  checked={!!limits.couples_features}
                  onCheckedChange={(checked) => handleLimitChange("couples_features", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
