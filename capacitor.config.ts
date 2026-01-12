import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcnote.app',
  appName: 'ArcNote',
  webDir: 'dist',
  server: {
    // Untuk development: point ke dev server di PC (via hotspot)
    url: 'http://192.168.137.1:5173',
    cleartext: true
  }
};

export default config;
