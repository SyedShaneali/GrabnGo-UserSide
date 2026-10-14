// src/hooks/useMatchedTravels.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getMatchedTravelsApi, sendTravelRequestApi } from "../api/OrderMatchApi";

const LIMIT = 10;

// ⭐ Adjust if the real response is shaped differently
// (send me one sample JSON from /travel/match-by-order and I'll remove the guesses)
const normalize = (res) => {
  const list = Array.isArray(res)
    ? res
    : res?.items ?? res?.data?.items ?? res?.data ?? res?.travels ?? res?.itineraries ?? [];
  return Array.isArray(list) ? list : [];
};

export function useMatchedTravels(orderId) {
  const [travels, setTravels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // ignore responses from a previous order if the id changes mid-request
  const latestOrderId = useRef(orderId);
  latestOrderId.current = orderId;

  const loadFirst = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMatchedTravelsApi({ orderId, page: 1, limit: LIMIT });
      if (latestOrderId.current !== orderId) return;
      const list = normalize(res);
      setTravels(list);
      setPage(1);
      setHasMore(list.length === LIMIT);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Could not load suggested travels.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getMatchedTravelsApi({ orderId, page: next, limit: LIMIT });
      const list = normalize(res);
      setTravels((prev) => {
        const ids = new Set(prev.map((t) => t.id));
        return [...prev, ...list.filter((t) => !ids.has(t.id))];
      });
      setPage(next);
      setHasMore(list.length === LIMIT);
    } catch (err) {
      console.error(err);
      setError("Could not load more travels.");
    } finally {
      setLoadingMore(false);
    }
  };

  return { travels, loading, loadingMore, error, hasMore, loadMore, reload: loadFirst };
}

// Tracks which travels already got a request from this order, so the card
// button can show "Sending..." / "Request sent".
export function useSendTravelRequest(orderId) {
  const [sentIds, setSentIds] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState(null);

  const sendRequest = async (travelId) => {
    setSendingId(travelId);
    setError(null);
    try {
      await sendTravelRequestApi({ orderId, travelId });
      setSentIds((prev) => [...prev, travelId]);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail || err?.response?.data?.message || "Could not send the request."
      );
    } finally {
      setSendingId(null);
    }
  };

  const statusOf = (travelId) =>
    sentIds.includes(travelId) ? "sent" : sendingId === travelId ? "sending" : "idle";

  return { sendRequest, statusOf, error };
}