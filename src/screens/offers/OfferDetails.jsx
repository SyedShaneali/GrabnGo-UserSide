import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import OfferStatusBadge from "../../components/Offer/OfferStatusBadge";
import { ConversionPopover, IButton, formatPrice } from "../../components/ConversionPopOver";
import { PaymentPill, formatDate, PLACEHOLDER_IMAGE } from "../../components/Order/OrderMeta";
import RouteConnector from "../../components/Order/RouteConnector";
import Modal from "../../components/common/Modal";
import { useUpdateOfferStatus } from "../../hooks/useUpdateOfferStatus";

/* ── Small pieces (mirrors OrderDetails.jsx) ── */
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

function PriceRow({ label, amount, currency, color, conversion, icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--bg-surface-hover)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
        {conversion && <IButton onClick={() => setOpen(v => !v)} />}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 5 }}>
        {icon} {formatPrice(amount, currency)}
      </span>
      {open && <ConversionPopover data={conversion} align="right" onClose={() => setOpen(false)} />}
    </div>
  );
}

function PriceChip({ label, amount, currency, color, conversion, icon }) {
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
        <span style={{ fontSize: 14, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 4 }}>
          {icon} {formatPrice(amount, currency)}
        </span>
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

function StarRating({ rating }) {
  const value = Number(rating) || 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, color: "#B45309", fontWeight: 700 }}>
      {value.toFixed(1)}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B">
        <path d="M12 2l2.9 6.26 6.9.6-5.2 4.53 1.57 6.77L12 16.9l-6.17 3.26 1.57-6.77L2.2 8.86l6.9-.6z" />
      </svg>
    </span>
  );
}

function TravelerVerificationBadge({ status }) {
  const s = (status || "UNVERIFIED").toUpperCase();

  const config = {
    VERIFIED:   { bg: "#DCFCE7", color: "#15803D", label: "Verified",   icon: "✓" },
    PENDING:    { bg: "#FEF3C7", color: "#B45309", label: "Pending",    icon: "…" },
    REJECTED:   { bg: "#FEE2E2", color: "#B91C1C", label: "Rejected",   icon: "✕" },
    UNVERIFIED: { bg: "#FEE2E2", color: "#B91C1C", label: "Unverified", icon: "✕" },
  }[s] || { bg: "#F1F5F9", color: "var(--text-muted)", label: s, icon: "" };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      background: config.bg, color: config.color,
      fontSize: 12, fontWeight: 700,
    }}>
      {config.icon} {config.label}
    </span>
  );
}

