// Self-destructing Service Worker
// This file replaces the old 'sw.js' to unregister it and clear caches.

self.addEventListener('install', (event) => {
    // Install immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        // 1. Delete all caches (Workbox, custom, etc.)
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => caches.delete(key)));
        }).then(() => {
            // 2. Unregister the Service Worker
            return self.registration.unregister();
        }).then(() => {
            // 3. Take control of all clients
            return self.clients.claim();
        }).then(() => {
            // 4. Force reload all clients
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach((client) => {
                if (client.url && 'navigate' in client) {
                    client.navigate(client.url);
                }
            });
        })
    );
});
