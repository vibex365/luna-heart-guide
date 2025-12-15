import { useState, useEffect } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SmsNotificationPreferencesProps {
  userId: string;
  phoneVerified: boolean;
}

interface NotificationPreferences {
  assessmentComplete: boolean;
  moodLogged: boolean;
  challengeCompleted: boolean;
  activityCompleted: boolean;
  goalCompleted: boolean;
  milestoneReminder: boolean;
  partnerLinked: boolean;
  gameStarted: boolean;
  dailyAffirmations: boolean;
}

const defaultPreferences: NotificationPreferences = {
  assessmentComplete: true,
  moodLogged: true,
  challengeCompleted: true,
  activityCompleted: true,
  goalCompleted: true,
  milestoneReminder: true,
  partnerLinked: true,
  gameStarted: true,
  dailyAffirmations: true,
};

const notificationLabels: Record<keyof NotificationPreferences, { label: string; description: string }> = {
  dailyAffirmations: {
    label: "Daily Affirmations",
    description: "Receive daily uplifting messages to brighten your day",
  },
  assessmentComplete: {
    label: "Assessment Complete",
    description: "When your partner completes a relationship assessment",
  },
  moodLogged: {
    label: "Mood Logged",
    description: "When your partner logs their mood",
  },
  challengeCompleted: {
    label: "Challenge Completed",
    description: "When your partner completes a daily challenge",
  },
  activityCompleted: {
    label: "Activity Completed",
    description: "When your partner completes a couples activity",
  },
  goalCompleted: {
    label: "Goal Completed",
    description: "When a couple goal is completed",
  },
  milestoneReminder: {
    label: "Milestone Reminders",
    description: "Reminders for upcoming relationship milestones",
  },
  partnerLinked: {
    label: "Partner Linked",
    description: "When a partner accepts your invite",
  },
  gameStarted: {
    label: "Game Started",
    description: "When your partner starts a couples game",
  },
};

export const SmsNotificationPreferences = ({
  userId,
  phoneVerified,
}: SmsNotificationPreferencesProps) => {
  const { toast } = useToast();
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("sms_notifications_enabled, sms_notification_preferences")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setMasterEnabled(data.sms_notifications_enabled ?? true);
        if (data.sms_notification_preferences) {
          const prefs = data.sms_notification_preferences as Record<string, boolean>;
          setPreferences({
            ...defaultPreferences,
            ...prefs,
          });
        }
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [userId]);

  const updatePreferences = async (
    newMasterEnabled: boolean,
    newPreferences: NotificationPreferences
  ) => {
    const prefsRecord: Record<string, boolean> = { ...newPreferences };
    const { error } = await supabase
      .from("profiles")
      .update({
        sms_notifications_enabled: newMasterEnabled,
        sms_notification_preferences: prefsRecord,
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    }
  };

  const handleMasterToggle = (checked: boolean) => {
    setMasterEnabled(checked);
    updatePreferences(checked, preferences);
  };

  const handlePreferenceToggle = (key: keyof NotificationPreferences, checked: boolean) => {
    const newPreferences = { ...preferences, [key]: checked };
    setPreferences(newPreferences);
    updatePreferences(masterEnabled, newPreferences);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl p-6 shadow-luna border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-6 shadow-luna border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">SMS Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Choose which notifications to receive
          </p>
        </div>
      </div>

      {!phoneVerified ? (
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            Verify your phone number to enable SMS notifications
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-primary" />
              <Label htmlFor="master-sms" className="font-medium cursor-pointer">
                Enable SMS notifications
              </Label>
            </div>
            <Switch
              id="master-sms"
              checked={masterEnabled}
              onCheckedChange={handleMasterToggle}
            />
          </div>

          {/* Individual preferences */}
          <div className={`space-y-2 ${!masterEnabled ? "opacity-50 pointer-events-none" : ""}`}>
            {(Object.keys(notificationLabels) as Array<keyof NotificationPreferences>).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-border rounded-xl"
                >
                  <div className="flex-1 pr-4">
                    <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                      {notificationLabels[key].label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notificationLabels[key].description}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={preferences[key]}
                    onCheckedChange={(checked) => handlePreferenceToggle(key, checked)}
                  />
                </div>
              )
            )}
          </div>

          {/* Opt-out info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 You can also unsubscribe by replying <strong>STOP</strong> to any SMS. 
              Reply <strong>START</strong> to re-subscribe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
