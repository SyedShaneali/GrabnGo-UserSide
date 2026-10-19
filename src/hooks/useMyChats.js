import { useState, useCallback, useEffect } from "react";
import { getUserChatsApi } from "../api/ChatApi"; // ⚠️ adjust path to wherever chatApi.js lives

export function useMyChats({ limit = 10 } = {}) {
  const [chats, setChats] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (targetPage, append) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getUserChatsApi({ page: targetPage, limit });
      const items = data?.items ?? [];
      setChats((prev) => (append ? [...prev, ...items] : items));
      // API doesn't return a total count — infer "more pages exist" from a
      // full page coming back, same heuristic as the orders/travels hooks.
      setHasMore(items.length === limit);
      setPage(targetPage);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load chats");
      if (!append) {
        setChats([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  };

  const refetch = () => fetchPage(1, false);

  return { chats, loading, loadingMore, error, hasMore, loadMore, refetch };
}