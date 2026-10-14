import { useState, useCallback, useRef } from "react";
import axiosClient from "../api/axiosClient";

const DEFAULT_LIMIT = 10;

/**
 * Real endpoint:
 * GET /offer/status/travel/:travelId?filter_by=<STATUS>&page=&limit=
 * filter_by is ONE of: PENDING, ACCEPTED, REJECTED, CANCELED, CLOSED, COMPLETED, WITHDRAW
 *
 * Real response shape:
 * { current_page: 1, items: [ { id, order, other_user, amount, display_amount, status, created_at, ... } ] }
 *
 * Offers are returned RAW (no normalizing) because OfferCard reads the
 * API fields directly (order.*, other_user.*, display_amount, etc).
 */
async function fetchOffersPage(travelId, status, page, limit) {
  const { data } = await axiosClient.get(`/offer/status/travel/${travelId}`, {
    params: { filter_by: status, page, limit },
  });

  const items = data.items ?? [];

  // The API only gives current_page, no total. If we ever get total pages
  // back (total_pages / totalPages), trust it. Otherwise assume a full
  // page means there's probably more.
  const totalPages = data.total_pages ?? data.totalPages ?? data.meta?.total_pages;
  const hasMore = totalPages != null ? page < totalPages : items.length === limit;

  return { items, hasMore };
}

const byNewest = (a, b) => (b.created_at ?? 0) - (a.created_at ?? 0);

/**
 * Fetches paginated offers for a travel, filtered by one or more statuses.
 * Pass a single status string ("PENDING") or an array of statuses
 * (["ACCEPTED", "COMPLETED"]) — since the API only accepts one filter_by
 * value per call, passing an array fires one request per status per page
 * and merges + sorts the combined results by date (newest first).
 */
export function useTravelOffers(travelId, limit = DEFAULT_LIMIT) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [fetchedFor, setFetchedFor] = useState(null); // last-loaded status key, e.g. "PENDING" or "ACCEPTED,COMPLETED"

  const statusesRef = useRef([]);
  const pageRef = useRef(1);

  const runFetch = useCallback(
    async (statuses, page) => {
      const results = await Promise.all(
        statuses.map((s) => fetchOffersPage(travelId, s, page, limit))
      );
      const merged = results.flatMap((r) => r.items);
      merged.sort(byNewest);
      const anyMore = results.some((r) => r.hasMore);
      return { merged, anyMore };
    },
    [travelId, limit]
  );

  const fetchOffers = useCallback(
    async (statusOrStatuses) => {
      if (!travelId || !statusOrStatuses) return;
      const statuses = Array.isArray(statusOrStatuses) ? statusOrStatuses : [statusOrStatuses];
      statusesRef.current = statuses;
      pageRef.current = 1;

      setLoading(true);
      setError(null);
      try {
        const { merged, anyMore } = await runFetch(statuses, 1);
        setOffers(merged);
        setHasMore(anyMore);
        setFetchedFor(statuses.join(","));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load offers");
      } finally {
        setLoading(false);
      }
    },
    [travelId, runFetch]
  );

  const loadMore = useCallback(async () => {
    const statuses = statusesRef.current;
    if (!statuses.length) return;
    const nextPage = pageRef.current + 1;

    setLoadingMore(true);
    setError(null);
    try {
      const { merged, anyMore } = await runFetch(statuses, nextPage);
      setOffers((prev) => {
        const combined = [...prev, ...merged];
        combined.sort(byNewest);
        return combined;
      });
      pageRef.current = nextPage;
      setHasMore(anyMore);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load more offers");
    } finally {
      setLoadingMore(false);
    }
  }, [runFetch]);

  return { offers, loading, loadingMore, error, hasMore, fetchedFor, fetchOffers, loadMore };
}