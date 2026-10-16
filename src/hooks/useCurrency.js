import { useEffect, useState } from "react";
import { getTargetCurrencies } from "../api/currencyApi";

export function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTargetCurrencies()
      .then((data) => {
        if (!cancelled) setCurrencies(data.currencies || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || "Failed to load currencies");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { currencies, loading, error };
}