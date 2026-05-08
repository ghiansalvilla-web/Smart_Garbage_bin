importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdmxDRFTyU05XKGZaHaXwcHp-nuwBjVR0",
  databaseURL: "https://smartgarbagebin-996d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  messagingSenderId: "413668818423",  // get this from Firebase console
  appId: "1:413668818423:web:9464b7cd8b074bd01102f2"                  // get this from Firebase console
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body: body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200]
  });
});