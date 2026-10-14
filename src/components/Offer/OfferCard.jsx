import { useState } from "react";
import RouteConnector from "../Order/RouteConnector";
import { ConversionPopover, IButton, formatPrice } from "../ConversionPopOver";
import { formatDate, PLACEHOLDER_IMAGE } from "../Order/OrderMeta";
import OfferStatusBadge from "./OfferStatusBadge";

function VDivider() {
  return (
    <div
      className="hidden lg:block"
      style={{
        width: 1, alignSelf: "stretch", background: "var(--border-subtle)",
        flexShrink: 0, margin: "10px 0",
      }}
    />
  );
}

function StarRating({ rating }) {
  const value = Number(rating) || 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11.5, color: "#B45309", fontWeight: 700 }}>
      {value.toFixed(1)}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" style={{ marginLeft: 1 }}>
        <path d="M12 2l2.9 6.26 6.9.6-5.2 4.53 1.57 6.77L12 16.9l-6.17 3.26 1.57-6.77L2.2 8.86l6.9-.6z" />
      </svg>
    </span>
  );
}

function PaymentStatusDot({ paymentStatus }) {
  const isVerified = paymentStatus === "VERIFIED";
  return (
    <div
      style={{
        position: "absolute", bottom: -3, right: -3,
        width: 17, height: 17, borderRadius: "50%",
        background: isVerified ? "#22C55E" : "#F04438",
        border: "2px solid var(--bg-surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
        {isVerified ? <polyline points="20 6 9 17 4 12" /> : (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        )}
      </svg>
    </div>
  );
}

function AmountBox({ label, amount, currency, conversion, align, right, open, onToggle, color = "#0D9488", icon }) {
  return (
    <div
      style={{ position: "relative", minWidth: 0, textAlign: right ? "right" : "left" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: right ? "flex-end" : "flex-start", gap: 6 }}>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>{label}</p>
        {conversion && <IButton onClick={(e) => { e.stopPropagation(); onToggle(); }} />}
      </div>
      <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 15, fontWeight: 800, color, margin: "3px 0 0", whiteSpace: "nowrap", justifyContent: right ? "flex-end" : "flex-start" }}>
        {icon} {formatPrice(amount, currency)}
      </p>
      {open && <ConversionPopover data={conversion} align={align} onClose={() => onToggle(false)} />}
    </div>
  );
}

