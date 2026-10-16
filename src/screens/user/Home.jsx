import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";
import { useTravels } from "../../hooks/useTravels";
import OrderCard from "../../components/Order/OrderCard";
import TravelCard from "../../components/Travel/TravelCard";
import OrderFiltersModal, {
  emptyOrderFilters,
  buildOrderFilterParams,
  countActiveFilters as countActiveOrderFilters,
} from "../../components/Order/OrderFilters"; // ⚠️ adjust path
import TravelFiltersModal, {
  emptyTravelFilters,
  buildTravelFilterParams,
  countActiveTravelFilters,
} from "../../components/Travel/TravleFilters"; // ⚠️ adjust path

const TABS = [
  { label: "Orders",  value: "orders"  },
  { label: "Travels", value: "travels" },
];

const PAGE_SIZE = 10;

/* ── Skeletons (desktop row + mobile card, same split as the real rows) ── */
function RowSkeleton() {
  const pulse = {
    background: "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 6,
  };

  return (
    <>
      {/* Desktop skeleton row */}
      <div className="hidden lg:flex" style={{
        alignItems: "center", background: "var(--bg-surface)",
        borderRadius: 14, border: "1px solid var(--border-subtle)", padding: "12px 14px",
        minHeight: 76, minWidth: 1100, gap: 16,
      }}>
        <div style={{ ...pulse, width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, maxWidth: 200 }}>
          <div style={{ ...pulse, height: 14, width: "70%" }} />
          <div style={{ ...pulse, height: 12, width: "45%" }} />
        </div>
        <div style={{ ...pulse, height: 14, width: "20%" }} />
        <div style={{ ...pulse, height: 14, width: "12%" }} />
        <div style={{ ...pulse, height: 14, width: "12%" }} />
        <div style={{ ...pulse, height: 32, width: 100, borderRadius: 100 }} />
      </div>

      {/* Mobile/tablet skeleton card */}
      <div className="flex lg:hidden" style={{
        flexDirection: "column", background: "var(--bg-surface)",
        borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 12, gap: 10,
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...pulse, width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...pulse, height: 12, width: "60%" }} />
            <div style={{ ...pulse, height: 10, width: "35%" }} />
            <div style={{ ...pulse, height: 18, width: 90, borderRadius: 100, marginTop: 2 }} />
          </div>
        </div>
        <div style={{ ...pulse, height: 1, width: "100%" }} />
        <div style={{ ...pulse, height: 28, width: "100%", borderRadius: 8 }} />
        <div style={{ ...pulse, height: 1, width: "100%" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ ...pulse, height: 48, borderRadius: 10 }} />
          <div style={{ ...pulse, height: 48, borderRadius: 10 }} />
        </div>
      </div>
    </>
  );
}

function ListSkeleton({ count }) {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    </>
  );
}

/* ── Shared list body: error / loading / empty / rows / load more ── */
export function PaginatedList({
  items, loading, loadingMore, error, hasMore,
  onLoadMore, onRetry, renderItem, emptyText,
}) {
  return (
    <>
      {error && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 12,
          padding: "14px 18px", color: "var(--danger)", fontSize: 14, marginBottom: 16,
        }}>
          <span>{error}</span>
          <button
            onClick={onRetry}
            style={{
              padding: "6px 16px", borderRadius: 999, border: "1px solid var(--danger)",
              background: "transparent", color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton count={PAGE_SIZE} />
      ) : items.length === 0 ? (
        !error && (
          <div style={{
            background: "var(--bg-surface)", borderRadius: 14, padding: "48px 20px",
            textAlign: "center", color: "var(--text-muted)", fontSize: 15,
            border: "1px solid var(--border-subtle)",
          }}>
            {emptyText}
          </div>
        )
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(item => (
              <div key={item.id}>
                {renderItem(item)}
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                style={{
                  padding: "8px 28px", borderRadius: 999,
                  border: "1px solid var(--border-default)", background: "var(--bg-surface)",
                  color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ── Tab bodies (only the active one is mounted, so only its API gets hit) ── */
function OrdersList({ search, filters }) {
  const navigate = useNavigate();
  const requestFilters = { search: search || undefined, ...buildOrderFilterParams(filters) };
  const { orders, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useOrders({ limit: PAGE_SIZE, ...requestFilters });

  return (
    <PaginatedList
      items={orders}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRetry={refetch}
      emptyText={search ? "No orders match your search" : "No orders found"}
      renderItem={(order) => (
        <OrderCard order={order} onView={(o) => navigate(`/orders/${o.id}`)} />
      )}
    />
  );
}

function TravelsList({ search, filters }) {
  const navigate = useNavigate();
  const requestFilters = { search: search || undefined, ...buildTravelFilterParams(filters) };
  const { travels, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useTravels({ limit: PAGE_SIZE, ...requestFilters });

  return (
    <PaginatedList
      items={travels}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRetry={refetch}
      emptyText={search ? "No travels match your search" : "No travels found"}
      renderItem={(travel) => (
        <TravelCard travel={travel} onView={(t) => navigate(`/travels/${t.travel_id}`)} />
      )}
    />
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "travels" ? "travels" : "orders";

  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");

  // Order filters
  const [orderFilters, setOrderFilters] = useState(emptyOrderFilters);
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false);
  const activeOrderFilterCount = countActiveOrderFilters(orderFilters);
  const orderFiltersKey = JSON.stringify(orderFilters);

  // Travel filters
  const [travelFilters, setTravelFilters] = useState(emptyTravelFilters);
  const [travelFiltersOpen, setTravelFiltersOpen] = useState(false);
  const activeTravelFilterCount = countActiveTravelFilters(travelFilters);
  const travelFiltersKey = JSON.stringify(travelFilters);

  // Debounce so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleTabChange = (value) => {
    if (value === activeTab) return;
    setSearchInput("");
    setSearch("");
    setSearchParams({ tab: value }, { replace: true });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const activeFilterCount = activeTab === "orders" ? activeOrderFilterCount : activeTravelFilterCount;
  const openFilters = () => (activeTab === "orders" ? setOrderFiltersOpen(true) : setTravelFiltersOpen(true));

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 24 }}>
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-[18px]">
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                style={{
                  padding: "7px 20px", borderRadius: 999,
                  border:     isActive ? "none" : "1px solid var(--border-default)",
                  background: isActive ? "var(--success, #0d9488)" : "var(--bg-surface)",
                  color:      isActive ? "#fff" : "var(--text-secondary)",
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
          <div style={{ position: "relative", width: "100%", maxWidth: 280 }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              style={{
                width: "100%", padding: "8px 12px 8px 36px", borderRadius: 999,
                border: "1px solid var(--border-default)", background: "var(--bg-surface)",
                color: "var(--text-primary)", fontSize: 14, outline: "none",
              }}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", display: "flex", alignItems: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters button — same slot for both tabs, points at whichever filter set is active */}
          <button
            onClick={openFilters}
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

      {activeTab === "orders"
        ? <OrdersList key={orderFiltersKey} search={search} filters={orderFilters} />
        : <TravelsList key={travelFiltersKey} search={search} filters={travelFilters} />}

      <OrderFiltersModal
        open={orderFiltersOpen}
        initialFilters={orderFilters}
        onApply={setOrderFilters}
        onClose={() => setOrderFiltersOpen(false)}
      />

      <TravelFiltersModal
        open={travelFiltersOpen}
        initialFilters={travelFilters}
        onApply={setTravelFilters}
        onClose={() => setTravelFiltersOpen(false)}
      />
    </div>
  );
}