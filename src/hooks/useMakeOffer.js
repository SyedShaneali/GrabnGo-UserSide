import { useState } from "react";
import { addOffer } from "../api/offerApi";

export function useMakeOffer() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitOffer = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      return await addOffer(payload);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit offer");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitOffer, submitting, error };
}