/* ── Desktop row ── */
// ⭐ REMOVED — Accept/Reject/Withdraw buttons and their column. Actions now
// only live on OfferDetails; clicking the row already navigates there.
function DesktopRow({ offer, onView, popoverOpen, setPopoverOpen }) {
  const { order, other_user, status, id, created_at } = offer;

  const offerAmount = offer.display_amount;
  const offerCurrency = offer.display_currency || offer.amount_currency || "Rs";

  const rewardAmount = order?.display_reward;
  const rewardCurrency = order?.display_currency || "Rs";

  const offerExceedsReward = Number(offerAmount) > Number(rewardAmount);
  const offerAmountColor = offerExceedsReward ? "#F04438" : "#0D9488";

  return (
    <div
      onClick={() => onView && onView(offer)}
      className="hidden lg:flex"
      style={{
        alignItems: "center", background: "var(--bg-surface)",
        borderRadius: 16, border: "1px solid var(--border-subtle)",
        minHeight: 76, minWidth: 1050, cursor: onView ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#0D9488";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,148,136,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ position: "relative", width: 56, height: 56, margin: "0 14px", flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: "var(--bg-surface-hover)",
          overflow: "hidden", border: "1px solid var(--border-subtle)",
        }}>
          <img
            src={order?.images?.[0] || PLACEHOLDER_IMAGE} alt={order?.product_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
          />
        </div>
        <PaymentStatusDot paymentStatus={order?.payment?.status} />
      </div>

      <div style={{ width: 200, flexShrink: 0, paddingRight: 12 }}>
        <span style={{
          fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4,
          display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {order?.product_name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <img
            src={other_user?.image || PLACEHOLDER_IMAGE} alt={other_user?.name}
            style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
          />
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>{other_user?.name}</span>
          <StarRating rating={other_user?.average_rating} />
        </div>
      </div>

      <VDivider />

      <RouteConnector
        fromCode={order?.from_country?.icon_base_path} from={order?.from_country?.name}
        toCode={order?.to_country?.icon_base_path} to={order?.to_country?.name}
      />

      <VDivider />

      <div style={{ width: 160, flexShrink: 0, padding: "0 16px" }}>
        <AmountBox
          label="Offer Amount" amount={offerAmount} currency={offerCurrency}
          conversion={offer.price_conversion_details} align="left"
          open={popoverOpen === "offer"} onToggle={() => setPopoverOpen((o) => (o === "offer" ? null : "offer"))}
          color={offerAmountColor}
        />
      </div>

      <VDivider />

      <div style={{ width: 160, flexShrink: 0, padding: "0 16px" }}>
        <AmountBox
          label="Reward" amount={rewardAmount} currency={rewardCurrency}
          conversion={order?.reward_conversion_details} align="left"
          open={popoverOpen === "reward"} onToggle={() => setPopoverOpen((o) => (o === "reward" ? null : "reward"))}
          color="#0D9488"
          icon="🎁"
        />
      </div>

      <VDivider />

      <div style={{ width: 130, flexShrink: 0, textAlign: "center", padding: "0 12px" }}>
        <OfferStatusBadge status={status} />
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "5px 0 0", fontWeight: 600 }}>#{id}</p>
      </div>

      <VDivider />

      <div style={{ width: 110, flexShrink: 0, textAlign: "center", padding: "0 12px" }}>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>{formatDate(created_at)}</p>
      </div>
    </div>
  );
}

/* ── Mobile / tablet card ── */
function MobileCard({ offer, onView, popoverOpen, setPopoverOpen }) {
  const { order, other_user, status, id, created_at } = offer;

  const offerAmount = offer.display_amount;
  const offerCurrency = offer.display_currency || offer.amount_currency || "Rs";

  const rewardAmount = order?.display_reward;
  const rewardCurrency = order?.display_currency || "Rs";

  const offerExceedsReward = Number(offerAmount) > Number(rewardAmount);
  const offerAmountColor = offerExceedsReward ? "#F04438" : "#0D9488";

  return (
    <div
      onClick={() => onView && onView(offer)}
      className="flex lg:hidden flex-col"
      style={{
        background: "var(--bg-surface)", borderRadius: 18,
        border: "1px solid var(--border-subtle)", padding: 12, gap: 10,
        cursor: onView ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: "var(--bg-surface-hover)",
            overflow: "hidden", border: "1px solid var(--border-subtle)",
          }}>
            <img
              src={order?.images?.[0] || PLACEHOLDER_IMAGE} alt={order?.product_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
            />
          </div>
          <PaymentStatusDot paymentStatus={order?.payment?.status} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <span style={{
              fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
            }}>
              {order?.product_name}
            </span>
            <OfferStatusBadge status={status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 6px" }}>
            <img
              src={other_user?.image || PLACEHOLDER_IMAGE} alt={other_user?.name}
              style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }}
              onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{other_user?.name}</span>
            <StarRating rating={other_user?.average_rating} />
          </div>
          <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>
            #{id} · {formatDate(created_at)}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div onClick={(e) => e.stopPropagation()}>
        <RouteConnector
          compact
          fromCode={order?.from_country?.icon_base_path} from={order?.from_country?.name}
          toCode={order?.to_country?.icon_base_path} to={order?.to_country?.name}
        />
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 12, padding: "9px 12px" }}>
          <AmountBox
            label="Offer Amount" amount={offerAmount} currency={offerCurrency}
            conversion={offer.price_conversion_details} align="left"
            open={popoverOpen === "offer"} onToggle={() => setPopoverOpen((o) => (o === "offer" ? null : "offer"))}
            color={offerAmountColor}
          />
        </div>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 12, padding: "9px 12px" }}>
          <AmountBox
            label="Reward" amount={rewardAmount} currency={rewardCurrency}
            conversion={order?.reward_conversion_details} align="right" right
            open={popoverOpen === "reward"} onToggle={() => setPopoverOpen((o) => (o === "reward" ? null : "reward"))}
            color="#0D9488"
            icon="🎁"
          />
        </div>
      </div>
    </div>
  );
}

export default function OfferCard({ offer, onView }) {
  const [popoverOpen, setPopoverOpen] = useState(null);

  return (
    <>
      <DesktopRow offer={offer} onView={onView} popoverOpen={popoverOpen} setPopoverOpen={setPopoverOpen} />
      <MobileCard offer={offer} onView={onView} popoverOpen={popoverOpen} setPopoverOpen={setPopoverOpen} />
    </>
  );
}