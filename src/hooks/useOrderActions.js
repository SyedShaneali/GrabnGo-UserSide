import { useState, useCallback, useEffect } from "react";
import { deleteOrderApi, refundOrderApi, getOrderActivityLogApi } from "../api/orderApi";
import { getErrorMessage } from "./useUpdateOrder";

export function useOrderActions(orderId) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      return await fn(orderId);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }, [orderId]);

  return {
    busy,
    error,
    clearError: () => setError(null),
    deleteOrder: () => run(deleteOrderApi),
    refundOrder: () => run(refundOrderApi),
  };
}

export function useOrderActivityLog(orderId, enabled) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOrderActivityLogApi(orderId)
      .then((d) => !cancelled && setLogs(Array.isArray(d) ? d : d?.data || d?.items || []))
      .catch((e) => !cancelled && setError(getErrorMessage(e, "Failed to load activity log")))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [orderId, enabled]);

  return { logs, loading, error };
}