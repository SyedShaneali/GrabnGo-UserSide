// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDXMpPLyhC_cvPYFDwkxs6wcCMiErlLtuQ",
  authDomain: "grabngo-41673.firebaseapp.com",
  projectId: "grabngo-41673",
  storageBucket: "grabngo-41673.firebasestorage.app",
  messagingSenderId: "456367344112",
  appId: "1:456367344112:web:ebb303f1d66113666ef535",
  measurementId: "G-Z528RHTSWK",
};

const app = initializeApp(firebaseConfig);

// Analytics (safe)
export let analytics = null;
isAnalyticsSupported()
  .then((ok) => {
    if (ok) analytics = getAnalytics(app);
  })
  .catch(() => {});

// Messaging (lazy + safe). Returns null when unsupported (e.g. http network IP).
let messagingInstance = null;

export const getSafeMessaging = async () => {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("Service workers unavailable on this origin. Push disabled.");
      return null;
    }
    if (!(await isMessagingSupported())) {
      console.warn("Firebase messaging not supported here. Push disabled.");
      return null;
    }
    if (!messagingInstance) messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (e) {
    console.warn("Messaging init failed:", e);
    return null;
  }
};

export default app;