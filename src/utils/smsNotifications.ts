import { supabase } from "@/integrations/supabase/client";

type NotificationType =
  | "assessmentComplete"
  | "moodLogged"
  | "challengeCompleted"
  | "activityCompleted"
  | "goalCompleted"
  | "milestoneReminder"
  | "partnerLinked"
  | "gameStarted"
  | "gameModeSelected"
  | "answerSubmitted"
  | "gameModeSelected"
  | "quizReminder"
  | "quizAnswersReady"
  | "newMessage";

/**
 * Check if a user has a specific notification type enabled
 */
const isNotificationEnabled = async (
  userId: string,
  notificationType: NotificationType
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("sms_notifications_enabled, sms_notification_preferences, phone_verified")
      .eq("user_id", userId)
      .single();

    if (error || !data) return false;
    if (!data.phone_verified) return false;
    if (!data.sms_notifications_enabled) return false;

    const preferences = data.sms_notification_preferences as Record<string, boolean> | null;
    if (!preferences) return true; // Default to enabled if no preferences set
    
    return preferences[notificationType] !== false;
  } catch {
    return false;
  }
};

/**
 * Send an SMS notification to a user
 * Will only send if the user has a verified phone number and notification enabled
 */
export const sendSmsNotification = async (
  userId: string,
  message: string,
  notificationType?: NotificationType
): Promise<boolean> => {
  try {
    // Check if notification type is enabled (if specified)
    if (notificationType) {
      const enabled = await isNotificationEnabled(userId, notificationType);
      if (!enabled) {
        console.log(`SMS notification skipped: ${notificationType} disabled for user`);
        return false;
      }
    }

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

  gameStarted: (partnerName: string, gameType: string) =>
    `💜 Luna: ${partnerName} just started a "${gameType}" game! 🎮 Join now to play together!`,

  gameModeSelected: (partnerName: string, mode: "truth" | "dare") =>
    `💜 Luna: ${partnerName} chose ${mode === "truth" ? "Truth" : "Dare"}! 🎯 Open Luna to type your answer!`,

  answerSubmitted: (partnerName: string) =>
    `💜 Luna: ${partnerName} just submitted their answer! 📝 Open Luna to see it and share yours!`,

  quizReminder: (partnerName: string) =>
    `💜 Luna: ${partnerName} is waiting to play the "How Well Do You Know Me" quiz! 🧠 Set your answers so they can play!`,

  quizAnswersReady: (partnerName: string, partnerHasAnswers: boolean) =>
    partnerHasAnswers
      ? `💜 Luna: ${partnerName} updated their quiz answers! 🧠 You can now play "How Well Do You Know Me" - see how well you really know each other!`
      : `💜 Luna: ${partnerName} just set their quiz answers! 🧠 Set your answers so they can play "How Well Do You Know Me"!`,

  newMessage: (partnerName: string, messageType: "text" | "voice" | "video" | "image") => {
    const typeLabels = {
      text: "message",
      voice: "voice message 🎤",
      video: "video message 🎬",
      image: "photo 📷",
    };
    return `💌 ${partnerName} sent you a ${typeLabels[messageType]}! Open Luna to see it.`;
  },
};

/**
 * Send partner notification for various activities
 */
export const notifyPartner = {
  assessmentComplete: (partnerId: string) =>
    sendSmsNotification(partnerId, smsTemplates.assessmentComplete(), "assessmentComplete"),

  moodLogged: (partnerId: string, mood: string) =>
    sendSmsNotification(partnerId, smsTemplates.moodLogged(mood), "moodLogged"),

  challengeCompleted: (partnerId: string, challengeTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.challengeCompleted(challengeTitle), "challengeCompleted"),

  activityCompleted: (partnerId: string, activityTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.activityCompleted(activityTitle), "activityCompleted"),

  goalCompleted: (partnerId: string, goalTitle: string) =>
    sendSmsNotification(partnerId, smsTemplates.goalCompleted(goalTitle), "goalCompleted"),

  linked: (partnerId: string, userName: string) =>
    sendSmsNotification(partnerId, smsTemplates.partnerLinked(userName), "partnerLinked"),

  gameStarted: (partnerId: string, partnerName: string, gameType: string) =>
    sendSmsNotification(partnerId, smsTemplates.gameStarted(partnerName, gameType), "gameStarted"),

  gameModeSelected: (partnerId: string, partnerName: string, mode: "truth" | "dare") =>
    sendSmsNotification(partnerId, smsTemplates.gameModeSelected(partnerName, mode), "gameModeSelected"),

  answerSubmitted: (partnerId: string, partnerName: string) =>
    sendSmsNotification(partnerId, smsTemplates.answerSubmitted(partnerName), "answerSubmitted"),

  quizReminder: (partnerId: string, partnerName: string) =>
    sendSmsNotification(partnerId, smsTemplates.quizReminder(partnerName), "quizReminder"),

  quizAnswersReady: (partnerId: string, partnerName: string, partnerHasAnswers: boolean) =>
    sendSmsNotification(partnerId, smsTemplates.quizAnswersReady(partnerName, partnerHasAnswers), "quizAnswersReady"),

  newMessage: (partnerId: string, senderName: string, messageType: "text" | "voice" | "video" | "image") =>
    sendSmsNotification(partnerId, smsTemplates.newMessage(senderName, messageType), "newMessage"),
};
