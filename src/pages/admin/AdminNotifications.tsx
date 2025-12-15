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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ManualSmsSender } from "@/components/admin/ManualSmsSender";
import { SmsTemplatesManager } from "@/components/admin/SmsTemplatesManager";
import { SmsDeliveryLogs } from "@/components/admin/SmsDeliveryLogs";
import { SmsAnalytics } from "@/components/admin/SmsAnalytics";
import { SmsScheduler } from "@/components/admin/SmsScheduler";
import { DailyAffirmationsManager } from "@/components/admin/DailyAffirmationsManager";
import { 
  Bell, 
  Smartphone, 
  Send, 
  Clock,
  MessageSquare,
  CreditCard,
  Settings,
  Play,
  Loader2,
  BarChart3,
  Calendar,
  Sparkles
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-accent" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">SMS Notifications</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Manage SMS notifications, scheduling, and daily affirmations
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2 w-fit">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Runs daily at 9:00 AM UTC</span>
          </Badge>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="analytics" className="space-y-4 md:space-y-6">
          <TabsList className="w-full md:w-auto flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="analytics" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm py-2">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm py-2">
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send SMS</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm py-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="affirmations" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm py-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm py-2">
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 md:space-y-6">
            <SmsAnalytics />
            <SmsDeliveryLogs />
          </TabsContent>

          {/* Send SMS Tab */}
          <TabsContent value="send" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              <SmsTemplatesManager onSelectTemplate={setTemplateMessage} />
              <ManualSmsSender initialMessage={templateMessage} />
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <SmsScheduler />
          </TabsContent>

          {/* Daily Affirmations Tab */}
          <TabsContent value="affirmations">
            <DailyAffirmationsManager />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Low Messages Warning */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                    Low Messages Warning
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Alert free users when running low on daily messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="low-messages-enabled" className="text-sm">Enable notifications</Label>
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
                    <Label htmlFor="low-messages-threshold" className="text-sm">
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
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Free users get 5 messages/day.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTestNotifications("low_messages")}
                    disabled={isSending || !localSettings.low_messages_enabled}
                    className="w-full md:w-auto"
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
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                    Subscription Expiring
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Remind users before their subscription expires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sub-expiring-enabled" className="text-sm">Enable notifications</Label>
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
                    <Label htmlFor="sub-expiring-days" className="text-sm">Days before expiration</Label>
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
                      className="text-sm"
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
                    className="w-full md:w-auto"
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

            {/* SMS Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
                  SMS Configuration
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  SMS notifications are sent via Twilio to users with verified phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 md:p-4 bg-muted rounded-lg">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    SMS notifications are only sent to users who have:
                  </p>
                  <ul className="text-xs md:text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                    <li>A verified phone number</li>
                    <li>SMS notifications enabled in their profile</li>
                  </ul>
                </div>
                <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    📱 SMS Opt-Out Feature Enabled
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Users can unsubscribe from SMS by replying STOP to any message. 
                    They can re-subscribe by replying START.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending} className="w-full sm:w-auto">
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
                className="w-full sm:w-auto"
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  Scheduled Jobs Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Daily Affirmations</p>
                    <p className="text-xs text-muted-foreground">Sends uplifting messages to users</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                    <span className="text-xs text-muted-foreground">9:00 AM UTC</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Scheduled SMS Processor</p>
                    <p className="text-xs text-muted-foreground">Processes scheduled messages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                    <span className="text-xs text-muted-foreground">Every minute</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
