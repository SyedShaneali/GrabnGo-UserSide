import { useCallback, useEffect, useRef, useState } from "react";
import { getOrders } from "../api/OrderApi";

// GET /order/ currently returns only { current_page, items } with no total
// count, so "a full page means there's more" is what decides hasMore. The
// total_pages / total checks are kept in case the backend adds them later.
function computeHasMore(data, page, count, limit) {
  const totalPages = data?.total_pages ?? data?.pages;
  if (typeof totalPages === "number") return page < totalPages;

  const total = data?.total ?? data?.total_items ?? data?.count;
  if (typeof total === "number") return page * limit < total;

  return count >= limit;
}

function mergeById(prev, next) {
  const seen = new Set(prev.map((o) => o.id));
  return [...prev, ...next.filter((o) => !seen.has(o.id))];
}

/**
 * Orders created by / visible to the logged-in user.
 *
 * `filters` mirrors GET /order/'s query params directly:
 *   search, status[], from_country_id, from_city_id, to_country_id, to_city_id,
 *   usd_reward_rang_start, usd_reward_rang_end, category_ids[], payment_verified,
 *   type, match_any_country
 *
 * @param {{ orderBy?: string, limit?: number, filters?: object }} options
 */
export function useMyOrders({ orderBy = "MY_ORDER", limit = 10, filters = {} } = {}) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Ignore responses from outdated requests (e.g. filters changed mid-flight)
  const requestId = useRef(0);

  // Stable string key so the effect only refires when filter VALUES change,
  // not when the caller passes a new object literal every render.
  const filtersKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (pageNum, append) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await getOrders({
          order_by: orderBy,
          page: pageNum,
          limit,
          ...JSON.parse(filtersKey),
        });
        if (id !== requestId.current) return;

        const items = data?.items || [];
        setOrders((prev) => (append ? mergeById(prev, items) : items));
        setPage(pageNum);
        setHasMore(computeHasMore(data, pageNum, items.length, limit));
      } catch (err) {
        if (id !== requestId.current) return;
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err.message ||
            "Failed to load orders"
        );
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filtersKey, limit, orderBy]
  );

  // First page on mount, and again whenever orderBy or any filter changes
  useEffect(() => {
    setOrders([]);
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, loading, loadingMore, hasMore, page]);

  const refetch = useCallback(() => fetchPage(1, false), [fetchPage]);

  return { orders, loading, loadingMore, error, hasMore, loadMore, refetch };
}