import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../../components/common/StatusBadge";
import { ConversionPopover, IButton, formatPrice } from "../../components/ConversionPopOver";
import { TypePill, PaymentPill, formatDate, PLACEHOLDER_IMAGE } from "../../components/Order/OrderMeta";
import RouteConnector from "../../components/Order/RouteConnector";
import Modal from "../../components/common/Modal";
import MakeOfferModal from "../../components/Order/MakeOfferModal";
import OrderMenu from "../../components/Order/OrderMenu";
import { useOrderDetail } from "../../hooks/useOrderDetails";
import { useCheckOffer } from "../../hooks/useCheckOffer";
import { useOrderActions, useOrderActivityLog } from "../../hooks/useOrderActions";
import ChatButton from "../../components/chat/ChatButton";

/* Logged-in user's id, saved in localStorage as "user_id" */
function getCurrentUserId() {
  try {
    return localStorage.getItem("user_id");
  } catch {
    return null;
  }
}

/* ── Skeleton ── */
function DetailSkeleton() {
  const pulse = {
    background: "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 8,
  };
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <div style={{ ...pulse, height: 220, width: "100%" }} />
        <div style={{ ...pulse, height: 20, width: "50%" }} />
        <div style={{ ...pulse, height: 14, width: "30%" }} />
        <div style={{ ...pulse, height: 100, width: "100%" }} />
        <div style={{ ...pulse, height: 100, width: "100%" }} />
      </div>
    </>
  );
}

/* ── Small pieces ── */
function Section({ title, children, action }) {
  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: 16,
      border: "1px solid var(--border-subtle)", padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--bg-surface-hover)" }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function PriceRow({ label, amount, currency, color, conversion }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--bg-surface-hover)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
        {conversion && <IButton onClick={() => setOpen(v => !v)} />}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{formatPrice(amount, currency)}</span>
      {open && <ConversionPopover data={conversion} align="right" onClose={() => setOpen(false)} />}
    </div>
  );
}

/* Compact price/reward chip shown next to the product title */
function PriceChip({ label, amount, currency, color, conversion }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
          padding: "4px 10px", borderRadius: 10, background: "var(--bg-surface-hover)",
          border: "1px solid var(--border-subtle)", cursor: conversion ? "pointer" : "default",
        }}
        onClick={() => conversion && setOpen(v => !v)}
      >
        <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{formatPrice(amount, currency)}</span>
      </div>
      {open && <ConversionPopover data={conversion} align="right" onClose={() => setOpen(false)} />}
    </div>
  );
}

function Avatar({ name, src, size = 52 }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "var(--bg-surface-hover)", border: "1px solid var(--border-subtle)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-secondary)", fontSize: 18, fontWeight: 700,
    }}>
      {src && !failed ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setFailed(true)} />
      ) : initial}
    </div>
  );
}

/* Gallery: smaller by default, click to view full-size in a lightbox */
function Gallery({ images = [], alt }) {
  const list = images.length ? images : [PLACEHOLDER_IMAGE];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div>
      <div
        onClick={() => setLightbox(true)}
        style={{
          width: 120,
          height: 120,
          borderRadius: 14,
          background: "var(--bg-surface-hover)", border: "1px solid var(--border-subtle)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-in",
        }}
      >
        <img
          src={list[active]} alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
        />
      </div>
      {list.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0, overflow: "hidden", padding: 0,
                border: i === active ? "2px solid var(--success, #0d9488)" : "1px solid var(--border-subtle)",
                cursor: "pointer", background: "var(--bg-surface-hover)",
              }}
            >
              <img
                src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
              />
            </button>
          ))}
        </div>
      )}

      <Modal open={lightbox} onClose={() => setLightbox(false)} tight>
        <img
          src={list[active]} alt={alt}
          style={{ maxWidth: "92vw", maxHeight: "84vh", display: "block", borderRadius: 8, objectFit: "contain" }}
          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
        />
      </Modal>
    </div>
  );
}

