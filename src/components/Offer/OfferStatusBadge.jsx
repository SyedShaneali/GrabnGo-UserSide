import { radius } from "../Order/Tokens";

const OFFER_STATUS_MAP = {
  PENDING:   { bg: "#FFF7E6", color: "#B45309", dot: "#F59E0B" },
  ACCEPTED:  { bg: "#ECFDF5", color: "#0D9488", dot: "#10B981" },
  REJECTED:  { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" },
  WITHDRAWN: { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" },
  COMPLETED: { bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
};

const STATUS_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
};

export default function OfferStatusBadge({ status }) {
  const s = OFFER_STATUS_MAP[status] || {
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
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 12px",
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
      {STATUS_LABELS[status] || status}
    </span>
  );
}