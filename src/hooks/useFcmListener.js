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

    // Registers the FCM token against whoever is the ACTIVE account right now.
    // Needed because switching accounts in UserLayout swaps the stored token and
    // reloads without calling login, so the new user would otherwise never get
    // this device registered. Skips the call if this user already has this token.
    const syncToken = async (token) => {
      if (!token) return;
      const userKey = `fcm_registered_${localStorage.getItem("active_user_id") || "me"}`;
      if (localStorage.getItem(userKey) === token) return;
      try {
        await registerDeviceTokenRef.current(token, "WEB");
        localStorage.setItem(userKey, token);
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