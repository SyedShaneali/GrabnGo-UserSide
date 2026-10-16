// src/pages/Notifications/Notifications.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotificationCount } from "../../context/NotificationCountContext";
import { getNotificationsApi, markNotificationsSeenApi } from "../../api/NotificationApi";

const LIMIT = 10;

const TABS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
];

const normalize = (res) => {
  const list = Array.isArray(res)
    ? res
    : res?.data?.items ?? res?.items ?? res?.data ?? res?.notifications ?? [];
  return Array.isArray(list) ? list : [];
};

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Notifications() {
  const { refreshCount } = useNotificationCount();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all"); // all | unread
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const fetchPage = useCallback(async (pageNum, activeFilter) => {
    const res = await getNotificationsApi({
      is_seen: activeFilter === "unread" ? false : null,
      page: pageNum,
      limit: LIMIT,
    });
    return normalize(res);
  }, []);

  const loadFirst = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchPage(1, filterRef.current);
      setItems(list);
      setPage(1);
      setHasMore(list.length === LIMIT);
    } catch (err) {
      console.error(err);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    setLoading(true);
    loadFirst();
  }, [filter, loadFirst]);

  // Fired by useFcmListener when a push arrives while the app is open
  useEffect(() => {
    window.addEventListener("new-notification", loadFirst);
    return () => window.removeEventListener("new-notification", loadFirst);
  }, [loadFirst]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const list = await fetchPage(next, filter);
      setItems((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...prev, ...list.filter((n) => !ids.has(n.id))];
      });
      setPage(next);
      setHasMore(list.length === LIMIT);
    } catch (err) {
      console.error(err);
      setError("Could not load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  };

  const markSeen = async (ids) => {
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_seen: true } : n)));
    try {
      await markNotificationsSeenApi(ids);
      refreshCount?.();
    } catch (err) {
      console.error(err);
      loadFirst();
    }
  };

  const unseenIds = items.filter((n) => !n.is_seen).map((n) => n.id);
  const unreadCount = unseenIds.length;

  const subtitle =
    filter === "unread" || filter === "all"
      ? unreadCount > 0
        ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
        : "You're all caught up"
      : "";

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          padding: "28px 32px",
          minHeight: "100vh",
          background: "var(--bg-base, var(--bg-surface-hover, #f9fafb))",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary, #111827)", margin: 0 }}>
              Notifications
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted, #9ca3af)", margin: "4px 0 0" }}>
              {subtitle}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markSeen(unseenIds)}
              style={{
                background: "none",
                border: "1.5px solid var(--brand, #0d8f7a)",
                color: "var(--brand, #0d8f7a)",
                borderRadius: 8,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--brand, #0d8f7a)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--brand, #0d8f7a)";
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--bg-surface-hover, #f3f4f6)",
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
            marginBottom: 24,
          }}
        >
          {TABS.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                style={{
                  padding: "7px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  background: active ? "var(--bg-surface, #fff)" : "transparent",
                  color: active ? "var(--brand, #0d8f7a)" : "var(--text-muted, #9ca3af)",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 12,
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              color: "#ef4444",
              fontSize: 13,
            }}
          >
            {error}{" "}
            <button
              onClick={loadFirst}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
                padding: 0,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!loading &&
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_seen && markSeen([n.id])}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: n.is_seen ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  background: n.is_seen
                    ? "var(--bg-surface, #fff)"
                    : "var(--brand-light, rgba(13,143,122,0.06))",
                  border: `1.5px solid ${
                    n.is_seen ? "var(--border-subtle, #f3f4f6)" : "var(--brand, #0d8f7a)"
                  }`,
                  borderColor: n.is_seen ? undefined : "rgba(13,143,122,0.25)",
                }}
              >
                <span
                  style={{
                    marginTop: 6,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: n.is_seen ? "transparent" : "var(--brand, #0d8f7a)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "var(--text-primary, #111827)",
                        fontWeight: n.is_seen ? 600 : 800,
                      }}
                    >
                      {n.title}
                    </p>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted, #9ca3af)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "var(--text-muted, #6b7280)",
                      }}
                    >
                      {n.body}
                    </p>
                  )}
                </div>
              </button>
            ))}

          {/* Empty state */}
          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted, #9ca3af)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          )}

          {/* Spinner */}
          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  margin: "0 auto",
                  border: "3px solid var(--border-subtle, #e5e7eb)",
                  borderTop: "3px solid var(--brand, #0d8f7a)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && items.length > 0 && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--bg-surface, #fff)",
                border: "1.5px solid var(--border-subtle, #e5e7eb)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--brand, #0d8f7a)",
                cursor: loadingMore ? "default" : "pointer",
                opacity: loadingMore ? 0.6 : 1,
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-light, rgba(13,143,122,0.06))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface, #fff)")}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}