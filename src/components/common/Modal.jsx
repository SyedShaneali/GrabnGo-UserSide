/* Shared generic modal — used by OrderDetails checklist/lightbox and MakeOfferModal */
export default function Modal({ open, onClose, children, tight, wide }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tight ? "transparent" : "var(--bg-surface)",
          borderRadius: tight ? 8 : 16,
          border: tight ? "none" : "1px solid var(--border-subtle)",
          padding: tight ? 0 : 24,
          maxWidth: tight ? "92vw" : wide ? 960 : 440,
          maxHeight: "88vh",
          width: tight ? "auto" : "100%",
          overflow: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: tight ? -36 : 12, right: tight ? 0 : 12,
            background: tight ? "transparent" : "var(--bg-surface-hover)",
            border: "none", borderRadius: "50%",
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: tight ? "#fff" : "var(--text-secondary)", fontSize: 18,
          }}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}