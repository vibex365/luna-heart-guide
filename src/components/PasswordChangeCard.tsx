import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, Eye, EyeOff, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordChangeCardProps {
  phoneVerified?: boolean;
}

export const PasswordChangeCard = ({ phoneVerified = false }: PasswordChangeCardProps) => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to change your password.",
        variant: "destructive",
      });
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast({
        title: "Weak password",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // If SMS notification is enabled and phone is verified, send SMS
      if (sendSms && phoneVerified) {
        try {
          const { error: smsError } = await supabase.functions.invoke("send-sms", {
            body: {
              action: "send-notification",
              userId: user.id,
              message: `🔐 Luna Security Alert: Your password has been successfully changed. If you didn't make this change, please contact support immediately.`,
            },
          });

          if (smsError) {
            console.error("SMS notification error:", smsError);
            // Don't fail the whole operation if SMS fails
          }
        } catch (smsErr) {
          console.error("Failed to send SMS notification:", smsErr);
        }
      }

      toast({
        title: "Password updated! 🔐",
        description: sendSms && phoneVerified 
          ? "Your password has been changed and a confirmation was sent to your phone."
          : "Your password has been successfully changed.",
      });

      // Clear form
      setNewPassword("");
      setConfirmPassword("");
      setSendSms(false);
    } catch (error: any) {
      console.error("Password change error:", error);
      
      let errorMessage = "Could not update your password. Please try again.";
      
      if (error.message?.includes("weak") || error.message?.includes("password")) {
        errorMessage = "Password is too weak. Please use a stronger password with mixed characters.";
      } else if (error.message?.includes("same")) {
        errorMessage = "New password must be different from your current password.";
      }
      
      toast({
        title: "Password update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <Card className="bg-card rounded-3xl shadow-luna border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Key className="w-5 h-5 text-primary" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10 h-11 rounded-xl"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Min 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords don't match</p>
          )}
        </div>

        {/* SMS Notification Option */}
        {phoneVerified && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="send-sms" className="font-medium text-sm">
                  Send SMS confirmation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get a text when password is changed
                </p>
              </div>
            </div>
            <Switch
              id="send-sms"
              checked={sendSms}
              onCheckedChange={setSendSms}
              disabled={loading}
            />
          </div>
        )}

        {!phoneVerified && (
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground">
              💡 Verify your phone number above to receive SMS password confirmations
            </p>
          </div>
        )}

        <Button
          onClick={handleChangePassword}
          disabled={!isFormValid || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating Password...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
