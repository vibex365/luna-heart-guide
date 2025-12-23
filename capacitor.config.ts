import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talkswithluna.appname',
  appName: 'Luna Ai Relationship Therapist',
  webDir: 'dist',
  // Remove server.url for production - app will use bundled assets
  // Uncomment below for development hot-reload:
  // server: {
  //   url: 'https://7bc1f449-d149-45db-9d96-d4adb7d018b3.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f0a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: '#0f0a1a',
      style: 'LIGHT',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: 'luna',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
};

export default config;
