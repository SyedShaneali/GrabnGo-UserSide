// src/hooks/useMatchedOrders.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getMatchedOrdersByTravelApi } from "../api/TravelMatchApi";

const LIMIT = 10;

// The response may be a bare array or wrapped ({ data: [...] }, { items: [...] } ...).
function extractList(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? raw?.orders ?? raw?.results ?? raw?.data ?? [];
}

/**
 * Suggested orders for a travel. Same shape as useMatchedTravels:
 * { orders, loading, loadingMore, error, hasMore, loadMore, reload }
 */
export function useMatchedOrders(travelId, filters = {}) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const reqId = useRef(0);

  const filterKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (p, replace) => {
      if (!travelId) return;
      const myReq = ++reqId.current;
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const res = await getMatchedOrdersByTravelApi({
          travel_id: travelId,
          ...JSON.parse(filterKey),
          page: p,
          limit: LIMIT,
        });
        if (myReq !== reqId.current) return; // a newer request replaced this one
        const list = extractList(res);
        setOrders((prev) => (replace ? list : [...prev, ...list]));
        setPage(p);
        setHasMore(list.length >= LIMIT);
      } catch (err) {
        if (myReq !== reqId.current) return;
        console.error(err);
        setError(err?.message || "Could not load suggested orders.");
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [travelId, filterKey]
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchPage(page + 1, false);
  }, [fetchPage, page, hasMore, loadingMore]);

  const reload = useCallback(() => fetchPage(1, true), [fetchPage]);

  return { orders, loading, loadingMore, error, hasMore, loadMore, reload };
}