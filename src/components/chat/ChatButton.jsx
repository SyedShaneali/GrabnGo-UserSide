// components/ChatButton.jsx
import { useNavigate } from "react-router-dom";

function IconChat({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

/**
 * Drop this next to the order owner's name, e.g.:
 *
 *   <span>{order.owner.name}</span>
 *   <ChatButton
 *     orderId={order.id}
 *     userId={order.owner.id}
 *     name={order.owner.name}
 *     email={order.owner.email}
 *     image={order.owner.image}
 *   />
 *
 * NOTE: this assumes the route is /chat/:id — confirm this matches
 * whatever path is actually registered for ChatScreen under UserLayout
 * (memory shows the routes list included a bare /chat with no param yet,
 * so the route definition may need updating to /chat/:id).
 */
export default function ChatButton({ orderId, userId, name, email, image, size = 32 }) {
  const navigate = useNavigate();

  if (!userId) return null;

  const handleClick = (e) => {
    e.stopPropagation(); // in case this sits inside a clickable card row
    const params = new URLSearchParams({ user: String(userId) });
    if (name)  params.set("name", encodeURIComponent(name));
    if (email) params.set("email", encodeURIComponent(email));
    if (image) params.set("image", encodeURIComponent(image));
    navigate(`/chat/${orderId}?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Chat with ${name ?? "user"}`}
      title="Chat"
      style={{
        width: size, height: size, borderRadius: "50%",
        border: "1px solid var(--border-default)", background: "var(--bg-page)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-secondary)", cursor: "pointer", flexShrink: 0,
        transition: "border-color 0.15s, background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background  = "var(--brand-light)";
        e.currentTarget.style.color       = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.background  = "var(--bg-page)";
        e.currentTarget.style.color       = "var(--text-secondary)";
      }}
    >
      <IconChat size={Math.round(size * 0.47)} />
    </button>
  );
}