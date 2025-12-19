import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AgeGateModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AgeGateModal = ({ open, onConfirm, onCancel }: AgeGateModalProps) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      // Store in session to avoid repeated prompts
      sessionStorage.setItem("age_gate_confirmed", "true");
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4"
          >
            <Shield className="w-8 h-8 text-amber-500" />
          </motion.div>
          <DialogTitle className="text-xl">Adult Content Warning</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              This content is intended for adults in committed relationships.
            </p>
            <p className="text-amber-500/80 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Contains intimate themes
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Checkbox
              id="age-confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="age-confirm" className="text-sm leading-relaxed cursor-pointer">
              I confirm that I am 18 years or older and I am playing this with my partner in a consensual, healthy relationship.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Go Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmed}
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            <Heart className="w-4 h-4" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hook to check if age gate has been confirmed this session
export const useAgeGateConfirmed = () => {
  return sessionStorage.getItem("age_gate_confirmed") === "true";
};
