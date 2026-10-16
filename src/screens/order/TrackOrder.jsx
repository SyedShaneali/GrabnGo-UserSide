import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderStatusFlow } from "../../hooks/useOrderStatusFlow";
import { useOrderDetail } from "../../hooks/useOrderDetails"; // same hook OrderDetails uses
import { useUpdateOrderStatus } from "../../hooks/useUpdateOrderStatus"; // ⚠️ adjust path

/* ─── Status color map ───────────────────────────────────────────────────── */
const STATUS_COLORS = {
  ASSIGNED:             { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
  PURCHASING:           { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", dot: "#f97316" },
  PURCHASED:            { bg: "#fefce8", color: "#854d0e", border: "#fde68a", dot: "#eab308" },
  "PURCHASE VERIFIED":  { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", dot: "#22c55e" },
  TRAVELING:            { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd", dot: "#0ea5e9" },
  ARRIVED:              { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe", dot: "#8b5cf6" },
  DISPATCHED:           { bg: "#fff1f2", color: "#be123c", border: "#fecdd3", dot: "#f43f5e" },
  RECEIVED:             { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", dot: "#10b981" },
};

const DEFAULT_COLOR = {
  bg: "var(--bg-surface-hover)", color: "var(--text-secondary)",
  border: "var(--border-default)", dot: "var(--text-muted)",
};

const ORDER_STATUS_COLORS = {
  OPEN:      { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  ASSIGNED:  { bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  COMPLETED: { bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  PENDING:   { bg: "#fefce8", color: "#854d0e", dot: "#eab308" },
};

// Statuses that count as "the order is over" — no further action buttons
const TERMINAL_STATUSES = ["RECEIVED", "CANCELED", "CANCELLED"];

function getColor(statusName) {
  return STATUS_COLORS[statusName?.toUpperCase()] ?? DEFAULT_COLOR;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

function getCurrentUserId() {
  try {
    return localStorage.getItem("user_id");
  } catch {
    return null;
  }
}

function ActorBadge({ actor }) {
  const map = {
    SYSTEM:      { label: "System",      bg: "#f1f5f9", color: "#475569" },
    TRAVELER:    { label: "Traveler",    bg: "#eff6ff", color: "#1d4ed8" },
    ORDER_OWNER: { label: "Order Owner", bg: "#f0fdf4", color: "#166534" },
  };
  const s = map[actor] ?? { label: actor, bg: "var(--bg-surface-hover)", color: "var(--text-secondary)" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 9px",
      borderRadius: 999, background: s.bg, color: s.color, letterSpacing: "0.02em",
    }}>
      {s.label}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Spinner({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "2.5px solid var(--border-default)", borderTopColor: "var(--brand)",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

function Avatar({ name, src, size = 36 }) {
  const [imgError, setImgError] = React.useState(false);
  const initials = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--brand-light)", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.38), fontWeight: 700, color: "var(--accent)",
      border: "2px solid var(--border-subtle)",
    }}>
      {src && !imgError ? (
        <img src={src} alt={name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : initials}
    </div>
  );
}

function UserCard({ label, user }) {
  if (!user) return null;
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      background: "var(--bg-page)", border: "1px solid var(--border-subtle)",
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={user.name} src={user.image} size={36} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name ?? "—"}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email ?? "No email"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Checklist confirmation modal (PURCHASING -> PURCHASED, traveler only) ── */
function ChecklistModal({ items, onConfirm, onClose, submitting }) {
  const [checked, setChecked] = useState(() => new Set());

  const toggle = (i) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const allChecked = items.length > 0 && checked.size === items.length;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", width: "100%", maxWidth: 460, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bg-surface-hover)" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Confirm checklist</p>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Confirm every point before marking this order as purchased.
          </p>
        </div>

        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 ? (
            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
              No checklist items on this order.
            </p>
          ) : (
            items.map((item, i) => (
              <label key={i} className="flex items-start gap-3 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
                <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} style={{ marginTop: 3 }} />
                <span>{item}</span>
              </label>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--bg-surface-hover)" }}>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting || (items.length > 0 && !allChecked)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {submitting ? "Confirming..." : "Mark as Purchased"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cancel modal (order owner only) ── */
function CancelModal({ onConfirm, onClose, submitting }) {
  const [reason, setReason] = useState("");

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", width: "100%", maxWidth: 420 }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bg-surface-hover)" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Cancel order</p>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 0" }}>
            This will cancel the order. Let the traveler know why.
          </p>
        </div>
        <div style={{ padding: 20 }}>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--bg-surface-hover)" }}>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Back
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--danger)" }}
          >
            {submitting ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Action panel: next-status button + checklist/cancel entry points ── */
function ActionPanel({ order, flow, onStatusChanged }) {
  const { updateStatus, updating } = useUpdateOrderStatus();
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = getCurrentUserId();
  const isOwner = order?.owner?.id !== undefined && String(order.owner.id) === String(currentUserId);
  const isTraveler = order?.assign_to?.id !== undefined && String(order.assign_to.id) === String(currentUserId);

  const currentStatusName = (order?.status?.status_name ?? "").toUpperCase();
  const isTerminal = TERMINAL_STATUSES.includes(currentStatusName);

  const nextStep = flow.find((s) => !s.is_completed);
  const nextStatusName = nextStep?.status?.status_name ?? "";
  const nextActor = nextStep?.status?.actor; // "TRAVELER" | "ORDER_OWNER" | "SYSTEM"

  const canAct =
    !isTerminal &&
    nextStep &&
    ((nextActor === "TRAVELER" && isTraveler) || (nextActor === "ORDER_OWNER" && isOwner));

  const needsChecklist =
    isTraveler &&
    currentStatusName === "PURCHASING" &&
    nextStatusName.toUpperCase() === "PURCHASED";

  const runUpdate = async (opts) => {
    setError(null);
    try {
      await updateStatus(order.id, opts);
      onStatusChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdvanceClick = () => {
    if (needsChecklist) {
      setChecklistOpen(true);
      return;
    }
    runUpdate({ status: nextStatusName });
  };

  const handleChecklistConfirm = async () => {
    await runUpdate({ status: nextStatusName, isChecklist: true });
    setChecklistOpen(false);
  };

  const handleCancelConfirm = async (reason) => {
    await runUpdate({ status: "CANCELED", orderCancelReason: reason });
    setCancelOpen(false);
  };

  if (!isOwner && !isTraveler) return null; // bystanders get no actions

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: 16,
      border: "1px solid var(--border-subtle)", padding: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: 0, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        Actions
      </p>

      {error && (
        <p style={{ fontSize: 12.5, color: "var(--danger)", margin: 0 }}>{error}</p>
      )}

      {isTerminal && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
          This order is {currentStatusName.toLowerCase()} — no further actions.
        </p>
      )}

      {!isTerminal && canAct && (
        <button
          onClick={handleAdvanceClick}
          disabled={updating}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {updating ? "Updating..." : `Mark as ${nextStatusName}`}
        </button>
      )}

      {!isTerminal && !canAct && nextStep && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
          Waiting on {nextActor === "TRAVELER" ? "the traveler" : "the order owner"} to mark this as{" "}
          <strong style={{ color: "var(--text-secondary)" }}>{nextStatusName}</strong>.
        </p>
      )}

      {!isTerminal && isOwner && (
        <button
          onClick={() => setCancelOpen(true)}
          disabled={updating}
          className="text-sm font-semibold self-start"
          style={{ color: "var(--danger)" }}
        >
          Cancel order
        </button>
      )}

      {checklistOpen && (
        <ChecklistModal
          items={order?.check_list ?? []}
          submitting={updating}
          onConfirm={handleChecklistConfirm}
          onClose={() => setChecklistOpen(false)}
        />
      )}

      {cancelOpen && (
        <CancelModal
          submitting={updating}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}

export default function TrackOrder() {
  // Route must be defined as /orders/:id/track
  const { id }   = useParams();
  const navigate = useNavigate();

  const { flow, loading: flowLoading, error: flowError, refetch: refetchFlow } = useOrderStatusFlow(id);
  const { order, loading: orderLoading, refetch: refetchOrder }                = useOrderDetail(id);

  const completedCount = flow.filter(s => s.is_completed).length;
  const totalCount     = flow.length;
  const statusName     = order?.status?.status_name ?? "";
  const statusCfg      = ORDER_STATUS_COLORS[statusName] ?? { bg: "var(--bg-surface-hover)", color: "var(--text-secondary)", dot: "var(--text-muted)" };

  const loading = flowLoading || orderLoading;

  const handleStatusChanged = () => {
    refetchFlow?.();
    refetchOrder?.();
  };

  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .track-layout { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
        @media (min-width: 900px) { .track-layout { grid-template-columns: 300px 1fr; } }
      `}</style>

      <div className="px-4 sm:px-8 lg:px-10" style={{ paddingTop: 24, paddingBottom: 32, boxSizing: "border-box", width: "100%", minHeight: "100%" }}>

        {/* ── Top nav ── */}
        <button
          onClick={() => navigate(`/orders/${id}`)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
            padding: 0, marginBottom: 24, fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="19 12 5 12" /><polyline points="12 5 5 12 12 19" />
          </svg>
          Back to Order
        </button>

        {/* ── Title ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              Track Order
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Order <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>#{id}</span>
            </p>
          </div>

          {/* Progress ring */}
          {!loading && totalCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 16px", borderRadius: 12,
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ position: "relative", width: 36, height: 36 }}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-default)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke="var(--brand)" strokeWidth="3"
                    strokeDasharray={`${(completedCount / totalCount) * 94.2} 94.2`}
                    strokeLinecap="round" transform="rotate(-90 18 18)"
                  />
                </svg>
                <span style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 9.5, fontWeight: 800, color: "var(--brand)",
                }}>
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {completedCount === totalCount ? "All Complete" : "In Progress"}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  {completedCount} of {totalCount} steps done
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Spinner ── */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, padding: 80 }}>
            <Spinner size={32} />
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Loading…</p>
          </div>
        )}

        {/* ── Two column layout (stacks on small screens) ── */}
        {!loading && (
          <div className="track-layout">

            {/* ── LEFT: Order Details ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Product card */}
              <div style={{
                background: "var(--bg-surface)", borderRadius: 16,
                border: "1px solid var(--border-subtle)",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {/* Product image */}
                <div style={{
                  width: "100%", height: 140, background: "var(--bg-page)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderBottom: "1px solid var(--border-subtle)", overflow: "hidden",
                }}>
                  {order?.images?.[0] ? (
                    <img src={order.images[0]} alt={order.product_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                      stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  )}
                </div>

                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.3 }}>
                    {order?.product_name ?? "—"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", fontWeight: 500 }}>
                    Order #{order?.id}
                  </p>

                  {/* Current status pill */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px 5px 9px", borderRadius: 999,
                    background: statusCfg.bg, border: `1px solid ${statusCfg.dot}33`,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusCfg.dot }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusCfg.color }}>
                      {statusName || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner + Traveler */}
              <div style={{
                background: "var(--bg-surface)", borderRadius: 16,
                border: "1px solid var(--border-subtle)", padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: 0, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Parties
                </p>
                <UserCard label="Order Owner" user={order?.owner} />
                {order?.assign_to ? (
                  <UserCard label="Traveler" user={order.assign_to} />
                ) : (
                  <div style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: "var(--bg-page)", border: "1px solid var(--border-subtle)",
                    fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
                  }}>
                    No traveler assigned yet
                  </div>
                )}
              </div>

              {/* ── Actions: advance status / cancel ── */}
              <ActionPanel order={order} flow={flow} onStatusChanged={handleStatusChanged} />
            </div>

            {/* ── RIGHT: Timeline ── */}
            <div>
              {flowError && (
                <div style={{
                  padding: "16px 20px", borderRadius: 12,
                  background: "var(--danger-bg)", border: "1px solid var(--danger)",
                  color: "var(--danger)", fontSize: 13, fontWeight: 500,
                }}>
                  {flowError}
                </div>
              )}

              {!flowError && flow.length === 0 && (
                <div style={{ textAlign: "center", padding: 64, color: "var(--text-muted)", fontSize: 13 }}>
                  No status flow data available for this order.
                </div>
              )}

              {flow.length > 0 && (
                <div style={{ position: "relative" }}>

                  {/* Vertical connector line */}
                  <div style={{
                    position: "absolute", left: 19, top: 20, bottom: 20,
                    width: 2, background: "var(--border-subtle)", borderRadius: 2, zIndex: 0,
                  }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {flow.map((step, i) => {
                      const sName  = step.status?.status_name ?? "";
                      const colors = getColor(sName);
                      const done   = step.is_completed;
                      const isLast = i === flow.length - 1;

                      return (
                        <div
                          key={step.status?.id ?? i}
                          style={{ display: "flex", gap: 16, alignItems: "flex-start", animation: `fadeUp 0.2s ${i * 0.05}s ease both` }}
                        >
                          {/* Step indicator dot */}
                          <div style={{ flexShrink: 0, zIndex: 1 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: "50%",
                              background: done ? "var(--brand)" : "var(--bg-surface)",
                              border: done ? "none" : "2px solid var(--border-default)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: done ? "0 2px 8px rgba(13,143,122,0.3)" : "none",
                              transition: "all 0.2s",
                            }}>
                              {done
                                ? <CheckIcon />
                                : <span style={{ color: "var(--text-muted)" }}><ClockIcon /></span>
                              }
                            </div>
                          </div>

                          {/* Step card */}
                          <div style={{
                            flex: 1,
                            minWidth: 0,
                            background: "var(--bg-surface)",
                            borderRadius: 14,
                            border: `1px solid ${done ? colors.border : "var(--border-subtle)"}`,
                            padding: "14px 18px",
                            marginBottom: isLast ? 0 : 12,
                            opacity: done ? 1 : 0.55,
                            transition: "opacity 0.2s",
                            boxShadow: done ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: done ? 8 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "4px 11px 4px 8px", borderRadius: 999,
                                  background: colors.bg, border: `1px solid ${colors.border}`,
                                }}>
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.color }}>
                                    {sName}
                                  </span>
                                </span>
                                <ActorBadge actor={step.status?.actor} />
                              </div>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                                Step {i + 1}
                              </span>
                            </div>

                            {done && step.completed_at && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                  stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>
                                  {formatDateTime(step.completed_at)}
                                </span>
                              </div>
                            )}

                            {step.status?.description && (
                              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "6px 0 0", lineHeight: 1.5 }}>
                                {step.status.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}