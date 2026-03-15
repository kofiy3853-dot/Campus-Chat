import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campuschat.app',
  appName: 'Campus-Networking',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
