import { supabase } from "@/integrations/supabase/client";

/**
 * Send an SMS notification to a user
 * Will only send if the user has a verified phone number
 */
export const sendSmsNotification = async (
  userId: string,
  message: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        action: "send-notification",
        userId,
        message,
      },
    });

    if (error) {
      console.error("Failed to send SMS notification:", error);
      return false;
    }

    if (data?.error) {
      // User might not have a verified phone - this is expected
      console.log("SMS notification skipped:", data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    return false;
  }
};

/**
 * Notification message templates for couple activities
 */
export const smsTemplates = {
  assessmentComplete: () =>
    "💜 Luna: Your partner just completed their relationship assessment. Check it out to see your updated scores!",

  moodLogged: (mood: string) =>
    `💜 Luna: Your partner just logged their mood: "${mood}". Open Luna to see how they're feeling.`,

  challengeCompleted: (challengeTitle: string) =>
    `💜 Luna: Your partner completed the challenge "${challengeTitle}"! 🎉 Great teamwork!`,

  activityCompleted: (activityTitle: string) =>
    `💜 Luna: Your partner completed the activity "${activityTitle}"! Open Luna to see the details.`,

  goalCompleted: (goalTitle: string) =>
    `💜 Luna: Amazing! Your couple goal "${goalTitle}" has been completed! 🎯`,

  milestoneReminder: (title: string, daysUntil: number) =>
    `💜 Luna: Reminder - "${title}" is ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}! 💕`,

  partnerLinked: (partnerName: string) =>
    `💜 Luna: ${partnerName} has accepted your partner invite! You're now connected. Open Luna to start your journey together.`,
};

/**
 * Send partner notification for various activities
 */
export const notifyPartner = {
  assessmentComplete: (partnerId: string) =>
    sendSmsNotification(partnerId, smsTemplates.assessmentComplete()),

  moodLogged: (partnerId: string, mood: string) =>
    sendSmsNotification(partnerId, smsTemplates.moodLogged(mood)),

  challengeCompleted: (partnerId: string, challengeTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.challengeCompleted(challengeTitle)),

  activityCompleted: (partnerId: string, activityTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.activityCompleted(activityTitle)),

  goalCompleted: (partnerId: string, goalTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.goalCompleted(goalTitle)),

  linked: (partnerId: string, userName: string) =>
    sendSmsNotification(partnerId, smsTemplates.partnerLinked(userName)),
};
