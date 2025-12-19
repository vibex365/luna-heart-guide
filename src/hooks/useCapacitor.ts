import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(Capacitor.getPlatform() as 'ios' | 'android' | 'web');

    if (native) {
      // Hide splash screen after app is ready
      SplashScreen.hide().catch(() => {
        // Silently fail if not available
      });

      // Configure status bar for native
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {
        // Silently fail if not available
      });

      StatusBar.setBackgroundColor({ color: '#0f0a1a' }).catch(() => {
        // Silently fail if not available (iOS doesn't support this)
      });
    }
  }, []);

  // Native haptic feedback using Capacitor Haptics
  const triggerHaptic = useCallback(async (type: HapticType = 'light') => {
    if (!isNative) {
      // Fallback to web vibration API
      if ('vibrate' in navigator) {
        const patterns: Record<HapticType, number | number[]> = {
          light: 10,
          medium: 20,
          heavy: 30,
          selection: 5,
          success: [10, 50, 10],
          warning: [20, 50, 20],
          error: [30, 50, 30, 50, 30],
        };
        try {
          navigator.vibrate(patterns[type]);
        } catch {
          // Silently fail
        }
      }
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch {
      // Silently fail if haptics not available
    }
  }, [isNative]);

  // Check if a plugin is available
  const isPluginAvailable = useCallback((pluginName: string) => {
    return Capacitor.isPluginAvailable(pluginName);
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
    triggerHaptic,
    isPluginAvailable,
  };
}
