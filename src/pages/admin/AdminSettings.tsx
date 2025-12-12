import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  Globe,
  Save,
  RotateCcw
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AppSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  // Fetch app settings from luna_config (reusing same table for all configs)
  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("luna_config")
        .select("*")
        .in("key", [
          "app_general",
          "email_settings",
          "notification_settings",
          "security_settings"
        ]);
      if (error) throw error;
      return data as AppSettings[];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      // First check if the setting exists
      const { data: existing } = await supabase
        .from("luna_config")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("luna_config")
          .update({
            value: value as unknown as import("@/integrations/supabase/types").Json,
            updated_at: new Date().toISOString(),
          })
          .eq("key", key);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("luna_config")
          .insert([{
            key,
            value: value as unknown as import("@/integrations/supabase/types").Json,
            description: `App settings for ${key}`,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const getSettingValue = (key: string): Record<string, unknown> => {
    const setting = settings?.find((s) => s.key === key);
    return (setting?.value as Record<string, unknown>) || {};
  };

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    appName: "Luna",
    supportEmail: "support@luna.app",
    maintenanceMode: false,
    allowNewSignups: true,
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    welcomeSubject: "Welcome to Luna! 💜",
    welcomeTemplate: "Hi {{name}},\n\nWelcome to Luna, your AI relationship companion.\n\nWe're here to support you on your journey.\n\nWith care,\nThe Luna Team",
    reminderSubject: "Time for your daily check-in 💜",
    reminderTemplate: "Hi {{name}},\n\nJust a gentle reminder to check in with yourself today.\n\nHow are you feeling?\n\n— Luna",
    weeklyInsightSubject: "Your Weekly Insights from Luna 📊",
    weeklyInsightTemplate: "Hi {{name}},\n\nHere's your weekly emotional wellness summary:\n\n{{insights}}\n\nKeep taking care of yourself!\n\n— Luna",
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    enablePushNotifications: true,
    enableEmailNotifications: true,
    enableCrisisAlerts: true,
    crisisAlertEmail: "safety@luna.app",
    dailyDigest: false,
    weeklyReport: true,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    logSensitiveActions: true,
  });

  // Initialize settings from database
  useState(() => {
    if (settings) {
      const general = getSettingValue("app_general");
      if (Object.keys(general).length > 0) {
        setGeneralSettings((prev) => ({ ...prev, ...general }));
      }
      
      const email = getSettingValue("email_settings");
      if (Object.keys(email).length > 0) {
        setEmailSettings((prev) => ({ ...prev, ...email }));
      }
      
      const notification = getSettingValue("notification_settings");
      if (Object.keys(notification).length > 0) {
        setNotificationSettings((prev) => ({ ...prev, ...notification }));
      }
      
      const security = getSettingValue("security_settings");
      if (Object.keys(security).length > 0) {
        setSecuritySettings((prev) => ({ ...prev, ...security }));
      }
    }
  });

  const handleSaveGeneral = () => {
    updateSettingMutation.mutate({
      key: "app_general",
      value: generalSettings,
    });
  };

  const handleSaveEmail = () => {
    updateSettingMutation.mutate({
      key: "email_settings",
      value: emailSettings,
    });
  };

  const handleSaveNotifications = () => {
    updateSettingMutation.mutate({
      key: "notification_settings",
      value: notificationSettings,
    });
  };

  const handleSaveSecurity = () => {
    updateSettingMutation.mutate({
      key: "security_settings",
      value: securitySettings,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold">App Settings</h1>
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">App Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure app-wide settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic app configuration and display settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="appName">App Name</Label>
                    <Input
                      id="appName"
                      value={generalSettings.appName}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, appName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable the app for users
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow New Signups</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to create accounts
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.allowNewSignups}
                      onCheckedChange={(checked) =>
                        setGeneralSettings({ ...generalSettings, allowNewSignups: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setGeneralSettings({
                        appName: "Luna",
                        supportEmail: "support@luna.app",
                        maintenanceMode: false,
                        allowNewSignups: true,
                      })
                    }
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={handleSaveGeneral} disabled={updateSettingMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Customize email templates sent to users. Use {"{{name}}"} for user name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Welcome Email */}
                <div className="space-y-4">
                  <h3 className="font-medium">Welcome Email</h3>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeSubject">Subject</Label>
                    <Input
                      id="welcomeSubject"
                      value={emailSettings.welcomeSubject}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, welcomeSubject: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeTemplate">Body</Label>
                    <Textarea
                      id="welcomeTemplate"
                      rows={4}
                      value={emailSettings.welcomeTemplate}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, welcomeTemplate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Reminder Email */}
                <div className="space-y-4">
                  <h3 className="font-medium">Daily Reminder Email</h3>
                  <div className="space-y-2">
                    <Label htmlFor="reminderSubject">Subject</Label>
                    <Input
                      id="reminderSubject"
                      value={emailSettings.reminderSubject}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, reminderSubject: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderTemplate">Body</Label>
                    <Textarea
                      id="reminderTemplate"
                      rows={4}
                      value={emailSettings.reminderTemplate}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, reminderTemplate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Weekly Insight Email */}
                <div className="space-y-4">
                  <h3 className="font-medium">Weekly Insights Email</h3>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyInsightSubject">Subject</Label>
                    <Input
                      id="weeklyInsightSubject"
                      value={emailSettings.weeklyInsightSubject}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, weeklyInsightSubject: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyInsightTemplate">Body</Label>
                    <Textarea
                      id="weeklyInsightTemplate"
                      rows={4}
                      value={emailSettings.weeklyInsightTemplate}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, weeklyInsightTemplate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={handleSaveEmail} disabled={updateSettingMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when notifications are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.enablePushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          enablePushNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.enableEmailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          enableEmailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Crisis Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts when crisis keywords are detected
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.enableCrisisAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          enableCrisisAlerts: checked,
                        })
                      }
                    />
                  </div>

                  {notificationSettings.enableCrisisAlerts && (
                    <div className="space-y-2 ml-0">
                      <Label htmlFor="crisisEmail">Crisis Alert Email</Label>
                      <Input
                        id="crisisEmail"
                        type="email"
                        value={notificationSettings.crisisAlertEmail}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            crisisAlertEmail: e.target.value,
                          })
                        }
                        placeholder="safety@luna.app"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email address to receive crisis alerts
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Send daily summary emails to admins
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyDigest}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          dailyDigest: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Send weekly analytics report to admins
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          weeklyReport: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={updateSettingMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security and authentication options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify email before accessing the app
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireEmailVerification: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to enable 2FA on their accounts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          enableTwoFactor: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log Sensitive Actions</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep audit logs of sensitive user actions
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.logSensitiveActions}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          logSensitiveActions: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (days)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min={1}
                        max={90}
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: parseInt(e.target.value) || 30,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto logout after inactivity
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min={3}
                        max={10}
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            maxLoginAttempts: parseInt(e.target.value) || 5,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Lock account after failed attempts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={handleSaveSecurity} disabled={updateSettingMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
