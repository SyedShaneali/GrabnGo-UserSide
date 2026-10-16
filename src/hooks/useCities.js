import { useEffect, useState } from "react";
import { getCitiesByCountry } from "../api/countryApi";

export function useCities(countryId) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCitiesByCountry(countryId)
      .then((data) => {
        if (!cancelled) setCities(data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || "Failed to load cities");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryId]);

  return { cities, loading, error };
}