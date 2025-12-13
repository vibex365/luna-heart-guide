import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PUSH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications`;

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        // Check current permission state
        setPermissionState(Notification.permission);
        
        await fetchVapidKey();
        await checkSubscription();
      }
    };

    checkSupport();
  }, []);

  const fetchVapidKey = async () => {
    try {
      const response = await fetch(PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get-vapid-key' }),
      });

      if (response.ok) {
        const data = await response.json();
        setVapidPublicKey(data.vapidPublicKey);
      }
    } catch (error) {
      console.error('Error fetching VAPID key:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      console.warn('Push notifications not available or user not logged in');
      return false;
    }

    setIsLoading(true);
    try {
      // First, request notification permission if not granted
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermissionState(result);
        if (result !== "granted") {
          console.warn('Notification permission denied');
          return false;
        }
      } else if (Notification.permission === "denied") {
        console.warn('Notifications are blocked by the browser');
        return false;
      }

      // Wait for vapid key if not yet loaded
      let key = vapidPublicKey;
      if (!key) {
        await fetchVapidKey();
        // Re-check after fetching
        const response = await fetch(PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-vapid-key' }),
        });
        if (response.ok) {
          const data = await response.json();
          key = data.vapidPublicKey;
          setVapidPublicKey(key);
        }
      }

      if (!key) {
        console.error('No VAPID key available');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      // Create new subscription if not exists
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(key);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
        },
      };

      // Save to backend
      const response = await fetch(PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscriptionData,
          userId: user.id,
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from backend
        await fetch(PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'unsubscribe',
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: '',
                auth: '',
              },
            },
            userId: user.id,
          }),
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
