import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

// Only register Service Worker if NOT running native (Android/iOS)
if (!Capacitor.isNativePlatform()) {
    console.log('📦 PWA: Initializing Service Worker (Web Mode)...');
    registerSW({
        onNeedRefresh() {
            console.log('📦 PWA: New content available, auto-updating...');
        },
        onOfflineReady() {
            console.log('📦 PWA: App ready to work offline');
        },
    });
} else {
    // If running natively, UNREGISTER any existing Service Workers to prevent stale cache
    console.log('📱 Native App: Unregistering any existing Service Workers...');
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                console.log('📱 Native App: Unregistering SW:', registration.scope);
                registration.unregister();
            }
        });
    }
}
