import { useEffect, useRef } from "react";
import {
  requestNotificationPermission,
  watchNotificationPermission,
  listenForForegroundMessages,
} from "../utlls/Notifications";
import { showMessageToast } from "../components/common/CustomToast"; // adjust path if yours lives elsewhere
import { useNotificationCount } from "../context/NotificationCountContext";
import { useRegisterDeviceToken } from "../api/UserRegisterDeviceTokenApi";

const notificationSound = new Audio("/audio/notificationSound.wav"); // copy this file into the user app's public/audio/

export function useFcmListener() {
  const { registerDeviceToken } = useRegisterDeviceToken();
  const { increment, refreshCount } = useNotificationCount();

  // Keep latest versions in refs so the effect below never re-runs just
  // because a function identity changed.
  const registerDeviceTokenRef = useRef(registerDeviceToken);
  const incrementRef = useRef(increment);
  const refreshCountRef = useRef(refreshCount);
  useEffect(() => {
    registerDeviceTokenRef.current = registerDeviceToken;
    incrementRef.current = increment;
    refreshCountRef.current = refreshCount;
  });

  useEffect(() => {
    // Safety net — this hook is mounted only inside the authenticated layout.
    if (!localStorage.getItem("token")) return;

    // One-time cleanup of the old localStorage cache (fcm_registered_*).
    // That cache made the app skip registration whenever it had registered the
    // same browser token before — even if the backend had since moved that token
    // to another account (account switch / logout / login as someone else), so
    // the active user silently stopped receiving pushes.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("fcm_registered_"))
      .forEach((k) => localStorage.removeItem(k));

    // Registers the FCM token against whoever is the ACTIVE account right now.
    // The backend call is an upsert, so it's safe to call on every mount. The
    // only guard is in-memory, so StrictMode / the permission watcher can't
    // double-fire it within the same mount.
    let lastSynced = null;
    const syncToken = async (token) => {
      if (!token || token === lastSynced) return;
      try {
        await registerDeviceTokenRef.current(token, "WEB");
        lastSynced = token;
        console.log("FCM token registered for the active user");
      } catch (err) {
        console.error("FCM token registration failed:", err);
      }
    };

    // Fresh unread count for the active user.
    refreshCountRef.current?.();

    // Already granted (returning user / account switch): sync without prompting.
    // If permission is still "default" we don't ask here — the prompt happens
    // on the login click (a user gesture), see useLogin.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      requestNotificationPermission().then(syncToken);
    }

    // User flips browser permission blocked -> allowed (or answers the prompt late).
    const stopWatching = watchNotificationPermission(async () => {
      const token = await requestNotificationPermission();
      await syncToken(token);
    });

    const unsubscribe = listenForForegroundMessages((payload) => {
      const { title, body } = payload.notification || {};

      showMessageToast(title, body);

      incrementRef.current(1);
      window.dispatchEvent(new Event("new-notification"));

      notificationSound.currentTime = 0;
      notificationSound.play().catch((err) => {
        console.log("Audio play blocked:", err);
      });

      console.log("Foreground message received:", payload);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      stopWatching();
    };
  }, []); // run once on mount
}