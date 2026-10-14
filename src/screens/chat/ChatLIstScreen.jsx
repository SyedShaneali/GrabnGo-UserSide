import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useMyChats } from "../../hooks/useMyChats";
import { PaginatedList } from "../user/Home"; // ⚠️ adjust to wherever Home.jsx exports PaginatedList
import { usePresence } from "../../context/PresenceContext";
import PresenceDot from "../../components/chat/PresenceDot";

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function truncate(str, n = 45) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

/* ─── sub-components ─────────────────────────────────────────────────────── */
function Avatar({ name, src, size = 44, online }) {
  const [err, setErr] = useState(false);
  const initials = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--brand-light)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.38), fontWeight: 700, color: "var(--accent)",
        border: "2px solid var(--border-subtle)",
      }}>
        {src && !err
          ? <img src={src} alt={name} onError={() => setErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </div>
      {online !== undefined && <PresenceDot online={online} size={11} />}
    </div>
  );
}

function OnlineFilterToggle({ value, onChange, onlineCount, totalCount }) {
  const segments = [
    { key: "all",    label: "All",         count: totalCount },
    { key: "online", label: "Online only", count: onlineCount },
  ];

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: 3, borderRadius: 11, background: "var(--bg-page)",
      border: "1px solid var(--border-subtle)",
    }}>
      {segments.map((seg) => {
        const active = value === seg.key;
        return (
          <button
            key={seg.key}
            onClick={() => onChange(seg.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, border: "none",
              background: active ? "var(--bg-surface)" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "background 0.15s, box-shadow 0.15s, color 0.15s",
            }}
          >
            {seg.key === "online" && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            )}
            {seg.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: active ? "var(--text-secondary)" : "var(--text-muted)",
              background: active ? "var(--bg-page)" : "var(--bg-surface-hover)",
              padding: "1px 6px", borderRadius: 999, minWidth: 18, textAlign: "center",
            }}>
              {seg.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── One chat row (same look as before, now used as PaginatedList's renderItem) ── */
function ChatRow({ chat, onOpen, online }) {
  return (
    <div
      className="chat-row"
      onClick={() => onOpen(chat)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", cursor: "pointer",
        background: "var(--bg-surface)", borderRadius: 14,
        border: "1px solid var(--border-subtle)",
        transition: "background 0.12s",
      }}
    >
      <Avatar name={chat.other_user?.name} src={chat.other_user?.image} online={online} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {chat.other_user?.name ?? "—"}
          </p>
          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {formatTime(chat.last_message?.send_time)}
          </span>
        </div>
        <p style={{
          fontSize: 12.5, color: chat.last_message ? "var(--text-secondary)" : "var(--text-muted)",
          margin: "3px 0 0", fontStyle: chat.last_message ? "normal" : "italic",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {chat.last_message
            ? `${chat.last_message.sender_name === "You" ? "You: " : ""}${truncate(chat.last_message.content)}`
            : "No messages yet"}
        </p>
      </div>
    </div>
  );
}

/* ─── main screen ────────────────────────────────────────────────────────── */
export default function ChatsListScreen() {
  const navigate = useNavigate();
  const { chats, loading, loadingMore, error, hasMore, loadMore, refetch } = useMyChats();
  const { isUserOnline } = usePresence();

  const [filter, setFilter] = useState("all");

  const onlineCount = useMemo(
    () => chats.filter(c => isUserOnline(c.other_user?.id)).length,
    [chats, isUserOnline]
  );

  const visibleChats = filter === "online"
    ? chats.filter(c => isUserOnline(c.other_user?.id))
    : chats;

  const openChat = (chat) => {
    const u = chat.other_user;
    navigate(
      `/chat/${chat.id}?user=${u.id}&direct=true&name=${encodeURIComponent(u.name ?? "")}&image=${encodeURIComponent(u.image ?? "")}`
    );
  };

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 24, width: "100%" }}>
      <style>{`.chat-row:hover { background: var(--bg-surface-hover) !important; }`}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 16, marginBottom: 20, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Chats
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Conversations with travelers and buyers
          </p>
        </div>

        <OnlineFilterToggle
          value={filter}
          onChange={setFilter}
          onlineCount={onlineCount}
          totalCount={chats.length}
        />
      </div>

      <PaginatedList
        items={visibleChats}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={filter === "all" && hasMore} // don't offer "load more" while a client-side filter is narrowing the view
        onLoadMore={loadMore}
        onRetry={refetch}
        emptyText={filter === "online" && chats.length > 0 ? "No online users right now" : "No chats yet"}
        renderItem={(chat) => (
          <ChatRow chat={chat} onOpen={openChat} online={isUserOnline(chat.other_user?.id)} />
        )}
      />
    </div>
  );
}