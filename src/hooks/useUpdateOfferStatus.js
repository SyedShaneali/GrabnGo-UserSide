import { useState } from "react";
import { updateOfferStatus } from "../api/offerApi";

export function useUpdateOfferStatus() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = async (offerId, status) => {
    setUpdating(true);
    setError(null);
    try {
      return await updateOfferStatus(offerId, status);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update offer");
      throw e;
    } finally {
      setUpdating(false);
    }
  };

  return { updateStatus, updating, error };
}