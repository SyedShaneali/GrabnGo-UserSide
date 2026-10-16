import { useCallback, useEffect, useRef, useState } from "react";
import { getUserTravels } from "../api/TravelApi";

// GET /travel/user returns { current_page, items } (no total seen yet), so a
// full page means "there may be more". total_pages / total are used if the
// backend ever adds them.
function computeHasMore(data, page, count, limit) {
  const totalPages = data?.total_pages ?? data?.pages;
  if (typeof totalPages === "number") return page < totalPages;

  const total = data?.total ?? data?.total_items ?? data?.count;
  if (typeof total === "number") return page * limit < total;

  return count >= limit;
}

function mergeById(prev, next) {
  const seen = new Set(prev.map((t) => t.id));
  return [...prev, ...next.filter((t) => !seen.has(t.id))];
}

/**
 * Travels created by the logged-in user (each with its itineraries).
 * No user_id is sent, so the backend returns the current user's travels.
 *
 * @param {{ limit?: number, filterBy?: string }} options
 *   filterBy -> sent as the `filter_by` query param (e.g. upcoming / current / previous)
 */
export function useMyTravels({ limit = 10, filterBy } = {}) {
  const [travels, setTravels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Ignore responses from outdated requests
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageNum, append) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await getUserTravels({ filter_by: filterBy, page: pageNum, limit });
        if (id !== requestId.current) return;

        const items = data?.items || [];
        setTravels((prev) => (append ? mergeById(prev, items) : items));
        setPage(pageNum);
        setHasMore(computeHasMore(data, pageNum, items.length, limit));
      } catch (err) {
        if (id !== requestId.current) return;
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err.message ||
            "Failed to load your travels"
        );
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [limit, filterBy]
  );

  useEffect(() => {
    setTravels([]);
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, loading, loadingMore, hasMore, page]);

  const refetch = useCallback(() => fetchPage(1, false), [fetchPage]);

  return { travels, loading, loadingMore, error, hasMore, loadMore, refetch };
}