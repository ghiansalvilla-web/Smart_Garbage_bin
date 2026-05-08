importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdmxDRFTyU05XKGZaHaXwcHp-nuwBjVR0",
  databaseURL: "https://smartgarbagebin-996d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartgarbagebin-996d0",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200]
  });
});
