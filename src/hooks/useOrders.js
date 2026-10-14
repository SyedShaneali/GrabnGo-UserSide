import { usePaginatedList } from "../components/UsePaginatedList";
import { getOrders } from "../api/OrderApi";

/**
 * useOrders({ search, limit, status, type, ...anyOtherOrderFilter })
 * Returns { orders, loading, loadingMore, error, hasMore, page, loadMore, refetch }
 */
export function useOrders(filters = {}) {
  const { items, ...rest } = usePaginatedList(getOrders, filters);
  return { orders: items, ...rest };
}