import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcnote.app',
  appName: 'ArcNote',
  webDir: 'dist',
  /* 
  server: {
    // Untuk development: point ke dev server di PC (via LAN/Ethernet)
    url: 'http://10.1.78.50:5173',
    cleartext: true
  } 
  */
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '1011021962181-tg88l0en2paksh9emiaajeqa9cfnhc5h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};


export default config;
