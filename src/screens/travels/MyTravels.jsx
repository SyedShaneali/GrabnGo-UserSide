import { useSearchParams, useNavigate } from "react-router-dom";
import { useMyTravels } from "../../hooks/useMyTravels";
import MyTravelCard from "../../components/Travel/MyTravelCard";
import { PaginatedList } from "../user/Home";

const PAGE_SIZE = 10;

// `value` is sent to the API as filter_by. These three strings are my best
// guess — open the filter_by dropdown in Swagger and match the exact values.
const TABS = [
  { label: "Upcoming", value: "UPCOMING", empty: "No upcoming travels" },
  { label: "Current",  value: "CURRENT",  empty: "No current travels" },
  { label: "Previous", value: "PREVIOUS", empty: "No previous travels" },
];

/* Mounted with key={filterBy}, so switching tabs starts with a clean list */
function TravelsTabList({ filterBy, emptyText }) {
  const navigate = useNavigate();
  const { travels, loading, loadingMore, error, hasMore, loadMore, refetch } =
    useMyTravels({ limit: PAGE_SIZE, filterBy });

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
        items={travels}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={refetch}
        emptyText={emptyText}
        renderItem={(travel) => (
          // /travel/user items use `id` as the travel id (Home's list uses `travel_id`)
          <MyTravelCard travel={travel} onView={(t) => navigate(`/travels/${t.id}`)} />
        )}
      />
    </>
  );
}

export default function MyTravels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    TABS.find((t) => t.value === searchParams.get("tab")) ?? TABS[0];

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 24 }}>
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
        My Travels
      </h1>

      <div
        className="flex gap-2 overflow-x-auto mb-2"
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

      <TravelsTabList key={activeTab.value} filterBy={activeTab.value} emptyText={activeTab.empty} />
    </div>
  );
}