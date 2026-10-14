// components/Chat/PresenceDot.jsx
// Small colored dot to overlay on an avatar (or place inline next to a name)
// to show a user's online status. Purely presentational — pass `online`
// from usePresence().isUserOnline(userId).
//
// Usage as an avatar badge (absolute-positioned over a circular avatar):
//   <div style={{ position: "relative", width: 36, height: 36 }}>
//     <img src={...} style={{ width: 36, height: 36, borderRadius: "50%" }} />
//     <PresenceDot online={isUserOnline(chat.other_user.id)} />
//   </div>
//
// Usage inline (e.g. next to a name in a list row):
//   <PresenceDot online={isUserOnline(chat.other_user.id)} inline />
//   <span>{chat.other_user.name}</span>

export default function PresenceDot({ online, size = 10, inline = false }) {
  const dot = (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: online ? "#22c55e" : "var(--text-muted)",
        border: inline ? "none" : "2px solid var(--bg-surface)",
        flexShrink: 0,
      }}
    />
  );

  if (inline) return dot;

  return (
    <span
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
      }}
    >
      {dot}
    </span>
  );
}