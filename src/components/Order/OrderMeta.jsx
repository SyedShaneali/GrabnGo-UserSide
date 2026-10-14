
// No product image on the order — a plain neutral "no image" box so the UI

import Chip from "../Chip";

// never shows a broken-image icon. Inline SVG data URI, no extra asset file needed.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="10" fill="#EEF2F1"/>
      <path d="M22 54 32 40l8 10 8-14 10 18H22Z" fill="#C7D0CD"/>
      <circle cx="30" cy="30" r="5" fill="#C7D0CD"/>
    </svg>
  `);

export const PAYMENT_META = {
  VERIFIED: {
    label: "Payment verified",
    color: "var(--success, #0d9488)",
    bg:    "var(--success-soft, rgba(13,148,136,0.12))",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  PENDING: {
    label: "Payment pending",
    color: "var(--warning, #d97706)",
    bg:    "var(--warning-soft, rgba(217,119,6,0.12))",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
  },
  UNVERIFIED: {
    label: "Payment unverified",
    color: "var(--danger, #dc2626)",
    bg:    "var(--danger-soft, rgba(220,38,38,0.12))",
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

export const TYPE_META = {
  PURCHASE: {
    label: "Buy & Deliver",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  LUGGAGE: {
    label: "Carry & Deliver",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
};

export function formatDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function titleCase(s = "") {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function TypePill({ type }) {
  if (!type) return null;
  const meta = TYPE_META[type];

  if (!meta) {
    return <Chip>{titleCase(type)}</Chip>;
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px 3px 7px", borderRadius: 999,
      background: "var(--accent-soft, rgba(13,148,136,0.12))",
      color: "var(--accent, #0d9488)",
      whiteSpace: "nowrap",
    }}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

export function PaymentPill({ status }) {
  const meta = PAYMENT_META[status] ?? PAYMENT_META.UNVERIFIED;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px 3px 7px", borderRadius: 999,
      background: meta.bg,
      color: meta.color,
      whiteSpace: "nowrap",
    }}>
      {meta.icon}
      {meta.label}
    </span>
  );
}