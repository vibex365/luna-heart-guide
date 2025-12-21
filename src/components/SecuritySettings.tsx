import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Fingerprint, ScanFace, Lock } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { Capacitor } from "@capacitor/core";
import { Link } from "react-router-dom";

export const SecuritySettings = () => {
  const { isAvailable, biometryType, isEnabled, enableBiometricLock, disableBiometricLock } = useBiometricAuth();

  const BiometricIcon = biometryType === "face" ? ScanFace : Fingerprint;
  const biometricLabel = biometryType === "face" ? "Face ID" : "Touch ID";

  return (
    <Card className="bg-card rounded-3xl shadow-luna border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-5 h-5 text-primary" />
          Security & Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Biometric Lock - Only show on native platforms */}
        {Capacitor.isNativePlatform() && isAvailable && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BiometricIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="biometric-lock" className="font-medium">
                  {biometricLabel} Lock
                </Label>
                <p className="text-xs text-muted-foreground">
                  Require {biometricLabel} to open the app
                </p>
              </div>
            </div>
            <Switch
              id="biometric-lock"
              checked={isEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableBiometricLock();
                } else {
                  disableBiometricLock();
                }
              }}
            />
          </div>
        )}

        {/* Web fallback message */}
        {!Capacitor.isNativePlatform() && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Biometric lock is available in the mobile app
            </p>
          </div>
        )}

        {/* Legal Links */}
        <div className="pt-2 border-t border-border space-y-2">
          <Link 
            to="/privacy" 
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms" 
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
