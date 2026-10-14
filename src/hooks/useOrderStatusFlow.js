import { useState, useEffect, useCallback } from "react";
import { getOrderStatusFlowApi } from "../api/OrderApi";

export function useOrderStatusFlow(orderId) {
  const [flow,    setFlow]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderStatusFlowApi(orderId);
      setFlow(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to load status flow.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { flow, loading, error, refetch: fetch };
}