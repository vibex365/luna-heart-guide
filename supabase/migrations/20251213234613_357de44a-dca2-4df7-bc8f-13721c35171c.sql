-- Add SMS notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notification_preferences jsonb DEFAULT '{"assessmentComplete": true, "moodLogged": true, "challengeCompleted": true, "activityCompleted": true, "goalCompleted": true, "milestoneReminder": true, "partnerLinked": true}'::jsonb;