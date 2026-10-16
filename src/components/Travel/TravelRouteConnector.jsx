import airplaneImg from "../../assets/images/airplane.png";

function FlagImg({ code, size = 28 }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      width={size}
      height={Math.round(size * 0.67)}
      style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
      alt=""
    />
  );
}

// `compact` drops the fixed min-width/padding so the route fits inside narrow cards.
// Without it the component renders exactly as before (back-office rows).
export default function TravelRouteConnector({ fromCode, from, toCode, to, compact = false }) {
  const sideWidth = compact ? 96 : 120;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0, flex: 1,
      minWidth: compact ? 0 : 380, padding: compact ? 0 : "0 16px",
    }}>

      {/* From */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: sideWidth, flexShrink: 0 }}>
        <FlagImg code={fromCode} />
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
          whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.3,
        }}>
          {from}
        </span>
      </div>

      {/* Arrow line with airplane */}
      <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center", minWidth: compact ? 64 : 100, marginRight: 8 }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, height: 1, background: "var(--text-secondary)" }} />
          <div style={{ width: 10 }} />
          <div style={{ width: 20 }} />
          <div style={{ flex: 1, height: 1, background: "var(--text-secondary)" }} />
          <svg width="7" height="7" viewBox="0 0 10 10" style={{ flexShrink: 0, marginLeft: -1 }}>
            <polyline points="0,1 9,5 0,9" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <img
          src={airplaneImg}
          alt="airplane"
          width={20}
          height={20}
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none", objectFit: "contain",
          }}
        />
      </div>

      {/* To */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: sideWidth, flexShrink: 0 }}>
        <FlagImg code={toCode} />
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
          whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.3,
        }}>
          {to}
        </span>
      </div>

    </div>
  );
}