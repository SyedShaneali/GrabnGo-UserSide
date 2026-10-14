import { useState, useEffect, useCallback, useRef } from "react";

function getErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return err?.message || "Something went wrong. Please try again.";
}

// The list response only shows `current_page` + `items` so far, so we check the
// usual "total" style keys first and fall back to "did we get a full page".
function computeHasMore(data, count, limit, page) {
  if (typeof data?.has_next === "boolean") return data.has_next;
  if (typeof data?.total_pages === "number") return page < data.total_pages;
  if (typeof data?.total === "number") return page * limit < data.total;
  return count === limit;
}

/**
 * Generic "load more" list hook.
 * - `fetcher` must be a stable function (module-level API fn) that takes a params object.
 * - Changing any filter (or limit) resets to page 1 automatically.
 * - Stale responses are ignored, so fast typing/tab switching can't overwrite newer data.
 */
export function usePaginatedList(fetcher, { limit = 10, ...filters } = {}) {
  const [items,       setItems]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  const requestId  = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async (targetPage) => {
    const id      = ++requestId.current;
    const isFirst = targetPage === 1;

    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const data = await fetcher({ ...JSON.parse(filtersKey), page: targetPage, limit });
      if (id !== requestId.current) return;

      const next = data?.items ?? [];
      setItems((prev) => {
        if (isFirst) return next;
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...next.filter((item) => !seen.has(item.id))];
      });
      setPage(targetPage);
      setHasMore(computeHasMore(data, next.length, limit, targetPage));
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [fetcher, filtersKey, limit]);

  // Runs on mount and whenever filters / limit change
  useEffect(() => {
    load(1);
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    load(page + 1);
  }, [loading, loadingMore, hasMore, page, load]);

  const refetch = useCallback(() => load(1), [load]);

  return { items, loading, loadingMore, error, hasMore, page, loadMore, refetch };
}