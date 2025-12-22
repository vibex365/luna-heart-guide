import { useState } from "react";
import { Check, Sparkles, Zap, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMinutesWallet, MinutePackage } from "@/hooks/useMinutesWallet";
import { cn } from "@/lib/utils";

interface MinutesPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MinutesPurchaseModal = ({ open, onOpenChange }: MinutesPurchaseModalProps) => {
  const { packages, isLoadingPackages, purchaseMinutes, isPurchasing } = useMinutesWallet();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = () => {
    if (selectedPackage) {
      purchaseMinutes(selectedPackage);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPricePerMinute = (pkg: MinutePackage) => {
    return (pkg.price_cents / pkg.minutes / 100).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Get Luna Voice Minutes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {isLoadingPackages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all relative",
                  selectedPackage === pkg.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {pkg.is_popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pkg.minutes} minutes
                    </p>
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">{formatPrice(pkg.price_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${getPricePerMinute(pkg)}/min
                    </p>
                    {pkg.savings_percent > 0 && (
                      <Badge variant="secondary" className="mt-1 text-green-600">
                        Save {pkg.savings_percent}%
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 left-4">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handlePurchase}
            disabled={!selectedPackage || isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Checkout"
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Secure checkout powered by Stripe. Minutes never expire.
        </p>
      </DialogContent>
    </Dialog>
  );
};
