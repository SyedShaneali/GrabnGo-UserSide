import { useState } from "react";
import TravelRouteConnector from "./TravelRouteConnector";
import TravelStatusBadge from "./TravelStatusBadge";

// weight_capacity has no unit in the API — change this if it isn't kg
export const WEIGHT_UNIT = "kg";

// Distinct colors per trip type so "One Way", "Round Trip" and "Multi Trip"
// read differently at a glance. Keyed on the raw API string — add more
// entries if new types show up.
const TRIP_TYPE_META = {
  "ONE WAY":    { label: "One Way",    color: "#1D4ED8", bg: "#EFF6FF" },
  "ROUND TRIP": { label: "Round Trip", color: "#0F766E", bg: "#F0FDFA" },
  "MULTI TRIP": { label: "Multi Trip", color: "#7C3AED", bg: "#F5F3FF" },
};

export function formatDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Fallback for any trip_type not in TRIP_TYPE_META — title-cases each word
// ("SOMETHING NEW" -> "Something New") instead of just the first letter.
function titleCaseWords(s = "") {
  return s
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function TripTypePill({ type }) {
  if (!type) return null;
  const meta = TRIP_TYPE_META[type];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px", borderRadius: 999,
      background: meta?.bg ?? "var(--bg-surface-hover)",
      color: meta?.color ?? "var(--text-secondary)",
      whiteSpace: "nowrap",
    }}>
      {meta?.label ?? titleCaseWords(type)}
    </span>
  );
}

function Avatar({ name, src, size = 44 }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "var(--bg-surface-hover)", border: "1px solid var(--border-subtle)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-secondary)", fontSize: size > 44 ? 16 : 14, fontWeight: 700,
    }}>
      {src && !failed ? (
        <img
          src={src} alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}

function Rating({ value }) {
  const n = Number(value);
  if (!n) {
    return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No ratings yet</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--warning, #F59E0B)" stroke="var(--warning, #F59E0B)"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {n.toFixed(1)}
    </span>
  );
}

function VDivider() {
  return (
    <div
      className="hidden lg:block"
      style={{
        width: 1, alignSelf: "stretch", background: "var(--border-subtle)",
        flexShrink: 0, margin: "10px 0",
      }}
    />
  );
}

/* ── Desktop row (lg and up) ── */
function DesktopRow({ travel, onView }) {
  const traveler = travel.traveler ?? {};
  const capacity = travel.weight_capacity != null ? `${travel.weight_capacity} ${WEIGHT_UNIT}` : "Not specified";
  const hasDimensions = travel.length_in && travel.width_in && travel.height_in;

  return (
    <div
      onClick={() => onView && onView(travel)}
      className="hidden lg:flex"
      style={{
        alignItems: "center", background: "var(--bg-surface)",
        borderRadius: 14, border: "1px solid var(--border-subtle)",
        minHeight: 76, minWidth: 1100, overflow: "visible",
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
      <div style={{ margin: "0 14px" }}>
        <Avatar name={traveler.name} src={traveler.image} />
      </div>

      <div style={{ width: 190, flexShrink: 0, paddingRight: 12 }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4,
          display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {traveler.name || "Traveler"}
        </span>
        <div style={{ marginTop: 3 }}>
          <Rating value={traveler.average_rating} />
        </div>
        {travel.trip_type && (
          <div style={{ marginTop: 6 }}>
            <TripTypePill type={travel.trip_type} />
          </div>
        )}
      </div>

      <VDivider />

      <TravelRouteConnector
        fromCode={travel.from_country?.icon_base_path} from={travel.from_country?.name}
        toCode={travel.to_country?.icon_base_path}     to={travel.to_country?.name}
      />

      <VDivider />

      <div style={{ width: 140, flexShrink: 0, padding: "0 16px" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Travel Date</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap" }}>
          {formatDate(travel.travel_date)}
        </p>
      </div>

      <VDivider />

      <div style={{ width: 150, flexShrink: 0, padding: "0 16px" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Weight Capacity</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap" }}>
          {capacity}
        </p>
        {hasDimensions && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap" }}>
            {travel.length_in} × {travel.width_in} × {travel.height_in} in
          </p>
        )}
      </div>

      <VDivider />

      <div style={{ width: 130, flexShrink: 0, textAlign: "center", padding: "0 12px" }}>
        <TravelStatusBadge status={travel.travel_verification?.status} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>#{travel.id}</p>
      </div>
    </div>
  );
}

/* ── Mobile / tablet card (below lg) ── */
function MobileCard({ travel, onView }) {
  const traveler = travel.traveler ?? {};
  const capacity = travel.weight_capacity != null ? `${travel.weight_capacity} ${WEIGHT_UNIT}` : "Not specified";
  const hasDimensions = travel.length_in && travel.width_in && travel.height_in;

  return (
    <div
      onClick={() => onView && onView(travel)}
      className="flex lg:hidden flex-col"
      style={{
        background: "var(--bg-surface)", borderRadius: 16,
        border: "1px solid var(--border-subtle)", padding: 12, gap: 10,
        cursor: onView ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={traveler.name} src={traveler.image} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.35,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {traveler.name || "Traveler"}
          </p>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 3 }}>
            <Rating value={traveler.average_rating} />
            <TripTypePill type={travel.trip_type} />
          </div>
        </div>

        <TravelStatusBadge status={travel.travel_verification?.status} />
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div onClick={e => e.stopPropagation()}>
        <TravelRouteConnector
          compact
          fromCode={travel.from_country?.icon_base_path} from={travel.from_country?.name}
          toCode={travel.to_country?.icon_base_path}     to={travel.to_country?.name}
        />
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
          <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>Travel Date</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatDate(travel.travel_date)}
          </p>
        </div>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
          <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>Weight Capacity</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {capacity}
          </p>
        </div>
        {hasDimensions && (
          <div style={{ gridColumn: "1 / -1", background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px" }}>
            <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>Max Size (L × W × H)</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0" }}>
              {travel.length_in} × {travel.width_in} × {travel.height_in} in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TravelCard({ travel, onView }) {
  return (
    <>
      <DesktopRow travel={travel} onView={onView} />
      <MobileCard travel={travel} onView={onView} />
    </>
  );
}