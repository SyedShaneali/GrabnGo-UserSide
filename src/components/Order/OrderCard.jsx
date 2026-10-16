import { useState } from "react";
import RouteConnector from "./RouteConnector";
import { ConversionPopover, IButton, formatPrice } from "../ConversionPopOver";
import StatusBadge from "../common/StatusBadge";
import { TypePill, PaymentPill, formatDate, PLACEHOLDER_IMAGE } from "../Order/OrderMeta";

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

function AmountBox({ label, amount, currency, color, conversion, align, right, popoverKey, openKey, setOpenKey }) {
  const open = openKey === popoverKey;

  return (
    <div
      style={{ position: "relative", minWidth: 0, textAlign: right ? "right" : "left" }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: right ? "flex-end" : "flex-start", gap: 6 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{label}</p>
        {conversion && (
          <IButton onClick={e => { e.stopPropagation(); setOpenKey(open ? null : popoverKey); }} />
        )}
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color, margin: "3px 0 0", whiteSpace: "nowrap" }}>
        {formatPrice(amount, currency)}
      </p>
      {open && (
        <ConversionPopover data={conversion} align={align} onClose={() => setOpenKey(null)} />
      )}
    </div>
  );
}

/* ── Desktop row (lg and up) ── */
function DesktopRow({ order, onView, openKey, setOpenKey }) {
  const currency = order.display_currency || "Rs";

  return (
    <div
      onClick={() => onView && onView(order)}
      className="hidden lg:flex"
      style={{
        alignItems: "center", background: "var(--bg-surface)",
        borderRadius: 14, border: "1px solid var(--border-subtle)",
        minHeight: 76, minWidth: 1100, overflow: "visible",
        cursor: onView ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,128,128,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 10, background: "var(--bg-surface-hover)",
        flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center",
        justifyContent: "center", border: "1px solid var(--border-subtle)", margin: "0 14px",
      }}>
        <img
          src={order.images?.[0] || PLACEHOLDER_IMAGE} alt={order.product_name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
        />
      </div>

      <div style={{ width: 210, flexShrink: 0, paddingRight: 12 }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4,
          display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {order.product_name}
        </span>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "3px 0 6px" }}>
          Valid till {formatDate(order.validity)}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <TypePill type={order.type} />
          <PaymentPill status={order.payment?.status} />
        </div>
      </div>

      <VDivider />

      <RouteConnector
        fromCode={order.from_country?.icon_base_path} from={order.from_country?.name}
        toCode={order.to_country?.icon_base_path}     to={order.to_country?.name}
      />

      <VDivider />

      <div style={{ width: 160, flexShrink: 0, padding: "0 16px" }}>
        <AmountBox
          label="Product Price"
          amount={order.display_price}
          currency={currency}
          color="var(--text-primary)"
          conversion={order.price_conversion_details}
          align="left"
          popoverKey="price"
          openKey={openKey}
          setOpenKey={setOpenKey}
        />
      </div>

      <VDivider />

      <div style={{ width: 170, flexShrink: 0, padding: "0 16px" }}>
        <AmountBox
          label="Delivery Reward"
          amount={order.display_reward}
          currency={currency}
          color="var(--success, #0d9488)"
          conversion={order.reward_conversion_details}
          align="right"
          right
          popoverKey="reward"
          openKey={openKey}
          setOpenKey={setOpenKey}
        />
      </div>

      <VDivider />

      <div style={{ width: 130, flexShrink: 0, textAlign: "center", padding: "0 12px" }}>
        <StatusBadge status={order.status?.status_name} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>#{order.id}</p>
      </div>
    </div>
  );
}

/* ── Mobile / tablet card (below lg) ── */
function MobileCard({ order, onView, openKey, setOpenKey }) {
    console.log("thsi is my order", order);
  const currency    = order.display_currency || "Rs";
  const extraImages = (order.images?.length ?? 0) - 1;

  return (
    <div
      onClick={() => onView && onView(order)}
      className="flex lg:hidden flex-col"
      style={{
        background: "var(--bg-surface)", borderRadius: 16,
        border: "1px solid var(--border-subtle)", padding: 12, gap: 10,
        cursor: onView ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{
          position: "relative", width: 56, height: 56, borderRadius: 10,
          background: "var(--bg-surface-hover)", flexShrink: 0, overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}>
          <img
            src={order.images?.[0] || PLACEHOLDER_IMAGE} alt={order.product_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
          />
          {extraImages > 0 && (
            <span style={{
              position: "absolute", right: 3, bottom: 3, fontSize: 9.5, fontWeight: 700,
              color: "#fff", background: "rgba(0,0,0,0.6)", borderRadius: 999, padding: "1px 5px",
            }}>
              +{extraImages}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
            }}>
              {order.product_name}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, fontWeight: 600, paddingTop: 3 }}>
              #{order.id}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 6px" }}>
            Valid till {formatDate(order.validity)}
          </p>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <StatusBadge status={order.status?.status_name} />
            <TypePill type={order.type} />
            <PaymentPill status={order.payment?.status} />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div onClick={e => e.stopPropagation()}>
        <RouteConnector
          compact
          fromCode={order.from_country?.icon_base_path} from={order.from_country?.name}
          toCode={order.to_country?.icon_base_path}     to={order.to_country?.name}
        />
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px" }}>
          <AmountBox
            label="Product Price"
            amount={order.display_price}
            currency={currency}
            color="var(--text-primary)"
            conversion={order.price_conversion_details}
            align="left"
            popoverKey="m-price"
            openKey={openKey}
            setOpenKey={setOpenKey}
          />
        </div>
        <div style={{ background: "var(--bg-surface-hover)", borderRadius: 10, padding: "8px 10px" }}>
          <AmountBox
            label="Delivery Reward"
            amount={order.display_reward}
            currency={currency}
            color="var(--success, #0d9488)"
            conversion={order.reward_conversion_details}
            align="right"
            popoverKey="m-reward"
            openKey={openKey}
            setOpenKey={setOpenKey}
          />
        </div>
      </div>
    </div>
  );
}

export default function OrderCard({ order, onView }) {
  // Only one conversion popover open at a time, shared between the desktop
  // row and mobile card since only one of the two is ever rendered/visible.
  const [openKey, setOpenKey] = useState(null);

  return (
    <>
      <DesktopRow order={order} onView={onView} openKey={openKey} setOpenKey={setOpenKey} />
      <MobileCard order={order} onView={onView} openKey={openKey} setOpenKey={setOpenKey} />
    </>
  );
}