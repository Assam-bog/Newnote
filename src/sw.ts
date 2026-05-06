/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { db } from './db';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Background Reminder System
let reminderInterval: any = null;

const checkReminders = async () => {
  const now = Date.now();
  try {
    const overdueReminders = await db.reminders
      .where('time')
      .belowOrEqual(now)
      .and(r => !r.isCompleted)
      .toArray();

    for (const r of overdueReminders) {
      self.registration.showNotification('QuiqNote Reminder', {
        body: r.text,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: r.id,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false, // This helps with system tone
      } as any);

      // Mark as completed
      await db.reminders.update(r.id, { isCompleted: true });
    }
  } catch (error) {
    console.error('SW: Error checking reminders', error);
  }
};

// Start checking
const startReminderTimer = () => {
  if (reminderInterval) return;
  reminderInterval = setInterval(checkReminders, 15000); // Check every 15s
};

self.addEventListener('install', () => {
  console.log('SW: installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: activated');
  event.waitUntil(self.clients.claim());
  startReminderTimer();
});

// Listener for when the SW is woken up by other events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    checkReminders();
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
