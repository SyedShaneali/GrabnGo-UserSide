// hooks/useChat.js
import { useState, useEffect, useRef } from "react";
import { getMessagesApi, startChatApi } from "../api/chatApi";
import { presignAttachmentsApi, uploadFileToPresignedUrl } from "../api/attachmentApi";
import { getWebSocketUrl } from "../config/apiConfig";

const tempId = () => `temp_${Date.now()}`;

const statusMap = {
  SENT:      "sent",
  DELIVERED: "delivered",
  SEEN:      "seen",
};

const EXT_TO_MIME = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword", docx: "application/msword",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.ms-excel",
  zip: "application/zip", rar: "application/zip",
  mp4: "video/mp4", mp3: "audio/mpeg",
};

const guessMimeFromName = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
};

// Same normalization as back-office: the backend may send each attachment
// as a plain string (S3 key) or an object like { key, url } with no
// filename/type field, and `url` often carries a presigned query string
// that must not be used to derive the name.
const stripQuery = (str = "") => str.split("?")[0];

const normalizeAttachment = (item) => {
  if (typeof item === "string") {
    const clean = stripQuery(item);
    const name  = clean.split("/").pop() || "attachment";
    return { url: item, name, type: guessMimeFromName(name) };
  }
  if (item && typeof item === "object") {
    const url = item.url ?? item.upload_url ?? item.key ?? "";
    const nameSource = item.name ?? item.filename ?? item.key ?? url;
    const name = stripQuery(nameSource).split("/").pop() || "attachment";
    const type = item.type ?? item.mime_type ?? guessMimeFromName(name);
    return { url, name, type };
  }
  return { url: "", name: "attachment", type: "application/octet-stream" };
};

const normalizeAttachments = (list) => Array.isArray(list) ? list.map(normalizeAttachment) : [];

// Pull a "list of seen message ids" out of a messages_seen payload no
// matter which field name the backend actually uses. Backends drift on
// this naming a lot (message_ids / messageIds / ids / a single message_id),
// and a silent mismatch here is exactly what makes ticks get "stuck" or
// vanish instead of turning blue — this makes the read tolerant instead
// of hard-coding one shape.
const extractSeenIds = (payload) => {
  const raw =
    payload?.message_ids ??
    payload?.messageIds ??
    payload?.ids ??
    (payload?.message_id != null ? [payload.message_id] : []) ??
    (payload?.messageId != null ? [payload.messageId] : []);
  return Array.isArray(raw) ? raw.map(String) : [];
};

// Keep the socket alive during long operations (e.g. attachment upload).
const KEEPALIVE_INTERVAL_MS = 5000;

// Reconnect backoff settings
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s, 16s...

// TEMP DEBUG SWITCH — flip to false once ticks are confirmed working.
// Logs every raw WS frame so we can see the exact field names/types the
// backend actually sends for message_sent / messages_seen.
const DEBUG_WS = true;