function Gallery({ images = [], alt }) {
  const list = images.length ? images : [PLACEHOLDER_IMAGE];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div>
      <div
        onClick={() => setLightbox(true)}
        style={{
          width: 120, height: 120, borderRadius: 14,
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
                border: i === active ? "2px solid #0D9488" : "1px solid var(--border-subtle)",
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

export default function OfferDetails() {
  useParams(); // kept for URL consistency (e.g. /offers/:id) even though data comes from route state
  const navigate = useNavigate();
  const location = useLocation();

  // No single-offer endpoint exists yet — the full offer object is passed
  // via navigate(path, { state: { offer, isReceived } }) from Offers.jsx.
  // Landing here directly (refresh/deep link) has no offer to show.
  const offer = location.state?.offer;
  console.log('offer', offer);
  const isReceived = location.state?.isReceived ?? false;

  const [localStatus, setLocalStatus] = useState(offer?.status);
  const { updateStatus, updating, error: statusError } = useUpdateOfferStatus();

  if (!offer) {
    return (
      <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 32, width: "100%" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div style={{
          background: "var(--bg-surface)", borderRadius: 14, padding: "48px 20px",
          textAlign: "center", color: "var(--text-muted)", fontSize: 15,
          border: "1px solid var(--border-subtle)", width: "100%",
        }}>
          Offer details aren't available — go back to your offers list and open it from there.
        </div>
      </div>
    );
  }

  const { order, other_user, price_conversion_details, id, created_at } = offer;

  const offerAmount = offer.display_amount;
  const offerCurrency = offer.display_currency || offer.amount_currency || "Rs";

  const rewardAmount = order?.display_reward;
  const rewardCurrency = order?.display_currency || "Rs";

  const offerExceedsReward = Number(offerAmount) > Number(rewardAmount);
  const offerAmountColor = offerExceedsReward ? "#F04438" : "#0D9488";

  const showActions = isReceived && localStatus === "PENDING";
  const showWithdraw = !isReceived && localStatus === "PENDING";

  console.log("showwithdraw", showWithdraw);

  // Accept/Reject/Withdraw now hit the real PUT /offer/{id}/update-status
  // endpoint. Local status only flips after the request succeeds.
  const handleAccept = async () => {
    try {
      await updateStatus(id, "ACCEPTED");
      setLocalStatus("ACCEPTED");
    } catch {
      // statusError already holds the message, shown near the actions below
    }
  };

  const handleReject = async () => {
    try {
      await updateStatus(id, "REJECTED");
      setLocalStatus("REJECTED");
    } catch {
      // statusError already holds the message, shown near the actions below
    }
  };

  const handleWithdraw = async () => {
    try {
      await updateStatus(id, "WITHDRAW");
      setLocalStatus("WITHDRAW");
    } catch {
      // statusError already holds the message, shown near the actions below
    }
  };

  return (
    <div className="px-4 sm:px-6" style={{ paddingTop: 20, paddingBottom: 32, width: "100%" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

        {/* ── Offer header: status + amount + reward ── */}
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Offer #{id}
              </h1>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 0" }}>
                {isReceived ? "Received" : "Sent"} · {formatDate(created_at)}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <PriceChip
                label="Offer Amount"
                amount={offerAmount}
                currency={offerCurrency}
                color={offerAmountColor}
                conversion={price_conversion_details}
              />
              <PriceChip
                label="Reward"
                amount={rewardAmount}
                currency={rewardCurrency}
                color="#0D9488"
                conversion={order?.reward_conversion_details}
                icon="🎁"
              />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <OfferStatusBadge status={localStatus} />
          </div>
        </div>

        {/* ── Other user ── */}
        <Section title={isReceived ? "Offer From" : "Offer To"}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={other_user?.name} src={other_user?.image} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {other_user?.name}
                </p>
                <StarRating rating={other_user?.average_rating} />
              </div>
              {other_user?.location && (
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {other_user.location}
                </p>
              )}
              {other_user?.about && (
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {other_user.about}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Order this offer is for ── */}
        <Section title="Order">
          <div style={{ display: "flex", gap: 14 }}>
            <Gallery images={order?.images} alt={order?.product_name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {order?.product_name}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 10px", fontWeight: 600 }}>
                #{order?.id}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <PriceChip
                  label="Price" amount={order?.display_price} currency={order?.display_currency}
                  color="var(--text-primary)" conversion={order?.price_conversion_details}
                />
                <PriceChip
                  label="Reward" amount={order?.display_reward} currency={order?.display_currency}
                  color="#0D9488" conversion={order?.reward_conversion_details} icon="🎁"
                />
              </div>
              {order?.payment?.status && <PaymentPill status={order.payment.status} />}
              {order?.validity && (
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "8px 0 0" }}>
                  Valid till {formatDate(order.validity)}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Route ── */}
        <Section title="Route">
          <RouteConnector
            fromCode={order?.from_country?.icon_base_path} from={order?.from_country?.name}
            toCode={order?.to_country?.icon_base_path}     to={order?.to_country?.name}
          />
          {(order?.from_city?.name || order?.to_city?.name) && (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "10px 0 0" }}>
              {order?.from_city?.name} → {order?.to_city?.name}
            </p>
          )}
        </Section>

        {/* ── Traveler / itinerary, when this offer came with a travel plan attached ── */}
        {offer.travel && (
          <Section
            title="Traveler & Itinerary"
            action={<TravelerVerificationBadge status={offer.travel.travel_verification?.status} />}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar name={offer.travel.traveler?.name} src={offer.travel.traveler?.image} size={40} />
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {offer.travel.traveler?.name}
                </p>
                <StarRating rating={offer.travel.traveler?.average_rating} />
              </div>
            </div>
            <InfoRow label="Trip type" value={offer.travel.trip_type} />
            {offer.travel.itineraries?.map((leg, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < offer.travel.itineraries.length - 1 ? "1px solid var(--bg-surface-hover)" : "none" }}>
                <RouteConnector
                  compact
                  fromCode={leg.from_country?.icon_base_path} from={leg.from_country?.name}
                  toCode={leg.to_country?.icon_base_path}     to={leg.to_country?.name}
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>
                  {leg.from_city?.name} → {leg.to_city?.name} · Travel date {formatDate(leg.travel_date)}
                </p>
              </div>
            ))}
          </Section>
        )}

        {/* ── Offer amount breakdown ── */}
        <Section title="Offer Amount">
          <PriceRow
            label="Amount" amount={offerAmount} currency={offerCurrency}
            color={offerAmountColor} conversion={price_conversion_details}
          />
          <PriceRow
            label="Reward" amount={rewardAmount} currency={rewardCurrency}
            color="#0D9488" conversion={order?.reward_conversion_details} icon="🎁"
          />
        </Section>

        {statusError && (
          <p style={{ fontSize: 12.5, color: "var(--danger)", margin: 0 }}>{statusError}</p>
        )}

        {/* ── Actions ── */}
        {(showActions || showWithdraw) && (
          <div style={{ display: "flex", gap: 10 }}>
            {showActions && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={updating}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 999, border: "none",
                    background: "#0D9488", color: "#fff", fontSize: 14.5, fontWeight: 700,
                    cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                  }}
                >
                  {updating ? "Please wait…" : "Accept Offer"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 999, border: "1.5px solid var(--danger)",
                    background: "transparent", color: "var(--danger)", fontSize: 14.5, fontWeight: 700,
                    cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                  }}
                >
                  {updating ? "Please wait…" : "Reject Offer"}
                </button>
              </>
            )}
            {showWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={updating}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 999, border: "1.5px solid #0D9488",
                  background: "transparent", color: "#0D9488", fontSize: 14.5, fontWeight: 700,
                  cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.6 : 1,
                }}
              >
                {updating ? "Withdrawing…" : "Withdraw Offer"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}