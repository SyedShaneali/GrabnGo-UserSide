import { usePaginatedList } from "../components/UsePaginatedList";
import { getTravels } from "../api/TravelApi";

/**
 * useTravels({ search, limit, is_verified, from_date, ...anyOtherTravelFilter })
 * Returns { travels, loading, loadingMore, error, hasMore, page, loadMore, refetch }
 */
export function useTravels(filters = {}) {
  const { items, ...rest } = usePaginatedList(getTravels, filters);
  return { travels: items, ...rest };
}