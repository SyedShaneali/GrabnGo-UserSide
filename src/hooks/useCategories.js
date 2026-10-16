import { useEffect, useState } from "react";
import { getCategories } from "../api/categoryApi";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || "Failed to load categories");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}