// Service Worker for Luna Mood Reminders

self.addEventListener('install', (event) => {
  console.log('Luna Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Luna Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Luna Mood Check-in 💜';
  const options = {
    body: data.body || "How are you feeling today? Take a moment to log your mood.",
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'mood-reminder',
    requireInteraction: true,
    actions: [
      { action: 'log', title: 'Log Mood' },
      { action: 'dismiss', title: 'Later' }
    ],
    data: { url: '/mood' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the mood tracker page
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/mood') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/mood');
      }
    })
  );
});