/* Shared button styles for confirm modals */
const cancelBtn = {
  padding: "8px 16px", borderRadius: 999, border: "1px solid var(--border-subtle)",
  background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontWeight: 600,
};
const confirmBtn = (color, busy) => ({
  padding: "8px 16px", borderRadius: 999, border: "none",
  background: color, color: "#fff", fontWeight: 700,
  cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
});

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, loading, error, refetch } = useOrderDetail(orderId);
  const { offerExists, loading: offerCheckLoading, refetchOfferCheck } = useCheckOffer(orderId);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  // three-dots menu state
  const [activityOpen, setActivityOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const { busy, error: actionError, clearError, deleteOrder, refundOrder } = useOrderActions(orderId);
  const { logs, loading: logsLoading, error: logsError } = useOrderActivityLog(orderId, activityOpen);

  // Is this my own order? Compare the stored user_id with the order owner's id.
  const currentUserId = getCurrentUserId();
  const isMine =
    !!order &&
    currentUserId !== null &&
    order.owner?.id !== undefined &&
    String(order.owner.id) === String(currentUserId);

  // Change Order Status stays disabled while my own order is still OPEN
  const isOpen = order?.status?.status_name?.toUpperCase() === "OPEN";

  // Make an Offer only for OPEN orders that are not mine
  const canMakeOffer = !!order && !isMine && isOpen;

  // ASSUMPTION: "verified" = payment status is VERIFIED
  const isVerified = order?.payment?.status?.toUpperCase() === "VERIFIED";

  const handleShare = async () => {
    const url = `${window.location.origin}/orders/${orderId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: order?.product_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder();
      navigate("/orders", { replace: true });
    } catch {
      /* error shown in modal */
    }
  };

  const handleRefund = async () => {
    try {
      await refundOrder();
      setRefundOpen(false);
      refetch();
    } catch {
      /* error shown in modal */
    }
  };

  const menuItems = [
    { key: "edit", label: "Edit order", onClick: () => navigate(`/orders/${orderId}/edit`) },
    { key: "refund", label: "Refund order", show: isVerified, onClick: () => { clearError(); setRefundOpen(true); } },
    { key: "log", label: "Activity log", onClick: () => setActivityOpen(true) },
    { key: "share", label: "Share order", onClick: handleShare },
    { key: "delete", label: "Delete order", danger: true, onClick: () => { clearError(); setDeleteOpen(true); } },
  ];

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 32, width: "100%" }}>
      {/* Top bar: back + three dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {shareMsg && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{shareMsg}</span>}
          {order && <OrderMenu items={menuItems} />}
        </div>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: 12,
          padding: "14px 18px", color: "var(--danger)", fontSize: 14, marginBottom: 16, width: "100%",
        }}>
          <span>{error}</span>
          <button
            onClick={refetch}
            style={{
              padding: "6px 16px", borderRadius: 999, border: "1px solid var(--danger)",
              background: "transparent", color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <DetailSkeleton />
      ) : !order ? (
        !error && (
          <div style={{
            background: "var(--bg-surface)", borderRadius: 14, padding: "48px 20px",
            textAlign: "center", color: "var(--text-muted)", fontSize: 15,
            border: "1px solid var(--border-subtle)", width: "100%",
          }}>
            Order not found
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Gallery images={order.images} alt={order.product_name} />

          {/* Title + price/reward + badges */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {order.product_name}
                </h1>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>#{order.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <PriceChip
                  label="Price"
                  amount={order.display_price}
                  currency={order.display_currency}
                  color="var(--text-primary)"
                  conversion={order.price_conversion_details}
                />
                <PriceChip
                  label="Reward"
                  amount={order.display_reward}
                  currency={order.display_currency}
                  color="var(--success, #0d9488)"
                  conversion={order.reward_conversion_details}
                />
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 10px" }}>
              Valid till {formatDate(order.validity)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <StatusBadge status={order.status?.status_name} />
              <TypePill type={order.type} />
              <PaymentPill status={order.payment?.status} />
            </div>
          </div>

          {order.description && (
            <Section title="Description">
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                {order.description}
              </p>
            </Section>
          )}

          <Section title="Route">
            <RouteConnector
              fromCode={order.from_country?.icon_base_path} from={order.from_country?.name}
              toCode={order.to_country?.icon_base_path}     to={order.to_country?.name}
            />
            {(order.from_city?.name || order.to_city?.name) && (
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "10px 0 0" }}>
                {order.from_city?.name} → {order.to_city?.name}
              </p>
            )}
          </Section>

          <Section
            title="Product Details"
            action={order.check_list?.length > 0 && (
              <button
                onClick={() => setChecklistOpen(true)}
                style={{
                  fontSize: 12.5, fontWeight: 600, color: "var(--success, #0d9488)",
                  background: "transparent", border: "1px solid var(--success, #0d9488)",
                  borderRadius: 999, padding: "4px 12px", cursor: "pointer",
                }}
              >
                View Checklist
              </button>
            )}
          >
            <InfoRow label="Quantity" value={order.quantity} />
            <InfoRow label="Category" value={order.category?.map(c => c.name).join(", ")} />
            <InfoRow label="If not available" value={order.if_not_available?.replaceAll("_", " ")} />
            <InfoRow label="Packed with box" value={order.with_box ? "Yes" : "No"} />
            <InfoRow label="Weight" value={order.weight} />
            {(order.length_in && order.width_in && order.height_in) && (
              <InfoRow label="Dimensions" value={`${order.length_in} × ${order.width_in} × ${order.height_in} in`} />
            )}
            <InfoRow
              label="Product URL"
              value={order.url && (
                <a href={order.url} target="_blank" rel="noreferrer" style={{ color: "var(--success, #0d9488)" }}>
                  {order.url}
                </a>
              )}
            />
          </Section>

          {order.owner && (
            <Section title="Order Owner">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={order.owner.name} src={order.owner.image} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {order.owner.name}
                    </p>
                    {order.owner.about && (
                      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {order.owner.about}
                      </p>
                    )}
                  </div>
                </div>
                {!isMine && (
                  <ChatButton
                    orderId={order.id}
                    userId={order.owner.id}
                    name={order.owner.name}
                    email={order.owner.email}
                    image={order.owner.image}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Not mine + OPEN     -> Make an Offer / View Offer
              Mine + OPEN         -> Track Order (faded, disabled)
              Mine + not OPEN     -> Track Order
              Not mine + not OPEN -> Change Order Status
              Both non-offer buttons open the Track screen. */}
          {!canMakeOffer ? (
            <button
              onClick={() => navigate(`/orders/${order.id}/track`)}
              disabled={isOpen}
              title={isOpen ? "Available once the order is assigned" : undefined}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 999, border: "none",
                background: "var(--success, #0d9488)", color: "#fff",
                fontSize: 14.5, fontWeight: 700,
                cursor: isOpen ? "not-allowed" : "pointer",
                opacity: isOpen ? 0.45 : 1,
                filter: isOpen ? "grayscale(0.4)" : "none",
              }}
            >
              {isMine ? "Track Order" : "Change Order Status"}
            </button>
          ) : (
            <button
              onClick={() => (offerExists ? navigate(`/offers?order_id=${order.id}`) : setOfferOpen(true))}
              disabled={offerCheckLoading}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 999, border: "none",
                background: "var(--success, #0d9488)", color: "#fff",
                fontSize: 14.5, fontWeight: 700,
                cursor: offerCheckLoading ? "not-allowed" : "pointer",
                opacity: offerCheckLoading ? 0.6 : 1,
              }}
            >
              {offerExists ? "View Offer" : "Make an Offer"}
            </button>
          )}

          {/* Checklist */}
          <Modal open={checklistOpen} onClose={() => setChecklistOpen(false)}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px" }}>
              Checklist
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {order.check_list?.map((item, i) => (
                <li key={i} style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{item}</li>
              ))}
            </ul>
          </Modal>

          {/* Activity log */}
          <Modal open={activityOpen} onClose={() => setActivityOpen(false)}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px" }}>
              Activity Log
            </p>
            {logsLoading && <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Loading…</p>}
            {logsError && <p style={{ fontSize: 13.5, color: "var(--danger)", margin: 0 }}>{logsError}</p>}
            {!logsLoading && !logsError && logs.length === 0 && (
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>No activity yet</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
              {logs.map((l, i) => (
                <div key={l.id ?? i} style={{ paddingBottom: 10, borderBottom: "1px solid var(--bg-surface-hover)" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                    {l.action || l.title || l.message || l.description}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
                    {[l.user?.name || l.performed_by, l.created_at && formatDate(l.created_at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Modal>

          {/* Refund */}
          <Modal open={refundOpen} onClose={() => !busy && setRefundOpen(false)}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Refund order?
            </p>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px" }}>
              This will refund the verified payment for order #{order.id}.
            </p>
            {actionError && <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{actionError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setRefundOpen(false)} disabled={busy} style={cancelBtn}>Cancel</button>
              <button onClick={handleRefund} disabled={busy} style={confirmBtn("var(--success, #0d9488)", busy)}>
                {busy ? "Refunding…" : "Refund"}
              </button>
            </div>
          </Modal>

          {/* Delete */}
          <Modal open={deleteOpen} onClose={() => !busy && setDeleteOpen(false)}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Delete order?
            </p>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px" }}>
              This can't be undone.
            </p>
            {actionError && <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{actionError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteOpen(false)} disabled={busy} style={cancelBtn}>Cancel</button>
              <button onClick={handleDelete} disabled={busy} style={confirmBtn("var(--danger)", busy)}>
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Modal>

          {canMakeOffer && (
            <MakeOfferModal
              open={offerOpen}
              onClose={() => setOfferOpen(false)}
              order={order}
              onSuccess={() => {
                refetch();
                refetchOfferCheck();
                setOfferOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}