import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConversionPopover, IButton, formatPrice } from "../../components/ConversionPopOver";
import { formatDate } from "../../components/Order/OrderMeta";
import RouteConnector from "../../components/Order/RouteConnector";
import OfferCard from "../../components/Offer/OfferCard"; // ⚠️ adjust to wherever OfferCard.jsx lives
import TravelStatusBadge from "../../components/Travel/TravelStatusBadge"; // ⚠️ adjust to wherever this lives
import { useTravelDetail } from "../../hooks/useTravelDetails";
import { useTravelOffers } from "../../hooks/useTravelOffers";

// ⚠️ adjust to your real OfferDetails route
const offerDetailsPath = (offerId) => `/offers/${offerId}`;

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
        <div style={{ ...pulse, height: 70, width: "100%" }} />
        <div style={{ ...pulse, height: 20, width: "40%" }} />
        <div style={{ ...pulse, height: 100, width: "100%" }} />
        <div style={{ ...pulse, height: 100, width: "100%" }} />
      </div>
    </>
  );
}

/* Small inline skeleton for the offers list while it's loading */
function OffersListSkeleton() {
  const pulse = {
    background: "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 16,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...pulse, height: 76, width: "100%" }} />
      <div style={{ ...pulse, height: 76, width: "100%" }} />
    </div>
  );
}

/* ── Small pieces (same as OrderDetails.jsx) ── */
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

/* ── Verification documents ──
   travel_verification.images are plain URLs (pre-signed S3 links with query
   strings), so image/pdf detection has to strip the query string before
   checking the extension. */
function getFileNameFromUrl(url) {
  try {
    var path = new URL(url).pathname;
    var parts = path.split("/");
    var last = parts[parts.length - 1] || "Document";
    return decodeURIComponent(last);
  } catch (e) {
    return "Document";
  }
}

function isImageUrl(url) {
  var path = url.split("?")[0];
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(path);
}

var docThumbStyle = {
  width: 96,
  height: 96,
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  padding: "0 6px",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-page)",
  textDecoration: "none",
};

var docThumbImgStyle = { width: "100%", height: "100%", objectFit: "cover" };

var docThumbNameStyle = {
  fontSize: 10,
  fontWeight: 600,
  textAlign: "center",
  lineHeight: 1.2,
  color: "var(--text-secondary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
};

function VerificationThumbImage(props) {
  return <img src={props.url} alt={props.name} style={docThumbImgStyle} />;
}

function VerificationThumbFile(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span style={docThumbNameStyle}>{props.name}</span>
    </div>
  );
}

function VerificationThumb(props) {
  var url = props.url;
  var isImage = isImageUrl(url);
  var name = getFileNameFromUrl(url);
  var inner = isImage ? <VerificationThumbImage url={url} name={name} /> : <VerificationThumbFile name={name} />;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={docThumbStyle}>
      {inner}
    </a>
  );
}

function VerificationDocuments({ verification }) {
  var images = (verification && verification.images) || [];
  if (images.length === 0) return null;

  var showRejection = verification.status === "REJECTED" && verification.rejection_reason;

  return (
    <Section title="Verification Documents">
      {showRejection && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 12, background: "var(--danger-bg)", border: "1px solid var(--danger)" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--danger)", margin: 0 }}>Rejection reason</p>
          <p style={{ fontSize: 13, color: "var(--danger)", margin: "3px 0 0" }}>{verification.rejection_reason}</p>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {images.map((url, i) => (
          <VerificationThumb key={i} url={url} />
        ))}
      </div>
    </Section>
  );
}

/* ── Offers Summary (tabs with icons, backed by the API) ── */
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// `key` is only the tab id used in the UI.
// `statuses` are the exact (UPPERCASE) values sent to the API as filter_by —
// the API takes one per request, so the hook fires one request per status
// and merges the results.
const OFFER_TABS = [
  {
    key: "pending",
    label: "Pending",
    color: "#B45309",
    Icon: ClockIcon,
    countKey: "pending_offer_count",
    statuses: ["PENDING"],
    empty: "No pending offers yet",
  },
  {
    key: "accepted",
    label: "Accepted & Completed",
    color: "#0D9488",
    Icon: CheckCircleIcon,
    countKey: "accepted_and_completed_offer_count",
    statuses: ["ACCEPTED", "COMPLETED"],
    empty: "No accepted or completed offers yet",
  },
];

