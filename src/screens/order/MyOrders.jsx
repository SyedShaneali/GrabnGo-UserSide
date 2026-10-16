import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMyOrders } from "../../hooks/useMyOrders";
import OrderCard from "../../components/Order/OrderCard";
import { PaginatedList } from "../user/Home";
import OrderFiltersModal, {
  emptyOrderFilters,
  buildOrderFilterParams,
  countActiveFilters,
} from "../../components/Order/OrderFilters"; // ⚠️ adjust path

const PAGE_SIZE = 10;

const TABS = [
  { label: "My Orders",    value: "MY_ORDER",    empty: "You haven't created any orders yet" },
  { label: "Other Orders", value: "OTHER_ORDER", empty: "No other orders found" },
];

/* Mounted with key={orderBy + filtersKey}, so switching tabs/filters starts fresh */
function OrdersTabList({ orderBy, emptyText, search, filters }) {
  const navigate = useNavigate();
  const requestFilters = { search: search || undefined, ...buildOrderFilterParams(filters) };
  const { orders, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useMyOrders({ limit: PAGE_SIZE, orderBy, filters: requestFilters });

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={refetch}
          disabled={loading}
          style={{
            padding: "7px 18px", borderRadius: 999,
            border: "1px solid var(--border-default)", background: "var(--bg-surface)",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}
        >
          Refresh
        </button>
      </div>

      <PaginatedList
        items={orders}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={refetch}
        emptyText={emptyText}
        renderItem={(order) => (
          <OrderCard order={order} onView={(o) => navigate(`/orders/${o.id}`)} />
        )}
      />
    </>
  );
}

export default function MyOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    TABS.find((t) => t.value === searchParams.get("tab")) ?? TABS[0];

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState(emptyOrderFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);
  const filtersKey = JSON.stringify(filters);

  // Debounce search the same way Home.jsx does
  useState(() => {}); // no-op, keeping structure obvious
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(handleSearchChange._t);
    handleSearchChange._t = setTimeout(() => setSearch(val.trim()), 400);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 24 }}>
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
        Orders
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSearchParams({ tab: tab.value }, { replace: true })}
                style={{
                  padding: "7px 20px", borderRadius: 999,
                  border: isActive ? "none" : "1px solid var(--border-default)",
                  background: isActive ? "var(--success, #0d9488)" : "var(--bg-surface)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  flexShrink: 0, whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 260 }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search orders..."
              style={{
                width: "100%", padding: "8px 12px 8px 36px", borderRadius: 999,
                border: "1px solid var(--border-default)", background: "var(--bg-surface)",
                color: "var(--text-primary)", fontSize: 14, outline: "none",
              }}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              padding: "8px 16px", borderRadius: 999,
              border: `1px solid ${activeFilterCount > 0 ? "var(--brand)" : "var(--border-default)"}`,
              background: activeFilterCount > 0 ? "var(--brand-light)" : "var(--bg-surface)",
              color: activeFilterCount > 0 ? "var(--brand)" : "var(--text-secondary)",
              fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10.5, fontWeight: 800, background: "var(--brand)", color: "#fff",
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <OrdersTabList
        key={activeTab.value + filtersKey}
        orderBy={activeTab.value}
        emptyText={activeTab.empty}
        search={search}
        filters={filters}
      />

      <OrderFiltersModal
        open={filtersOpen}
        initialFilters={filters}
        onApply={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}