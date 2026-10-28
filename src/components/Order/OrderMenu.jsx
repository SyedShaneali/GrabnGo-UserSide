import { useEffect, useRef, useState } from "react";

export default function OrderMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const visible = items.filter((i) => i.show !== false);
  if (!visible.length) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        style={{
          width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: 42, minWidth: 180, zIndex: 50,
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}>
          {visible.map((item) => (
            <button
              key={item.key}
              onClick={() => { setOpen(false); item.onClick(); }}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "9px 12px",
                background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13.5, fontWeight: 600,
                color: item.danger ? "var(--danger)" : "var(--text-primary)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}