function OffersSummary({ travel }) {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState(OFFER_TABS[0].key);
  const tab = OFFER_TABS.find((t) => t.key === activeKey);
  const totalEarned = Number(travel.total_accepted_and_completed_offer_amount) > 0;

  // NOTE: the hook's 2nd argument is the page size (limit) — don't pass the tab key here.
  const { offers, loading, loadingMore, error, hasMore, fetchedFor, fetchOffers, loadMore } =
    useTravelOffers(travel.id);

  // "PENDING" or "ACCEPTED,COMPLETED" — matches what the hook stores in fetchedFor
  const statusKey = tab.statuses.join(",");

  // fetch whenever the active tab changes (and on first mount)
  useEffect(() => {
    fetchOffers(tab.statuses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, travel.id]);

  // offers shown here are always offers RECEIVED by the traveler (the person
  // offering to fulfill this travel sent them), and OfferDetails reads the
  // offer from location.state — no fetch-by-id exists yet — so we must pass
  // the full offer object the same way Offers.jsx does.
  const handleView = (offer) => {
    navigate(offerDetailsPath(offer.id), { state: { offer, isReceived: false } });
  };

  return (
    <Section title="Offers Summary">
      {totalEarned && (
        <PriceRow
          label="Total earned (accepted + completed)"
          amount={travel.price_conversion_details?.converted_amount}
          currency={travel.price_conversion_details?.converted_currency}
          color="#0D9488"
          conversion={travel.price_conversion_details}
        />
      )}

      {/* Tabs */}
      <div
        role="tablist"
        style={{
          display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none",
          margin: totalEarned ? "14px 0 12px" : "0 0 12px",
        }}
      >
        {OFFER_TABS.map((t) => {
          const isActive = t.key === activeKey;
          const count = travel[t.countKey] ?? 0;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0,
                padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                border: `1px solid ${isActive ? t.color : "var(--border-default)"}`,
                background: isActive ? t.color : "var(--bg-surface-hover)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <t.Icon />
              {t.label}
              <span style={{
                minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11.5, fontWeight: 800,
                background: isActive ? "rgba(255,255,255,0.25)" : "var(--bg-surface)",
                color: isActive ? "#fff" : t.color,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content for the selected tab.
          Order matters: error first, otherwise a failed request would leave
          fetchedFor stale and the skeleton would show forever. */}
      {error ? (
        <div style={{
          padding: "20px 16px", textAlign: "center", borderRadius: 12,
          border: "1px solid var(--danger)", background: "var(--danger-bg)",
          color: "var(--danger)", fontSize: 13.5,
        }}>
          {error}
          <button
            onClick={() => fetchOffers(tab.statuses)}
            style={{
              display: "block", margin: "8px auto 0",
              padding: "6px 16px", borderRadius: 999, border: "1px solid var(--danger)",
              background: "transparent", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      ) : loading || fetchedFor !== statusKey ? (
        <OffersListSkeleton />
      ) : offers.length === 0 ? (
        <div style={{
          padding: "28px 16px", textAlign: "center", borderRadius: 12,
          border: "1px dashed var(--border-default)",
          color: "var(--text-muted)", fontSize: 13.5,
        }}>
          {tab.empty}
        </div>
      ) : (
        <>
          {/* OfferCard's desktop row has minWidth 1050, so let this scroll sideways
              instead of breaking out of the Section */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onView={handleView}
                />
              ))}
            </div>
          </div>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: "7px 24px", borderRadius: 999,
                  border: "1px solid var(--border-default)", background: "var(--bg-surface)",
                  color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

export default function TravelDetails() {
  const { travelId } = useParams();
  const navigate = useNavigate();
  const { travel, loading, error, refetch } = useTravelDetail(travelId);

  // Offers Summary is only for the traveler who owns this travel
  const currentUserId = getCurrentUserId();
  const travelerId = travel?.traveler?.id ?? travel?.user_id;
  const isOwner =
    !!travel &&
    currentUserId !== null &&
    travelerId !== undefined &&
    String(travelerId) === String(currentUserId);

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
      ) : !travel ? (
        !error && (
          <div style={{
            background: "var(--bg-surface)", borderRadius: 14, padding: "48px 20px",
            textAlign: "center", color: "var(--text-muted)", fontSize: 15,
            border: "1px solid var(--border-subtle)", width: "100%",
          }}>
            Travel not found
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

          {/* ── Header: traveler + trip type ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <Avatar name={travel.traveler?.name} src={travel.traveler?.image} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {travel.traveler?.name}
                    </p>
                    <StarRating rating={travel.traveler?.average_rating} />
                  </div>
                  {travel.traveler?.location && (
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
                      {travel.traveler.location}
                    </p>
                  )}
                </div>
              </div>

              {/* trip_type + verification status, stacked top-right */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)",
                  background: "var(--bg-surface-hover)", border: "1px solid var(--border-subtle)",
                  borderRadius: 999, padding: "5px 12px", whiteSpace: "nowrap",
                }}>
                  {travel.trip_type}
                </span>
                <TravelStatusBadge status={travel.travel_verification?.status} />
              </div>
            </div>
            {travel.traveler?.about && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "10px 0 0", lineHeight: 1.6 }}>
                {travel.traveler.about}
              </p>
            )}
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 600 }}>
              Travel #{travel.id} · {travel.itinerary_count} {travel.itinerary_count === 1 ? "leg" : "legs"}
            </p>
          </div>

          {/* ── Offers summary: only the travel's owner sees this ── */}
          {isOwner && <OffersSummary travel={travel} />}

          {/* ── Verification documents: visible to anyone, same as the status badge ── */}
          <VerificationDocuments verification={travel.travel_verification} />

          {/* ── Itineraries ── */}
          <Section title={travel.itineraries?.length > 1 ? "Itineraries" : "Itinerary"}>
            {travel.itineraries?.map((leg, i) => (
              <div
                key={leg.id ?? i}
                style={{
                  padding: "14px 0",
                  borderBottom: i < travel.itineraries.length - 1 ? "1px solid var(--bg-surface-hover)" : "none",
                }}
              >
                <RouteConnector
                  fromCode={leg.from_country?.icon_base_path} from={leg.from_country?.name}
                  toCode={leg.to_country?.icon_base_path}     to={leg.to_country?.name}
                />
                {(leg.from_city?.name || leg.to_city?.name) && (
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "8px 0 0" }}>
                    {leg.from_city?.name} → {leg.to_city?.name}
                  </p>
                )}

                <InfoRow label="Travel date" value={formatDate(leg.travel_date)} />
                <InfoRow label="Weight capacity" value={leg.weight_capacity} />
                {(leg.length_in && leg.width_in && leg.height_in) && (
                  <InfoRow label="Dimensions" value={`${leg.length_in} × ${leg.width_in} × ${leg.height_in} in`} />
                )}

                {/* Offer counts on each leg are also owner-only */}
                {isOwner && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {leg.pending_offer_count > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 999,
                        background: "var(--bg-surface-hover)", border: "1px solid #B45309",
                        color: "#B45309", fontSize: 11.5, fontWeight: 700,
                      }}>
                        {leg.pending_offer_count} pending
                      </span>
                    )}
                    {leg.accepted_and_completed_offer_count > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 999,
                        background: "var(--bg-surface-hover)", border: "1px solid #0D9488",
                        color: "#0D9488", fontSize: 11.5, fontWeight: 700,
                      }}>
                        {leg.accepted_and_completed_offer_count} accepted/completed
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}