export function useChat(receiverId) {
  // The logged-in user's own id — used to tell "my" messages apart from
  // the other party's, instead of the back-office's hardcoded ADMIN_SENDER_ID.
  const currentUserId = Number(localStorage.getItem("user_id")) || null;

  const [chatId, setChatId]                   = useState(null);
  const [messages, setMessages]               = useState([]);
  const [hasConversation, setHasConversation] = useState(false);
  // TODO: no deactivate endpoint on the user side yet — if the chat/message
  // payload ever includes an `is_active`/`is_closed` flag, set isClosed from
  // that (e.g. in loadMessages / startConversation) so the input disables
  // itself when back-office has deactivated the chat.
  const [isClosed, setIsClosed]               = useState(false);
  const [sending, setSending]                 = useState(false);
  const [starting, setStarting]               = useState(false);
  const [connected, setConnected]             = useState(false);
  const [isUserTyping, setIsUserTyping]       = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [startError, setStartError]           = useState(null);
  // Set of user IDs currently online, per the server's `presence_snapshot`
  // (and the incremental user_online/user_offline events below). This is
  // NOT the same thing as `connected` — `connected` is whether *our own*
  // socket is alive; `onlineUserIds` tells us whether the *other person* is.
  const [onlineUserIds, setOnlineUserIds]     = useState(new Set());

  const wsRef              = useRef(null);
  const chatIdRef          = useRef(null);
  const typingTimeoutRef   = useRef(null);
  const keepAliveRef       = useRef(null);
  const reconnectTimerRef  = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionalCloseRef  = useRef(false); // true when WE closed it on purpose (unmount)
  const pendingSendRef       = useRef(null);  // {content, attachmentKeys, type} to retry after reconnect
  // "seen" acks that arrived for a real message id BEFORE our own
  // message_sent ack swapped the temp_ bubble over to that real id. Without
  // this, a messages_seen event that races the ack gets dropped on the
  // floor (no bubble has that id yet) and the tick silently gets stuck on
  // "delivered" forever. message_sent checks this set and upgrades straight
  // to "seen" if the id is already here. Ids are always stored as strings
  // here so number/string mismatches between events never cause a silent
  // match failure.
  const pendingSeenIdsRef    = useRef(new Set());

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      disconnectWebSocket();
      clearTimeout(typingTimeoutRef.current);
      clearInterval(keepAliveRef.current);
      clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  // ── Connect WebSocket ──────────────────────────────────────────────────
  const connectWebSocket = (id) => {
    const token = localStorage.getItem("token");
    const url   = getWebSocketUrl(token, "user-chat");

    intentionalCloseRef.current = false;

    const ws = new WebSocket(url);
    wsRef.current     = ws;
    chatIdRef.current = id;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttemptsRef.current = 0; // reset backoff on successful connect

      // Tell the server which chat this socket is "in" — required by the
      // user-chat contract (typing/seen events are scoped to a chat_id).
      ws.send(JSON.stringify({
        action:  "enter_chat",
        payload: { chat_id: id },
      }));

      // If we had a message queued up when the socket dropped, retry it now.
      if (pendingSendRef.current) {
        const { content, attachmentKeys, type } = pendingSendRef.current;
        pendingSendRef.current = null;
        ws.send(JSON.stringify({
          action:  "send_message",
          payload: {
            chat_id:    chatIdRef.current,
            content,
            type,
            attachment: attachmentKeys ?? [],
          },
        }));
      }
    };

    ws.onmessage = (event) => {
      if (DEBUG_WS) {
        // TEMP — remove once ticks are confirmed working. This is the
        // fastest way to see the *actual* field names/types the backend
        // sends for message_sent / messages_seen, instead of guessing.
        console.log("[WS RAW]", event.data);
      }

      try {
        const { action, payload } = JSON.parse(event.data);

        const incomingChatId = payload?.chat_id;
        if (incomingChatId && incomingChatId !== chatIdRef.current) {
          // Presence events aren't scoped to a chat_id, so let them fall
          // through even when this guard would otherwise bail out below.
          if (action !== "presence_snapshot" && action !== "user_online" && action !== "user_offline") {
            return;
          }
        }

        // ── presence_snapshot: full list of currently-online user ids ────
        // Authoritative for "who's online right now" — replace, don't merge.
        if (action === "presence_snapshot") {
          const ids = payload?.online_user_ids ?? [];
          setOnlineUserIds(new Set(ids));
        }

        // ── user_online / user_offline: incremental presence updates ─────
        if (action === "user_online") {
          const uid = payload?.user_id ?? payload?.id;
          if (uid != null) {
            setOnlineUserIds(prev => new Set(prev).add(uid));
          }
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

        // ── message_sent ACK → upgrade optimistic bubble to "delivered" ──
        // (or straight to "seen" if a messages_seen event for this id
        // already arrived and is sitting in pendingSeenIdsRef — see note
        // on that ref above.) Id is stringified before checking the
        // pending-seen set, since messages_seen ids are stored as strings.
        if (action === "message_sent") {
          const idKey = String(payload.id);
          const alreadySeen = pendingSeenIdsRef.current.has(idKey);
          if (alreadySeen) pendingSeenIdsRef.current.delete(idKey);

          setMessages(prev =>
            prev.map(m => {
              const isMatch =
                typeof m.id === "string" &&
                m.id.startsWith("temp_") &&
                m.content === payload.content;

              if (!isMatch) return m;

              if (m._localFiles) {
                m._localFiles.forEach(lf => URL.revokeObjectURL(lf.url));
              }

              return {
                ...payload,
                chat_id:     payload.chat_id,
                sender_id:   payload.sender_id ?? currentUserId,
                status:      alreadySeen ? "seen" : "delivered",
                attachment:  normalizeAttachments(payload.attachment),
                _localFiles: undefined,
              };
            })
          );
          setSending(false);
        }

        // ── new_message: incoming from the other party ─────────────────
        // Dedupe by stringified id — avoids a rare double-render if the
        // backend ever sends numeric ids that get compared against a
        // stringified id elsewhere.
        if (action === "new_message") {
          setIsUserTyping(false);
          clearTimeout(typingTimeoutRef.current);

          setMessages(prev => {
            const exists = prev.some(m => String(m.id) === String(payload.id));
            if (exists) return prev;
            return [...prev, {
              ...payload,
              status:     "delivered",
              attachment: normalizeAttachments(payload.attachment),
            }];
          });

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              action:  "messages_seen",
              payload: { chat_id: chatIdRef.current },
            }));
          }
        }

        // ── messages_seen → blue ticks on my own messages ──────────────
        // Ids are normalized to strings via extractSeenIds() so a
        // number/string mismatch between message_sent's payload.id and
        // this event's id list never causes a silent match failure (which
        // is what made ticks appear "stuck" or vanish instead of turning
        // blue). Any id here that doesn't match a bubble yet (because its
        // message_sent ack hasn't landed) is queued in pendingSeenIdsRef
        // and applied the moment that ack arrives, above.
        if (action === "messages_seen") {
          const seenIds = new Set(extractSeenIds(payload));
          seenIds.forEach(id => pendingSeenIdsRef.current.add(id));

          setMessages(prev =>
            prev.map(m => {
              const key = String(m.id);
              if (!seenIds.has(key)) return m;
              pendingSeenIdsRef.current.delete(key);
              return { ...m, status: "seen" };
            })
          );
        }

        // ── typing_start / typing_stop (other user) ─────────────────────
        if (action === "typing_start") {
          setIsUserTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 3000);
        }
        if (action === "typing_stop") {
          clearTimeout(typingTimeoutRef.current);
          setIsUserTyping(false);
        }

        // ── server-side error ────────────────────────────────────────────
        if (action === "error") {
          console.error("WS error action:", payload?.message);
        }

      } catch (err) {
        console.error("WS parse error:", err);
        setSending(false);
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setSending(false);
    };

    ws.onclose = () => {
      setConnected(false);
      clearInterval(keepAliveRef.current);

      if (intentionalCloseRef.current) return;
      attemptReconnect(id);
    };
  };

  // ── Reconnect with exponential backoff ─────────────────────────────────
  const attemptReconnect = (id) => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

    const attempt = reconnectAttemptsRef.current;
    const delay   = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt);
    reconnectAttemptsRef.current += 1;

    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      connectWebSocket(id);
    }, delay);
  };

  // ── Disconnect WebSocket ───────────────────────────────────────────────
  const disconnectWebSocket = () => {
    clearInterval(keepAliveRef.current);
    clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN && chatIdRef.current) {
        wsRef.current.send(JSON.stringify({ action: "leave_chat" }));
      }
      wsRef.current.close();
      wsRef.current     = null;
      chatIdRef.current = null;
    }
  };

  // ── Keepalive ping during long operations (e.g. attachment upload) ─────
  const startKeepAlive = () => {
    clearInterval(keepAliveRef.current);
    keepAliveRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // NOTE: no explicit "ping" action is documented in the user-chat
        // contract — confirm with backend if this should be removed, or
        // swap for whatever heartbeat action (if any) it expects.
        wsRef.current.send(JSON.stringify({ action: "ping" }));
      }
    }, KEEPALIVE_INTERVAL_MS);

    return () => clearInterval(keepAliveRef.current);
  };

  // ── Load messages via REST ─────────────────────────────────────────────
  // Backend returns messages newest-first; the UI needs oldest-first.
  const loadMessages = async (id) => {
    try {
      const data = await getMessagesApi(id);
      const msgs = data?.items ?? data ?? [];
      const oldestFirst = [...msgs].reverse();
      setMessages(oldestFirst.map(m => ({
        ...m,
        // Case-insensitive lookup: the backend has been seen sending both
        // "SEEN" and "seen" for this field. The old strict-uppercase-key
        // lookup silently fell through to "delivered" for anything not
        // spelled exactly like the map's keys, which is why historical
        // messages that WERE seen still rendered as single/grey ticks
        // after a reload.
        status:     statusMap[(m.status ?? "").toUpperCase()] ?? "delivered",
        attachment: normalizeAttachments(m.attachment),
      })));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // ── Start conversation ─────────────────────────────────────────────────
  const startConversation = async () => {
    if (!receiverId) return;
    setStarting(true);
    setStartError(null);
    try {
      const data = await startChatApi(receiverId);
      const id   = data.id;

      setChatId(id);
      setHasConversation(true);

      await loadMessages(id);
      connectWebSocket(id);
    } catch (err) {
      const backendMessage = err?.response?.data?.error;
      setStartError(backendMessage || "Something went wrong starting the conversation.");
    } finally {
      setStarting(false);
    }
  };

  const clearStartError = () => setStartError(null);

  // ── Send message via WebSocket (optimistic, text only) ─────────────────
  const sendMessage = (content) => {
    if (!chatIdRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not ready, cannot send message");
      return;
    }

    setSending(true);

    const optimisticMsg = {
      id:          tempId(),
      chat_id:     chatIdRef.current,
      content,
      type:        "TEXT",
      sender_id:   currentUserId,
      created_at:  new Date().toISOString(),
      send_time:   new Date().toISOString(),
      status:      "sent",
    };
    setMessages(prev => [...prev, optimisticMsg]);

    wsRef.current.send(JSON.stringify({
      action:  "send_message",
      payload: {
        chat_id:    chatIdRef.current,
        content,
        type:       "TEXT",
        attachment: [],
      },
    }));
  };

  // ── Send message WITH attachments (presign → upload → send) ────────────
  const sendMessageWithAttachments = async (content, files) => {
    if (!chatIdRef.current) {
      console.warn("No active chat, cannot send message");
      return;
    }
    if (!files || files.length === 0) {
      sendMessage(content);
      return;
    }

    setUploadingAttachment(true);
    setSending(true);

    const optimisticId = tempId();
    const optimisticMsg = {
      id:          optimisticId,
      chat_id:     chatIdRef.current,
      content,
      type:        "ATTACHMENT",
      attachment:  [],
      _localFiles: files.map(f => ({
        url:      URL.createObjectURL(f),
        type:     f.type,
        name:     f.name,
        progress: 0,
      })),
      sender_id:   currentUserId,
      created_at:  new Date().toISOString(),
      send_time:   new Date().toISOString(),
      status:      "sent",
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const setFileProgress = (fileName, percent) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== optimisticId || !m._localFiles) return m;
        return {
          ...m,
          _localFiles: m._localFiles.map(lf =>
            lf.name === fileName ? { ...lf, progress: percent } : lf
          ),
        };
      }));
    };

    const stopKeepAlive = startKeepAlive();

    try {
      const filenames = files.map(f => f.name);
      const { uploads } = await presignAttachmentsApi(filenames);

      // Index-matched, not filename-matched — the presign response doesn't
      // reliably echo a filename back (see attachmentApi.js), so `uploads[i]`
      // corresponds to `files[i]` purely by send order.
      await Promise.all(
        uploads.map((u, i) => {
          const file = files[i];
          return uploadFileToPresignedUrl(u.upload_url, file, (percent) => {
            setFileProgress(file.name, percent);
          });
        })
      );

      const attachmentKeys = uploads.map(u => u.key);

      // NOTE: mirrors the back-office quirk — sending type: "TEXT" with a
      // populated attachment array, since type: "ATTACHMENT" caused the
      // server to disconnect there. Confirm this still holds on the
      // user-chat endpoint; adjust if it behaves differently.
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action:  "send_message",
          payload: {
            chat_id:    chatIdRef.current,
            content,
            type:       "TEXT",
            attachment: attachmentKeys,
          },
        }));
      } else {
        pendingSendRef.current = { content, attachmentKeys, type: "TEXT" };
      }

    } catch (err) {
      console.error("Failed to send message with attachments:", err);

      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      optimisticMsg._localFiles.forEach(lf => URL.revokeObjectURL(lf.url));

      setSending(false);
      setUploadingAttachment(false);
      stopKeepAlive();
      throw err;
    }

    stopKeepAlive();
    setUploadingAttachment(false);
  };

  // ── Typing ──────────────────────────────────────────────────────────────
  const sendTyping = () => {
    if (!chatIdRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      action:  "typing_start",
      payload: { chat_id: chatIdRef.current },
    }));
  };

  const sendTypingStop = () => {
    if (!chatIdRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      action:  "typing_stop",
      payload: { chat_id: chatIdRef.current },
    }));
  };

  // ── Mark messages as seen ──────────────────────────────────────────────
  const markAsSeen = () => {
    if (!chatIdRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      action:  "messages_seen",
      payload: { chat_id: chatIdRef.current },
    }));
  };

  return {
    chatId,
    messages,
    hasConversation,
    isClosed,
    sending,
    starting,
    connected,
    isUserTyping,
    uploadingAttachment,
    onlineUserIds,
    startError,
    clearStartError,
    startConversation,
    sendMessage,
    sendMessageWithAttachments,
    sendTyping,
    sendTypingStop,
    markAsSeen,
    setMessages,
    setChatId,
    setHasConversation,
    currentUserId,
  };
}