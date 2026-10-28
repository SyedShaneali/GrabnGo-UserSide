import { useState, useCallback } from "react";
import { updateOrderApi } from "../api/OrderApi";

export function getErrorMessage(err, fallback = "Something went wrong") {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e.msg).join(", ");
  return err?.response?.data?.message || err?.message || fallback;
}

export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateOrder = useCallback(async (orderId, body) => {
    setLoading(true);
    setError(null);
    try {
      return await updateOrderApi(orderId, body);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update order"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateOrder, loading, error };
}