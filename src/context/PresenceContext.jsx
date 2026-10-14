// context/PresenceContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getWebSocketUrl } from "../config/apiConfig";

const PresenceContext = createContext(null);

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s, 16s...

// A SINGLE shared WebSocket connection, opened once for the whole
// back-office session (mounted around BackOfficeLayout in App.js), purely
// to track who's online. This is intentionally decoupled from any specific
// chat_id — it authenticates with the token and receives presence_snapshot
// (and, defensively, user_online/user_offline — same caveat as in useChat:
// confirm these event names with the backend if live updates don't work)
// regardless of which chat (if any) you currently have open.
//
// ChatScreen's own useChat() socket ALSO still receives presence_snapshot
// on its own connection (that's not being removed/broken by this) — this
// context just makes the same data available on screens, like the chats
// list, that don't open a per-chat socket at all.
export function PresenceProvider({ children }) {
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [presenceConnected, setPresenceConnected] = useState(false);

  const wsRef                = useRef(null);
  const reconnectTimerRef    = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionalCloseRef  = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // not logged in yet — nothing to connect to

    connect();

    return () => {
      intentionalCloseRef.current = true;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    intentionalCloseRef.current = false;
    const url = getWebSocketUrl(token, "back-office-chat");
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Presence socket connected");
      setPresenceConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const { action, payload } = JSON.parse(event.data);

        if (action === "presence_snapshot") {
          const ids = payload?.online_user_ids ?? [];
          setOnlineUserIds(new Set(ids));
        }

        if (action === "user_online") {
          const uid = payload?.user_id ?? payload?.id;
          if (uid != null) setOnlineUserIds(prev => new Set(prev).add(uid));
        }

        if (action === "user_offline") {
          const uid = payload?.user_id ?? payload?.id;
          if (uid != null) {
            setOnlineUserIds(prev => {
              const next = new Set(prev);
              next.delete(uid);
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Presence WS parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ Presence socket error:", err);
      setPresenceConnected(false);
    };

    ws.onclose = () => {
      setPresenceConnected(false);
      if (intentionalCloseRef.current) return;

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("⚠️ Presence socket: max reconnect attempts reached");
        return;
      }
      const attempt = reconnectAttemptsRef.current;
      const delay   = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt);
      reconnectAttemptsRef.current += 1;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  };

  return (
    <PresenceContext.Provider value={{ onlineUserIds, presenceConnected }}>
      {children}
    </PresenceContext.Provider>
  );
}

// usePresence().isUserOnline(userId) — the main thing you'll actually call
// from a chat row / avatar / header, e.g.:
//   const { isUserOnline } = usePresence();
//   <PresenceDotOrWhatever online={isUserOnline(chat.other_user.id)} />
export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence() must be used inside <PresenceProvider>");
  }
  const isUserOnline = (userId) => userId != null && ctx.onlineUserIds.has(Number(userId));
  return { ...ctx, isUserOnline };
}