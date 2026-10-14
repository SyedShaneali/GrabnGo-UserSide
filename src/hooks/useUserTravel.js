import { useCallback, useEffect, useState } from "react";
import { getUserTravels } from "../api/TravelApi";

const LIMIT = 10;

/*
 * hasMore-based pagination, matching the pattern used elsewhere in the app.
 * NOTE: your /travel/user sample response got cut off before I could see
 * whether it returns a total/total_pages field. Right now `hasMore` is
 * inferred from `items.length === LIMIT`, which works but does one extra
 * empty-page request at the very end. If the API gives you a total count,
 * tell me the field name and I'll use that instead — it's a one-line swap.
 */
export function useUserTravels() {
  const [travels, setTravels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (pageToLoad) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserTravels({ page: pageToLoad, limit: LIMIT, filter_by: "UPCOMING" });
      const items = data.items || [];
      setTravels((prev) => (pageToLoad === 1 ? items : [...prev, ...items]));
      setHasMore(items.length === LIMIT);
      setPage(pageToLoad);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load your travels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const loadMore = () => {
    if (!loading && hasMore) load(page + 1);
  };

  const reset = () => {
    setTravels([]);
    setHasMore(true);
    load(1);
  };

  return { travels, loading, error, hasMore, loadMore, reset };
}