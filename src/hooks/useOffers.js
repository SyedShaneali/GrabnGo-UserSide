import { useState, useEffect, useCallback, useRef } from "react";
import { getOffers } from "../api/offerApi";

const PAGE_SIZE_DEFAULT = 10;

export function useOffers({ filterBy = "RECEIVED", search = "", limit = PAGE_SIZE_DEFAULT }) {
  const [offers, setOffers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToFetch, { append }) => {
      const currentRequestId = ++requestId.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      try {
        const data = await getOffers({ filterBy, search, page: pageToFetch, limit });
        if (currentRequestId !== requestId.current) return;

        const items = data?.items ?? [];
        setOffers((prev) => (append ? [...prev, ...items] : items));
        setPage(pageToFetch);

        const totalPages = data?.total_pages;
        setHasMore(totalPages ? pageToFetch < totalPages : items.length === limit);
      } catch (err) {
        if (currentRequestId !== requestId.current) return;
        setError(err?.response?.data?.message || "Failed to load offers");
      } finally {
        if (currentRequestId === requestId.current) {
          append ? setLoadingMore(false) : setLoading(false);
        }
      }
    },
    [filterBy, search, limit]
  );

  useEffect(() => {
    fetchPage(1, { append: false });
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPage(page + 1, { append: true });
  }, [fetchPage, page, hasMore, loadingMore]);

  const refetch = useCallback(() => fetchPage(1, { append: false }), [fetchPage]);

  // ⭐ NEW — Offers.jsx calls setOffers directly for optimistic accept/reject updates
  return { offers, setOffers, loading, loadingMore, error, hasMore, loadMore, refetch };
}