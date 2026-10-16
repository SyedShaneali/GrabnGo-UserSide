// Same folder as CreateTravel.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCities } from "../../hooks/useCities";
import { useMatchedOrders } from "../../hooks/useMatchedOrders";
import { formatPrice } from "../../components/ConversionPopOver";
import { formatDate, PLACEHOLDER_IMAGE } from "../../components/Order/OrderMeta";

const TRIP_LABELS = { "ONE WAY": "One Way", "ROUND TRIP": "Round Trip", "MULTI TRIP": "Multi Trip" };

const nameOf = (list, v) => list.find((x) => String(x.id) === String(v))?.name;

// "YYYY-MM-DD" -> "6 Oct 2026"
function fmtDateStr(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Skeleton({ h = 96 }) {
  return <div className="rounded-xl animate-pulse" style={{ height: h, background: "var(--bg-surface-hover)" }} />;
}

function Section({ title, children }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <p
        className="text-xs font-bold uppercase mb-3"
        style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div
      className="flex justify-between gap-3 py-2 text-sm"
      style={{ borderBottom: "1px solid var(--bg-surface-hover)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold text-right" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

/* One leg of the created travel */
function SummaryLeg({ leg, index, total, countries }) {
  const { cities: fromCities } = useCities(leg.from_country_id);
  const { cities: toCities } = useCities(leg.to_country_id);

  const from = [nameOf(fromCities, leg.from_city_id), nameOf(countries, leg.from_country_id)].filter(Boolean).join(", ");
  const to = [nameOf(toCities, leg.to_city_id), nameOf(countries, leg.to_country_id)].filter(Boolean).join(", ");

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}
    >
      {total > 1 && (
        <p className="text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
          Leg {index + 1}
        </p>
      )}
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {from || "…"} <span style={{ color: "var(--text-muted)" }}>→</span> {to || "…"}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {fmtDateStr(leg.travel_date)} · {leg.weight_capacity} kg · {leg.length_in}×{leg.width_in}×{leg.height_in} in
      </p>
    </div>
  );
}

/* A suggested order */
function MatchedOrderCard({ order }) {
  const img = order.images?.[0] || order.image || PLACEHOLDER_IMAGE;
  const from = [order.from_city?.name, order.from_country?.name].filter(Boolean).join(", ");
  const to = [order.to_city?.name, order.to_country?.name].filter(Boolean).join(", ");
  const reward = order.display_reward ?? order.reward;
  const currency = order.display_currency ?? order.reward_currency;

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <img
        src={img}
        alt={order.product_name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        style={{ background: "var(--bg-surface-hover)" }}
        onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {order.product_name}
          </p>
          {reward ? (
            <span className="text-sm font-extrabold flex-shrink-0" style={{ color: "var(--success, #0d9488)" }}>
              {formatPrice(reward, currency)}
            </span>
          ) : null}
        </div>
        <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
          {from || "—"} → {to || "—"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Qty {order.quantity ?? "—"} · Valid till {formatDate(order.validity)}
        </p>
      </div>
    </Link>
  );
}

/**
 * Shown right after a travel is created.
 * props:
 *  - travel: the form state used to create it (trip_type, return_date, is_active, itinerary[])
 *  - travelId
 *  - countries: from useCountries()
 *  - verification: optional node (the verification step); pass null once done/skipped
 */
export default function TravelCreated({ travel, travelId, countries, verification }) {
  const navigate = useNavigate();
  const { orders, loading, loadingMore, error, hasMore, loadMore, reload } = useMatchedOrders(travelId);

  return (
    <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <div
        className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
        style={{ background: "var(--brand-light)", color: "var(--brand)" }}
      >
        Your travel has been created. Here are orders that match your route.
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            Travel #{travelId}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {TRIP_LABELS[travel.trip_type] || travel.trip_type}
          </p>
        </div>
        <button
          onClick={() => navigate("/my-travels")}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          My travels
        </button>
      </div>

      <div className="flex flex-col gap-4 max-w-3xl">
        {/* Summary */}
        <Section title="Travel summary">
          <div className="flex flex-col gap-2 mb-3">
            {travel.itinerary.map((leg, i) => (
              <SummaryLeg key={i} leg={leg} index={i} total={travel.itinerary.length} countries={countries} />
            ))}
          </div>
          {travel.trip_type === "ROUND TRIP" && <InfoRow label="Return date" value={fmtDateStr(travel.return_date)} />}
          <InfoRow label="Status" value={travel.is_active ? "Active" : "Inactive"} />
        </Section>

        {/* Optional verification step */}
        {verification}
      </div>

      {/* Suggested orders */}
      <div className="mt-10">
        <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
          Suggested orders
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Buyers who need something carried along your route. Open one to make an offer.
        </p>

        {loading && (
          <div className="flex flex-col gap-3 max-w-3xl">
            <Skeleton h={104} />
            <Skeleton h={104} />
            <Skeleton h={104} />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {error}{" "}
            <button onClick={reload} className="underline font-bold">
              Retry
            </button>
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center text-sm max-w-3xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            No matching orders yet. Check back later, new orders are added all the time.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-3 max-w-3xl">
            {orders.map((o) => (
              <MatchedOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="mt-6 max-w-3xl text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-5 py-2 rounded-full text-sm font-bold disabled:opacity-60"
              style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}