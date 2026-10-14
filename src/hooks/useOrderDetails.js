import { useState, useEffect, useCallback, useRef } from "react";
import { getOrderById } from "../api/OrderApi";

function getErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return err?.message || "Something went wrong. Please try again.";
}

/**
 * useOrderDetail(orderId)
 * Returns { order, loading, error, refetch }
 */
export function useOrderDetail(orderId) {
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!orderId) return;
    const id = ++requestId.current;

    setLoading(true);
    setError(null);

    try {
      const data = await getOrderById(orderId);
      if (id !== requestId.current) return;
      setOrder(data);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, loading, error, refetch: load };
}