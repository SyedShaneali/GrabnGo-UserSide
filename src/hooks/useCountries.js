import { useEffect, useState } from "react";
import { getCountries } from "../api/countryApi";

export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCountries()
      .then((data) => {
        if (!cancelled) setCountries(data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || "Failed to load countries");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, loading, error };
}