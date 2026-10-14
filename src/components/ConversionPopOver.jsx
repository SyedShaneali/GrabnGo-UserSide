/* Same pieces as in OrderRow.jsx, pulled out so user-facing cards can reuse them.
   `align` lets the popover open from the left/right edge of its box so it doesn't
   get clipped on narrow screens. */

export function formatPrice(n, currency = "Rs") {
  return `${currency} ${Number(n).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function IButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 16, height: 16, borderRadius: "50%",
        border: "1.5px solid var(--text-muted)", background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0, flexShrink: 0,
        color: "var(--text-muted)", fontSize: 10, fontWeight: 700, lineHeight: 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.color = "var(--brand)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--text-muted)";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      i
    </button>
  );
}

export function ConversionPopover({ data, onClose, align = "center" }) {
  if (!data) return null;

  const rows = [
    { label: "Actual Amount",    value: `${data.actual_currency} ${Number(data.actual_amount).toLocaleString()}` },
    { label: "Amount in USD",    value: `USD ${Number(data.actual_amount_in_usd).toLocaleString()}` },
    { label: "Exchange Rate",    value: `1 ${data.actual_currency} = ${data.actual_currency_to_usd_rate} USD` },
    { label: "Converted Amount", value: `${data.converted_currency} ${Number(data.converted_amount).toLocaleString()}` },
    ...(data.usd_to_converted_currency_rate ? [
      { label: `USD → ${data.converted_currency} Rate`, value: `1 USD = ${data.usd_to_converted_currency_rate} ${data.converted_currency}` },
    ] : []),
  ];

  const boxPos =
    align === "left"  ? { left: 0 } :
    align === "right" ? { right: 0 } :
                        { left: "50%", transform: "translateX(-50%)" };

  const arrowPos =
    align === "left"  ? { left: 22 } :
    align === "right" ? { right: 22 } :
                        { left: "50%", transform: "translateX(-50%)" };

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
      <div
        className="w-[240px] sm:w-[270px]"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: "calc(100% + 8px)", ...boxPos,
          zIndex: 100, background: "var(--bg-surface)",
          borderRadius: 14, border: "1px solid var(--border-default)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          padding: "16px 18px",
        }}
      >
        <div style={{
          position: "absolute", top: -7, ...arrowPos,
          width: 13, height: 13, background: "var(--bg-surface)",
          border: "1px solid var(--border-default)", borderBottom: "none", borderRight: "none",
          rotate: "45deg",
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
          Price Conversion
        </p>
        {rows.map(({ label, value }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 0", borderBottom: "1px solid var(--bg-surface-hover)",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}