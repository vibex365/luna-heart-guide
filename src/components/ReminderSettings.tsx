import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReminderSettingsProps {
  reminderEnabled: boolean;
  reminderTime: string;
  onUpdate: (enabled: boolean, time: string) => void;
}

const ReminderSettings = ({ reminderEnabled, reminderTime, onUpdate }: ReminderSettingsProps) => {
  const { user } = useAuth();
  const { permission, isSupported, requestPermission, scheduleReminder } = useNotifications();
  const [enabled, setEnabled] = useState(reminderEnabled);
  const [time, setTime] = useState(reminderTime || "09:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(reminderEnabled);
    setTime(reminderTime || "09:00");
  }, [reminderEnabled, reminderTime]);

  useEffect(() => {
    // Schedule reminder if enabled and permission granted
    if (enabled && permission === "granted") {
      const timeoutId = scheduleReminder(time);
      return () => clearTimeout(timeoutId as unknown as number);
    }
  }, [enabled, time, permission, scheduleReminder]);

  const handleToggle = async (newEnabled: boolean) => {
    if (newEnabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Please enable notifications in your browser settings");
        return;
      }
    }

    setEnabled(newEnabled);
    await saveSettings(newEnabled, time);
  };

  const handleTimeChange = async (newTime: string) => {
    setTime(newTime);
    if (enabled) {
      await saveSettings(enabled, newTime);
    }
  };

  const saveSettings = async (newEnabled: boolean, newTime: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          reminder_enabled: newEnabled,
          reminder_time: newTime,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      onUpdate(newEnabled, newTime);
      toast.success(newEnabled ? "Daily reminders enabled" : "Reminders disabled");
    } catch (error) {
      console.error("Error saving reminder settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="shadow-soft border-border/50">
        <CardContent className="py-6">
          <p className="text-muted-foreground text-sm text-center">
            Push notifications are not supported in your browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-soft border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {enabled ? (
              <Bell className="w-5 h-5 text-accent" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            Daily Mood Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-toggle" className="text-foreground">
                Enable reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Get a gentle nudge to log your mood
              </p>
            </div>
            <Switch
              id="reminder-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 pt-2"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">
                Remind me at:
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-32"
                disabled={saving}
              />
            </motion.div>
          )}

          {permission === "denied" && (
            <p className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReminderSettings;
