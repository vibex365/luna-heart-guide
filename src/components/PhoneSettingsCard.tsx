import { useState } from "react";
import { Phone, Check, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneVerification } from "@/components/PhoneVerification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PhoneSettingsCardProps {
  userId: string;
  phoneNumber: string | null;
  phoneVerified: boolean;
  onPhoneUpdated: (phone: string) => void;
}

export const PhoneSettingsCard = ({
  userId,
  phoneNumber,
  phoneVerified,
  onPhoneUpdated,
}: PhoneSettingsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatPhoneDisplay = (phone: string | null) => {
    if (!phone) return "Not set";
    // Keep the country code and format the rest
    if (phone.startsWith("+1") && phone.length === 12) {
      // US/Canada format
      const local = phone.slice(2);
      return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
    }
    // Generic international format
    return phone;
  };

  const getInitialCountryCode = (phone: string | null) => {
    if (!phone) return "+1";
    // Extract country code from phone
    const match = phone.match(/^\+(\d{1,4})/);
    return match ? `+${match[1]}` : "+1";
  };

  const getInitialPhoneNumber = (phone: string | null) => {
    if (!phone) return "";
    // Remove country code
    const match = phone.match(/^\+\d{1,4}(.*)$/);
    return match ? match[1] : "";
  };

  const handleVerified = (phone: string) => {
    onPhoneUpdated(phone);
    setIsOpen(false);
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-luna border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${phoneVerified ? "bg-green-500/10" : "bg-accent/10"}`}>
            <Phone className={`w-5 h-5 ${phoneVerified ? "text-green-500" : "text-accent"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Phone Number</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {formatPhoneDisplay(phoneNumber)}
              </p>
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-500">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {phoneNumber ? (
                <>
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Change
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {phoneNumber ? "Update Phone Number" : "Add Phone Number"}
              </DialogTitle>
            </DialogHeader>
            <PhoneVerification
              userId={userId}
              onVerified={handleVerified}
              initialPhone={getInitialPhoneNumber(phoneNumber)}
              initialCountryCode={getInitialCountryCode(phoneNumber)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Used for SMS notifications when your partner completes activities.
      </p>
    </div>
  );
};
