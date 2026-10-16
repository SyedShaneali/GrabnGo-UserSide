import { radius } from "../Order/Tokens";

const STATUS_MAP = {
  OPEN:      { bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  ASSIGNED:  { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
  COMPLETED: { bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
  CANCELLED: { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" },
  PENDING:   { bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  PURCHASED: { bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  TRAVELING: { bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
};

export default function StatusBadge({ status }) {
    console.log('NAME', status);
  const s = STATUS_MAP[status] || {
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
      {status}
    </span>
  );
}