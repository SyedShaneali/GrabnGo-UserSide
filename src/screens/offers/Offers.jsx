import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useOffers } from "../../hooks/useOffers";
import OfferCard from "../../components/Offer/OfferCard";

const TABS = [
  { label: "Received", value: "RECEIVED" },
  { label: "Sent", value: "SENT" },
];

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
];

const PAGE_SIZE = 10;

/* ── Skeletons ── */
function RowSkeleton() {
  const pulse = {
    background: "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 6,
  };

  return (
    <>
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
        <div style={{ ...pulse, height: 32, width: 100, borderRadius: 100 }} />
      </div>

      <div className="flex lg:hidden" style={{
        flexDirection: "column", background: "var(--bg-surface)",
        borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 12, gap: 10,
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...pulse, width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...pulse, height: 12, width: "60%" }} />
            <div style={{ ...pulse, height: 10, width: "35%" }} />
          </div>
        </div>
        <div style={{ ...pulse, height: 1, width: "100%" }} />
        <div style={{ ...pulse, height: 28, width: "100%", borderRadius: 8 }} />
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

/* ── List body for a single tab ── */
function OffersList({ filterBy, search, statusFilter }) {
  const navigate = useNavigate(); // ⭐ NEW
  const { offers, setOffers, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useOffers({ filterBy, search, limit: PAGE_SIZE });

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const isReceived = filterBy === "RECEIVED";

  const visibleOffers = useMemo(() => {
    if (statusFilter === "ALL") return offers;
    return offers.filter((o) => o.status === statusFilter);
  }, [offers, statusFilter]);

  const emptyText = search
    ? "No offers match your search"
    : isReceived ? "No offers received yet" : "No offers sent yet";

  // ⭐ NEW — navigate to details screen, passing the full offer via route state
  const handleView = (offer) => {
    navigate(`/offers/${offer.id}`, { state: { offer, isReceived } });
  };

  const handleAccept = async (offerId) => {
    setActionLoadingId(offerId);
    try {
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "ACCEPTED" } : o)));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (offerId) => {
    setActionLoadingId(offerId);
    try {
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "REJECTED" } : o)));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWithdraw = async (offerId) => {
    setActionLoadingId(offerId);
    try {
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "WITHDRAWN" } : o)));
    } finally {
      setActionLoadingId(null);
    }
  };

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
            onClick={refetch}
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
      ) : visibleOffers.length === 0 ? (
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
            {visibleOffers.map((offer) => (
              <div key={offer.id}>
                <OfferCard
                  offer={offer}
                  onView={handleView}
                  isReceived={isReceived}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onWithdraw={handleWithdraw}
                  actionLoading={actionLoadingId === offer.id}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button
                onClick={loadMore}
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

export default function Offers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "SENT" ? "SENT" : "RECEIVED";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleTabChange = (value) => {
    if (value === activeTab) return;
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");
    setSearchParams({ tab: value }, { replace: true });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 24 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-[18px]">
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                style={{
                  padding: "7px 20px", borderRadius: 999,
                  border: isActive ? "none" : "1px solid var(--border-default)",
                  background: isActive ? "#0D9488" : "var(--bg-surface)",
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
            placeholder={`Search ${activeTab.toLowerCase()} offers...`}
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
      </div>

      <div
        className="flex gap-2 overflow-x-auto mb-4"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "6px 16px", borderRadius: 999,
                border: isActive ? "none" : "1px solid var(--border-default)",
                background: isActive ? "#0D9488" : "var(--bg-surface)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <OffersList filterBy={activeTab} search={search} statusFilter={statusFilter} />
    </div>
  );
}