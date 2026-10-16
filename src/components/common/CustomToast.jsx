// components/CustomToast.jsx
import { useState } from "react";
import toast from "react-hot-toast";

// ── Icons ──────────────────────────────────────────────────────────────────
function IconCheck({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconWarning({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconInfo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconClose({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconMessage({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  );
}

const VARIANTS = {
  success: { icon: IconCheck,   accent: "#22c55e", glow: "rgba(34,197,94,0.22)",  iconBg: "linear-gradient(135deg, #22c55e, #16a34a)" },
  error:   { icon: IconX,       accent: "#ef4444", glow: "rgba(239,68,68,0.22)",  iconBg: "linear-gradient(135deg, #f87171, #dc2626)" },
  warning: { icon: IconWarning, accent: "#f59e0b", glow: "rgba(245,158,11,0.22)", iconBg: "linear-gradient(135deg, #fbbf24, #d97706)" },
  info:    { icon: IconInfo,    accent: "#3b82f6", glow: "rgba(59,130,246,0.22)", iconBg: "linear-gradient(135deg, #60a5fa, #2563eb)" },
  message: { icon: IconMessage, accent: "#14b8a6", glow: "rgba(20,184,166,0.22)", iconBg: "linear-gradient(135deg, #2dd4bf, #0d8f7a)" },
};

const GLOBAL_TOAST_STYLES = `
  @keyframes toastDepleteBar {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
  @keyframes toastPopIcon {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

// The actual rendered toast card — dark glass surface, soft color-tinted
// glow behind it matching the variant, a gradient icon chip, generous
// spacing, and a slim countdown bar along the bottom edge that depletes
// over the toast's duration (pauses on hover so you have time to read).
function ToastCard({ t, variant = "info", title, message, onCardClick }) {
  const cfg  = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = cfg.icon;
  const [hovering, setHovering] = useState(false);
  const durationMs = t.duration && t.duration > 0 ? t.duration : 4500;

  return (
    <div
      onClick={onCardClick ? () => { onCardClick(); toast.dismiss(t.id); } : undefined}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 13,
        width: 392,
        maxWidth: "92vw",
        background: "linear-gradient(180deg, #202024 0%, #17171a 100%)",
        borderRadius: 18,
        padding: "15px 14px 14px 15px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: `0 12px 32px rgba(0,0,0,0.38), 0 4px 12px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.02), 0 0 40px ${cfg.glow}`,
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.94)",
        transition: "opacity 0.25s cubic-bezier(.21,1.02,.73,1), transform 0.25s cubic-bezier(.21,1.02,.73,1)",
        cursor: onCardClick ? "pointer" : "default",
      }}
    >
      <style>{GLOBAL_TOAST_STYLES}</style>

      <div style={{
        flexShrink: 0,
        width: 40, height: 40, borderRadius: 12,
        background: cfg.iconBg, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 14px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        animation: "toastPopIcon 0.35s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <Icon size={19} />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 2, paddingRight: 4 }}>
        {title && (
          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.35, letterSpacing: "-0.005em" }}>
            {title}
          </p>
        )}
        {message && (
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 400, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
        aria-label="Dismiss"
        style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: 8, border: "none",
          background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.15s, color 0.15s", marginTop: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
      >
        <IconClose size={12} />
      </button>

      {/* Countdown bar — depletes left→right over the toast's lifetime, pauses on hover */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 2.5,
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          height: "100%", width: "100%",
          background: cfg.accent,
          transformOrigin: "left",
          animation: `toastDepleteBar ${durationMs}ms linear forwards`,
          animationPlayState: hovering ? "paused" : "running",
        }} />
      </div>
    </div>
  );
}

// ── Public API — call these anywhere instead of toast.success/toast.error ──
// showSuccessToast("Order updated", "The status was changed to Completed")
// showErrorToast("Failed to save", "Please check your connection and try again")
// showWarningToast("Heads up", "This action can't be undone")
// showInfoToast("New message", "You have an unread chat")
// showMessageToast("Ali Raza", "Sent you a photo", { onClick: () => ... })

export function showSuccessToast(title, message, opts = {}) {
  return toast.custom((t) => <ToastCard t={t} variant="success" title={title} message={message} />, {
    duration: 4000,
    ...opts,
  });
}

export function showErrorToast(title, message, opts = {}) {
  return toast.custom((t) => <ToastCard t={t} variant="error" title={title} message={message} />, {
    duration: 5000,
    ...opts,
  });
}

export function showWarningToast(title, message, opts = {}) {
  return toast.custom((t) => <ToastCard t={t} variant="warning" title={title} message={message} />, {
    duration: 4500,
    ...opts,
  });
}

export function showInfoToast(title, message, opts = {}) {
  return toast.custom((t) => <ToastCard t={t} variant="info" title={title} message={message} />, {
    duration: 4000,
    ...opts,
  });
}

// Pass onClick to make the whole card tappable (e.g. jump into that chat).
// Without it, the toast is purely informational — dismiss via the ✕ or timeout.
export function showMessageToast(title, message, opts = {}) {
  const { onClick, ...rest } = opts;
  return toast.custom(
    (t) => <ToastCard t={t} variant="message" title={title} message={message} onCardClick={onClick} />,
    { duration: 5000, ...rest }
  );
}