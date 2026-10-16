import { useState, useEffect, useCallback } from "react";
import { getTravelById } from "../api/TravelApi";

export function useTravelDetail(travelId) {
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTravel = useCallback(async () => {
    if (!travelId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTravelById(travelId);
      setTravel(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load travel");
    } finally {
      setLoading(false);
    }
  }, [travelId]);

  useEffect(() => {
    fetchTravel();
  }, [fetchTravel]);

  return { travel, loading, error, refetch: fetchTravel };
}