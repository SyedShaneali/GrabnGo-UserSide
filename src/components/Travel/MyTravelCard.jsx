import TravelRouteConnector from "./TravelRouteConnector";
import TravelStatusBadge from "./TravelStatusBadge";
import { TripTypePill, formatDate, WEIGHT_UNIT } from "./TravelCard";

function Stat({ label, value }) {
  return (
    <div style={{ background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
      <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{
        fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </p>
    </div>
  );
}

function ActivePill({ active }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px", borderRadius: 999,
      background: "var(--bg-surface-hover)",
      color: active ? "var(--success, #0d9488)" : "var(--text-muted)",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: active ? "var(--success, #0d9488)" : "var(--text-muted)",
      }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ItineraryRow({ leg, label }) {
  const hasDimensions = leg.length_in && leg.width_in && leg.height_in;
  const cities = [leg.from_city?.name, leg.to_city?.name].filter(Boolean).join(" → ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {label && (
        <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>{label}</p>
      )}

      {/*
        Removed the onClick={e => e.stopPropagation()} wrapper that used to be here.
        It was swallowing every click on the route connector + cities text, so
        tapping that part of the card (a big, visually central chunk) did nothing —
        the click never bubbled up to the card's own onClick/onView handler.
        If TravelRouteConnector turns out to have its own interactive element
        (a button/link inside it) that needs isolating, stopPropagation should be
        added there specifically, not wrapped around this whole block.
      */}
      <div>
        <TravelRouteConnector
          compact
          fromCode={leg.from_country?.icon_base_path} from={leg.from_country?.name}
          toCode={leg.to_country?.icon_base_path}     to={leg.to_country?.name}
        />
        {cities && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>{cities}</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        <Stat label="Travel Date" value={formatDate(leg.travel_date)} />
        <Stat
          label="Weight Capacity"
          value={leg.weight_capacity != null ? `${leg.weight_capacity} ${WEIGHT_UNIT}` : "Not specified"}
        />
        {hasDimensions && (
          <Stat label="Max Size (L × W × H)" value={`${leg.length_in} × ${leg.width_in} × ${leg.height_in} in`} />
        )}
        <Stat label="Pending Offers" value={leg.pending_offer_count ?? 0} />
        <Stat label="Accepted Offers" value={leg.accepted_and_completed_offer_count ?? 0} />
      </div>
    </div>
  );
}

/**
 * Card for one item from GET /travel/user.
 * Unlike TravelCard (which expects one flat route per row), this shows every
 * itinerary leg of the travel, e.g. both directions of a round trip.
 */
export default function MyTravelCard({ travel, onView }) {
  const itineraries = travel.itineraries ?? [];
  const multi = itineraries.length > 1;

  return (
    <div
      onClick={() => onView && onView(travel)}
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        background: "var(--bg-surface)", borderRadius: 16,
        border: "1px solid var(--border-subtle)", padding: 14,
        cursor: onView ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,128,128,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <TripTypePill type={travel.trip_type} />
          <ActivePill active={travel.is_active} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {itineraries.length} {itineraries.length === 1 ? "itinerary" : "itineraries"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TravelStatusBadge status={travel.travel_verification?.status} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>#{travel.id}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      {/* Itinerary legs */}
      {itineraries.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No itineraries added yet</p>
      ) : (
        itineraries.map((leg, i) => (
          <div key={leg.id ?? i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {i > 0 && <div style={{ height: 1, background: "var(--border-subtle)" }} />}
            <ItineraryRow leg={leg} label={multi ? `Leg ${i + 1}` : null} />
          </div>
        ))
      )}
    </div>
  );
}