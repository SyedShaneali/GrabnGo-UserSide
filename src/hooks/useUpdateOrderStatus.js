import { useState } from "react";
import { updateOrderStatusApi } from "../api/OrderApi"; // ⚠️ adjust path

export function useUpdateOrderStatus() {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (orderId, opts) => {
    setUpdating(true);
    try {
      return await updateOrderStatusApi(orderId, opts);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update status";
      throw new Error(message);
    } finally {
      setUpdating(false);
    }
  };

  return { updateStatus, updating };
}