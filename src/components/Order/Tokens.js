export const T = {
  brand:      "var(--brand)",
  brandLight: "var(--brand-light)",
  brandMid:   "var(--brand-light)",
  ink:        "var(--text-primary)",
  inkMid:     "var(--text-secondary)",
  inkSoft:    "var(--text-muted)",
  line:       "var(--border-subtle)",
  surface:    "var(--bg-surface-hover)",
  white:      "var(--bg-surface)",
  danger:     "var(--danger)",
  dangerBg:   "var(--danger-bg)",
  dangerLine: "var(--danger)",
  warn:       "#B45309",
  warnBg:     "#FFFBEB",
  warnLine:   "#FDE68A",
  ok:         "#166534",
  okBg:       "#F0FDF4",
  okLine:     "#BBF7D0",
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const shadow = {
  card:  "0 1px 3px rgba(13,27,42,0.07), 0 4px 16px rgba(13,27,42,0.04)",
  modal: "0 24px 64px rgba(13,27,42,0.18)",
};

export const PAYMENT_TYPES = ["FULL PAYMENT", "REWARD ONLY", "PARTIAL PAYMENT"];

export const fieldLabel = {
  display: "block", fontSize: 11.5, color: T.inkSoft, fontWeight: 600,
  letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6,
};

export const fieldInput = {
  width: "100%", borderRadius: radius.md, border: `1.5px solid ${T.line}`,
  padding: "10px 13px", fontSize: 13.5, color: T.ink, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", background: T.white,
  transition: "border-color 0.15s",
};