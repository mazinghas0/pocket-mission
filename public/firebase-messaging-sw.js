importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBudIcC1zrKzgY8m5k58lvEF30C6u024ZA',
  authDomain: 'pocket-mission.firebaseapp.com',
  projectId: 'pocket-mission',
  storageBucket: 'pocket-mission.firebasestorage.app',
  messagingSenderId: '203814836932',
  appId: '1:203814836932:web:ad008fab80add75d6e8791',
});

const messaging = firebase.messaging();

let badgeCount = 0;

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? '포켓미션';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });

  badgeCount += 1;
  if (navigator.setAppBadge) {
    navigator.setAppBadge(badgeCount).catch(function() {});
  }
});

self.addEventListener('notificationclick', function() {
  badgeCount = 0;
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(function() {});
  }
});
