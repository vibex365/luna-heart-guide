import { useState, useEffect, useCallback } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
          setSwRegistration(registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      if (swRegistration) {
        swRegistration.showNotification(title, options);
      } else if ("Notification" in window) {
        new Notification(title, options);
      }
    },
    [permission, swRegistration]
  );

  const scheduleReminder = useCallback(
    (time: string) => {
      // Parse the time string (HH:MM format)
      const [hours, minutes] = time.split(":").map(Number);
      
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      const delay = reminderTime.getTime() - now.getTime();
      
      // Store the timeout ID so we can cancel it if needed
      const timeoutId = setTimeout(() => {
        showNotification("Luna Mood Check-in 💜", {
          body: "How are you feeling today? Take a moment to log your mood.",
          icon: "/favicon.ico",
          tag: "mood-reminder",
        });
        
        // Schedule the next reminder for the same time tomorrow
        scheduleReminder(time);
      }, delay);
      
      return timeoutId;
    },
    [showNotification]
  );

  return {
    permission,
    isSupported: "Notification" in window,
    requestPermission,
    showNotification,
    scheduleReminder,
  };
}
