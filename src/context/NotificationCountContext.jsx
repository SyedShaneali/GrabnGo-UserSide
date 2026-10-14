import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getNotificationCountApi } from "../api/NotificationApi";

const NotificationCountContext = createContext(null);

export function NotificationCountProvider({ children }) {
  const [count, setCount] = useState(0);

  const increment = useCallback((by = 1) => {
    setCount((c) => c + by);
  }, []);

  const refreshCount = useCallback(async () => {
    // ⭐ Guard: don't call an authenticated endpoint before there's a token —
    // this was firing on the Login page itself and contributing to the reload loop.
    if (!localStorage.getItem("token")) return;

    try {
      const data = await getNotificationCountApi();
      setCount(data.count ?? data.unread_count ?? 0); // adjust to your API's actual shape
    } catch (e) {
      console.error("Failed to refresh notification count:", e);
    }
  }, []);

  const resetCount = useCallback(() => setCount(0), []);

  // Resync whenever something gets marked seen elsewhere in the app
  useEffect(() => {
    const handler = () => refreshCount();
    window.addEventListener("notification-seen", handler);
    return () => window.removeEventListener("notification-seen", handler);
  }, [refreshCount]);

  // ⭐ Safety-net fetch on initial mount — now guarded inside refreshCount(),
  // so this is a no-op on the Login page and only actually fetches once logged in.
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // ⭐ NEW — re-fetch the moment a login sets the token, without needing a
  // full page reload. Have Login.jsx do:
  //   window.dispatchEvent(new Event("auth-token-set"));
  // right after localStorage.setItem("token", ...).
  useEffect(() => {
    const handler = () => refreshCount();
    window.addEventListener("auth-token-set", handler);
    return () => window.removeEventListener("auth-token-set", handler);
  }, [refreshCount]);

  return (
    <NotificationCountContext.Provider value={{ count, increment, refreshCount, resetCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export const useNotificationCount = () => useContext(NotificationCountContext);