importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBdmxDRFTyU05XKGZaHaXwcHp-nuwBjVR0",
  databaseURL: "https://smartgarbagebin-996d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartgarbagebin-996d0",
  messagingSenderId: "413668818423",
  appId: "1:413668818423:web:9464b7cd8b074bd01102f2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notification = payload.notification || {};
  const title = notification.title || "Smart Bin Alert";
  const body = notification.body || "A bin needs attention.";

  self.registration.showNotification(title, {
    body,
    icon: "icon.png",
    badge: "icon.png",
    vibrate: [200, 100, 200]
  });
});
