/* global self, clients */
self.addEventListener('push', (event) => {
  let data = { title: 'iRace', body: 'You have an update', url: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        data = { ...data, ...parsed };
      }
    }
  } catch (_) {
    try {
      const text = event.data && event.data.text();
      if (text) data = { ...data, body: text };
    } catch (_) {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url || '/' },
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = event.notification.data && event.notification.data.url;
  const path = typeof raw === 'string' && raw.length > 0 ? raw : '/';
  const target =
    path.startsWith('http') ? path : new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        try {
          if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
            if ('navigate' in client && typeof client.navigate === 'function') {
              return client.navigate(target).then(() => client.focus());
            }
            return client.focus();
          }
        } catch (_) {}
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
