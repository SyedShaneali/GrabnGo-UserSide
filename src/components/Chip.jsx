export default function Chip({ children, color = "var(--text-secondary)", dot }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 10.5, fontWeight: 600, lineHeight: 1.4,
        padding: "2px 8px", borderRadius: 999,
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface-hover)",
        color, whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      )}
      {children}
    </span>
  );
}