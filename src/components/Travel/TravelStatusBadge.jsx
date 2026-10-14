// travel_verification.status is a different vocabulary from order status
// (OPEN/ASSIGNED/etc in ../common/StatusBadge) — kept separate so the two

import { radius } from "../Order/Tokens";

// never collide and every value here actually has a color.
const VERIFICATION_MAP = {
  VERIFIED:   { bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
  PENDING:    { bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  UNVERIFIED: { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" },
};

export default function TravelStatusBadge({ status }) {
  // No travel_verification object at all (user skipped document upload) should
  // read the same as an explicit UNVERIFIED, not fall into the generic gray
  // "unknown status" style with blank text.
  const resolvedStatus = status || "UNVERIFIED";
  const s = VERIFICATION_MAP[resolvedStatus] || {
    bg: "var(--bg-surface-hover)",
    color: "var(--text-muted)",
    dot: "var(--text-muted)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: radius.pill,
        background: s.bg,
        color: s.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {resolvedStatus}
    </span>
  );
}