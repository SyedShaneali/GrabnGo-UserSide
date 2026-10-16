// v1.2 — bump this comment AND the ?v= in every navigator.serviceWorker.register(...) call
// whenever you change the Firebase SDK version or config below, so browsers fetch a fresh worker
// instead of serving a stale cached one (which is what causes the IndexedDB VersionError).

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Must be the SAME config as src/firebase.js (note the appId).
firebase.initializeApp({
  apiKey: "AIzaSyDXMpPLyhC_cvPYFDwkxs6wcCMiErlLtuQ",
  authDomain: "grabngo-41673.firebaseapp.com",
  projectId: "grabngo-41673",
  storageBucket: "grabngo-41673.firebasestorage.app",
  messagingSenderId: "456367344112",
  appId: "1:456367344112:web:ebb303f1d66113666ef535",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? payload.data ?? {};
  if (!title) return;
  self.registration.showNotification(title, { body, icon: "/icon.png" });
});