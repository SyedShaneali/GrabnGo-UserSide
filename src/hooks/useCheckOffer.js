import { useState, useEffect, useCallback } from "react";
import { checkOffer } from "../api/offerApi";

export function useCheckOffer(orderId) {
  const [offerExists, setOfferExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runCheck = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await checkOffer(orderId);
      console.log('res', res);
      setOfferExists(res.result || false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to check offer");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return { offerExists, loading, error, refetchOfferCheck: runCheck };
}