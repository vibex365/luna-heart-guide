import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ManualSmsSender } from "@/components/admin/ManualSmsSender";
import { SmsTemplatesManager } from "@/components/admin/SmsTemplatesManager";
import { SmsDeliveryLogs } from "@/components/admin/SmsDeliveryLogs";
import { 
  Bell, 
  Smartphone, 
  Send, 
  Clock,
  MessageSquare,
  CreditCard,
  Settings,
  Play,
  Loader2
} from "lucide-react";

interface NotificationSettings {
  low_messages_enabled: boolean;
  low_messages_threshold: number;
  subscription_expiring_enabled: boolean;
  subscription_expiring_days: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  low_messages_enabled: true,
  low_messages_threshold: 2,
  subscription_expiring_enabled: true,
  subscription_expiring_days: 3,
};

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  // Fetch notification settings from luna_config
  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ["admin-notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("luna_config")
        .select("value")
        .eq("key", "notification_settings")
        .maybeSingle();

      if (error) throw error;
      return (data?.value as unknown as NotificationSettings) || DEFAULT_SETTINGS;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const { data: existing } = await supabase
        .from("luna_config")
        .select("id")
        .eq("key", "notification_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("luna_config")
          .update({
            value: newSettings as any,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "notification_settings");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("luna_config")
          .insert({
            key: "notification_settings",
            value: newSettings as any,
            description: "Email notification settings",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const handleSendTestNotifications = async (type: "low_messages" | "subscription_expiring" | "all") => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-notifications", {
        body: {
          type: type === "all" ? "low_messages" : type,
          checkAll: type === "all",
        },
      });

      if (error) throw error;
      
      toast.success(`Sent ${data.notificationsSent} notification(s)`);
    } catch (err) {
      console.error("Failed to send notifications:", err);
      toast.error("Failed to send notifications");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-2xl font-bold">SMS Notification Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure automated SMS notifications (sent via Twilio)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3 w-3" />
            Runs daily at 9:00 AM UTC
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Messages Warning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Low Messages Warning
              </CardTitle>
              <CardDescription>
                Alert free users when they're running low on daily messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="low-messages-enabled">Enable notifications</Label>
                <Switch
                  id="low-messages-enabled"
                  checked={localSettings.low_messages_enabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, low_messages_enabled: checked })
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="low-messages-threshold">
                  Notify when remaining messages ≤
                </Label>
                <Input
                  id="low-messages-threshold"
                  type="number"
                  min={1}
                  max={5}
                  value={localSettings.low_messages_threshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      low_messages_threshold: parseInt(e.target.value) || 2,
                    })
                  }
                  disabled={!localSettings.low_messages_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Free users get 5 messages/day. Set threshold to trigger warning.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendTestNotifications("low_messages")}
                disabled={isSending || !localSettings.low_messages_enabled}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Send Now
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Expiring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Expiring
              </CardTitle>
              <CardDescription>
                Remind users before their subscription expires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sub-expiring-enabled">Enable notifications</Label>
                <Switch
                  id="sub-expiring-enabled"
                  checked={localSettings.subscription_expiring_enabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      subscription_expiring_enabled: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sub-expiring-days">Days before expiration</Label>
                <Input
                  id="sub-expiring-days"
                  type="number"
                  min={1}
                  max={14}
                  value={localSettings.subscription_expiring_days}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      subscription_expiring_days: parseInt(e.target.value) || 3,
                    })
                  }
                  disabled={!localSettings.subscription_expiring_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Notify this many days before subscription ends.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendTestNotifications("subscription_expiring")}
                disabled={isSending || !localSettings.subscription_expiring_enabled}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Send Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              SMS Configuration
            </CardTitle>
            <CardDescription>
              SMS notifications are sent via Twilio to users with verified phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                SMS notifications are only sent to users who have:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                <li>A verified phone number</li>
                <li>SMS notifications enabled in their profile</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* SMS Templates and Sender Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* SMS Templates */}
          <SmsTemplatesManager onSelectTemplate={setTemplateMessage} />
          
          {/* Manual SMS Sender */}
          <ManualSmsSender initialMessage={templateMessage} />
        </div>

        {/* Delivery Logs */}
        <SmsDeliveryLogs />

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSendTestNotifications("all")}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send All Notifications Now
          </Button>
        </div>

        {/* Cron Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Job Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-500">Active</Badge>
              <span className="text-sm text-muted-foreground">
                Notifications are sent daily at 9:00 AM UTC via pg_cron
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
