import { getToken, onMessage } from "firebase/messaging";
import { getSafeMessaging } from "../firebase";

const VAPID_KEY =
  "BM4Zwyki4tlNxeYwrmc2ZAMnn3lz_zxP6sa8pngRDhLVYoV0tOcAKua6rsVEd041lQxKnxuCmqu7Utcp-HDnxCI";
const SW_PATH = "/firebase-messaging-sw.js?v=1.2"; // bump ?v= whenever the SW/SDK version changes
const FCM_DB_NAME = "firebase-messaging-database";

const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "Notification" in window;

function isVersionError(err) {
  return (
    err?.name === "VersionError" ||
    /requested version.*less than the existing version/i.test(err?.message ?? "")
  );
}

function resetFirebaseMessagingDb() {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(FCM_DB_NAME);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
    req.onblocked = () => resolve(false);
  });
}

async function reregisterServiceWorker() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => r.active?.scriptURL?.includes("firebase-messaging-sw.js"))
      .map((r) => r.unregister())
  );
  return navigator.serviceWorker.register(SW_PATH);
}

/**
 * Requests permission (if not already granted) and returns a fresh FCM token.
 * Returns null (never throws) if push isn't supported, denied, or fails.
 */
export async function requestNotificationPermission() {
  try {
    if (!pushSupported()) {
      console.warn("Push not supported on this origin");
      return null;
    }

    const messaging = await getSafeMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const registration = await navigator.serviceWorker.register(SW_PATH);

    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      console.log("FCM Token:", token);
      return token;
    } catch (tokenErr) {
      if (isVersionError(tokenErr)) {
        console.warn("Stale FCM IndexedDB detected, resetting and retrying");
        await resetFirebaseMessagingDb();
        const freshRegistration = await reregisterServiceWorker();
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: freshRegistration,
        });
        console.log("FCM Token (after reset):", token);
        return token;
      }
      throw tokenErr;
    }
  } catch (err) {
    console.error("Error getting notification permission/token:", err);
    return null;
  }
}

/**
 * Fires onGranted() when notification permission flips to "granted".
 * Returns a cleanup function.
 */
export function watchNotificationPermission(onGranted) {
  if (!navigator.permissions?.query) return () => {};

  let statusRef = null;

  navigator.permissions
    .query({ name: "notifications" })
    .then((status) => {
      statusRef = status;
      status.onchange = () => {
        if (status.state === "granted") {
          console.log("Notification permission re-granted, refreshing token");
          onGranted();
        }
      };
    })
    .catch(() => {});

  return () => {
    if (statusRef) statusRef.onchange = null;
  };
}

/**
 * Foreground messages. Still returns an unsubscribe function synchronously,
 * so your existing useFcmListener code doesn't need to change.
 */
export function listenForForegroundMessages(callback) {
  let unsubscribe = () => {};
  let cancelled = false;

  getSafeMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    unsubscribe = onMessage(messaging, (payload) => callback(payload));
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}