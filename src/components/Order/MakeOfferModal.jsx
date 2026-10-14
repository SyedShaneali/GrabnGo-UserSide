import { useState, useRef, useEffect, useMemo } from "react";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import RouteConnector from "./RouteConnector";
import { formatDate } from "./OrderMeta";
import { useUserTravels } from "../../hooks/useUserTravel";
import { useMakeOffer } from "../../hooks/useMakeOffer";
import { useCurrencies } from "../../hooks/useCurrency";

const WEIGHT_UNIT = "kg";

// Same trip-type color mapping as TravelCard, kept local so this modal
// doesn't depend on files outside what's already in this conversation.
const TRIP_TYPE_META = {
  "ONE WAY":    { label: "One Way",    color: "#1D4ED8", bg: "#EFF6FF" },
  "MULTI TRIP": { label: "Multi Trip", color: "#7C3AED", bg: "#F5F3FF" },
};

function titleCaseWords(s = "") {
  return s.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function TripTypePill({ type }) {
  if (!type) return null;
  const meta = TRIP_TYPE_META[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px", borderRadius: 999,
      background: meta?.bg ?? "var(--bg-surface-hover)",
      color: meta?.color ?? "var(--text-secondary)",
      whiteSpace: "nowrap",
    }}>
      {meta?.label ?? titleCaseWords(type)}
    </span>
  );
}

function ActiveStatusPill({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10.5, fontWeight: 700, lineHeight: 1.4,
      padding: "3px 9px", borderRadius: 999,
      background: isActive ? "#ECFDF5" : "#FEF2F2",
      color: isActive ? "#059669" : "#DC2626",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#059669" : "#DC2626",
      }} />
      {isActive ? "Active" : "Deactivated"}
    </span>
  );
}

// ── Custom currency dropdown ────────────────────────────────────────
// A native <select>'s open direction (up vs down) is decided by the
// browser based on available viewport space and can't be forced with
// CSS. This is a lightweight dropdown that always renders its option
// list directly below the trigger button (top: 100% + a small gap),
// with a search box at the top to filter long lists, and its own
// internal scroll — so it never flips upward inside the modal.
function CurrencySelect({ value, options, onChange, placeholder = "Select currency" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search each time the dropdown opens, and autofocus the search box
  useEffect(() => {
    if (open) {
      setSearch("");
      // slight delay so the input exists before we focus it
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((c) => c.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, boxSizing: "border-box",
          border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        }}
      >
        <span>{value || placeholder}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)", overflow: "hidden",
        }}>
          <div style={{ padding: 6, borderBottom: "1px solid var(--border-subtle)" }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search currency…"
              style={{
                width: "100%", padding: "7px 9px", borderRadius: 7, boxSizing: "border-box",
                border: "1px solid var(--border-subtle)", background: "var(--bg-surface-hover)",
                color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
              }}
            />
          </div>

          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "12px", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>
                No matches
              </div>
            ) : (
              filteredOptions.map((c) => {
                const selected = c === value;
                return (
                  <div
                    key={c}
                    onClick={() => { onChange(c); setOpen(false); }}
                    style={{
                      padding: "9px 12px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                      color: selected ? "var(--success, #0d9488)" : "var(--text-primary)",
                      background: selected ? "var(--bg-surface-hover)" : "transparent",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selected ? "var(--bg-surface-hover)" : "transparent"; }}
                  >
                    {c}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Travel card — used in the "pick a travel" step, styled after TravelCard */
function TravelPickCard({ travel, onSelect }) {
  const itineraries = travel.itineraries || [];
  const first = itineraries[0];
  const capacity = travel.weight_capacity != null ? `${travel.weight_capacity} ${WEIGHT_UNIT}` : "Not specified";

  return (
    <div
      onClick={() => onSelect(travel)}
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        background: "var(--bg-surface)", borderRadius: 14,
        border: "1px solid var(--border-subtle)", padding: 16,
        cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--brand, var(--success, #0d9488))";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,148,136,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header: id/type pills on the left, status on the right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <TripTypePill type={travel.trip_type} />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>#{travel.id}</span>
        </div>
        <ActiveStatusPill isActive={travel.is_active} />
      </div>

      {/* Route */}
      <div>
        {first ? (
          <RouteConnector
            fromCode={first.from_country?.icon_base_path} from={first.from_country?.name}
            toCode={first.to_country?.icon_base_path}     to={first.to_country?.name}
          />
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>No itinerary added yet</p>
        )}
        {itineraries.length > 1 && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            +{itineraries.length - 1} more route{itineraries.length > 2 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)" }} />

      {/* Footer meta: date / capacity / verification, spaced evenly */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>Travel Date</p>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap" }}>
            {first?.travel_date ? formatDate(first.travel_date) : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>Capacity</p>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: "3px 0 0", whiteSpace: "nowrap" }}>
            {capacity}
          </p>
        </div>
        {travel.travel_verification?.status && (
          <StatusBadge status={travel.travel_verification.status} />
        )}
      </div>
    </div>
  );
}

/* Itinerary card — used when a travel has more than one route to pick from */
function ItineraryPickCard({ itinerary, onSelect }) {
  const hasDimensions = itinerary.length_in && itinerary.width_in && itinerary.height_in;
  return (
    <div
      onClick={() => onSelect(itinerary)}
      style={{
        background: "var(--bg-surface)", borderRadius: 14,
        border: "1px solid var(--border-subtle)", padding: 14,
        cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--brand, var(--success, #0d9488))";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,148,136,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <RouteConnector
        fromCode={itinerary.from_country?.icon_base_path} from={itinerary.from_country?.name}
        toCode={itinerary.to_country?.icon_base_path}     to={itinerary.to_country?.name}
      />
      {(itinerary.from_city?.name || itinerary.to_city?.name) && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0 0" }}>
          {itinerary.from_city?.name} → {itinerary.to_city?.name}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {itinerary.travel_date && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-surface-hover)", borderRadius: 999, padding: "3px 9px" }}>
            {formatDate(itinerary.travel_date)}
          </span>
        )}
        {itinerary.weight_capacity != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-surface-hover)", borderRadius: 999, padding: "3px 9px" }}>
            {itinerary.weight_capacity} {WEIGHT_UNIT}
          </span>
        )}
        {hasDimensions && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-surface-hover)", borderRadius: 999, padding: "3px 9px" }}>
            {itinerary.length_in} × {itinerary.width_in} × {itinerary.height_in} in
          </span>
        )}
      </div>
    </div>
  );
}

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 12,
};

const backButtonStyle = {
  background: "none", border: "none", color: "var(--text-muted)",
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 12,
  display: "inline-flex", alignItems: "center", gap: 4,
};

export default function MakeOfferModal({ open, onClose, order, onSuccess }) {
  const { travels, loading, error, hasMore, loadMore } = useUserTravels();
  const { submitOffer, submitting, error: submitError } = useMakeOffer();
  const { currencies } = useCurrencies();

  const [step, setStep] = useState("travel"); // "travel" | "itinerary" | "form"
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);

  const resetAndClose = () => {
    setStep("travel");
    setSelectedTravel(null);
    setSelectedItinerary(null);
    setAmount("");
    setCurrency("");
    setNote("");
    setAgreed(false);
    onClose();
  };

  const handleTravelSelect = (travel) => {
    setSelectedTravel(travel);
    const itineraries = travel.itineraries || [];
    if (itineraries.length > 1) {
      setStep("itinerary");
    } else {
      setSelectedItinerary(itineraries[0] || null);
      setAmount(String(order?.display_reward ?? ""));
      setCurrency(order?.display_currency ?? "");
      setStep("form");
    }
  };

  const handleItinerarySelect = (itinerary) => {
    setSelectedItinerary(itinerary);
    setAmount(String(order?.display_reward ?? ""));
    setCurrency(order?.display_currency ?? "");
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!agreed || !amount || Number(amount) <= 0 || !currency || !selectedTravel) return;
    try {
      await submitOffer({
        order_id: order.id,
        travel_id: selectedTravel.id,
        itinerary_id: selectedItinerary?.id ?? null,
        amount: Number(amount),
        amount_currency: currency,
        additional_note: note,
      });
      onSuccess?.();
      resetAndClose();
    } catch {
      // submitError already holds the message, shown below the form
    }
  };

  const canSubmit = agreed && amount && Number(amount) > 0 && currency && !submitting;

  // Make sure the currently-set currency always shows up as an option,
  // even if it's not (yet) in the fetched currencies list.
  const currencyOptions = currency && !currencies.includes(currency)
    ? [currency, ...currencies]
    : currencies;

  return (
    <Modal open={open} onClose={resetAndClose} wide>
      {step === "travel" && (
        <>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Select a Travel
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px" }}>
            Choose which of your travels this offer is coming from.
          </p>

          {error && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 10 }}>{error}</p>}

          {!loading && travels.length === 0 && !error && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No travels found. Add a travel first.</p>
          )}

          <div style={cardGridStyle}>
            {travels.map((t) => (
              <TravelPickCard key={t.id} travel={t} onSelect={handleTravelSelect} />
            ))}
          </div>

          {loading && (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", padding: "14px 0 4px" }}>Loading…</p>
          )}
          {hasMore && !loading && (
            <button
              onClick={loadMore}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 999, marginTop: 14,
                border: "1px solid var(--border-subtle)", background: "transparent",
                color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Load more
            </button>
          )}
        </>
      )}

      {step === "itinerary" && selectedTravel && (
        <>
          <button onClick={() => setStep("travel")} style={backButtonStyle}>← Back</button>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Select a Route
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px" }}>
            Travel #{selectedTravel.id} has {selectedTravel.itineraries.length} routes — pick the one for this offer.
          </p>
          <div style={cardGridStyle}>
            {selectedTravel.itineraries.map((it) => (
              <ItineraryPickCard key={it.id} itinerary={it} onSelect={handleItinerarySelect} />
            ))}
          </div>
        </>
      )}

      {step === "form" && selectedTravel && (
        <>
          <button
            onClick={() => setStep(selectedTravel.itineraries?.length > 1 ? "itinerary" : "travel")}
            style={backButtonStyle}
          >
            ← Back
          </button>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>
            Make an Offer
          </p>

          {/* Summary of what's being offered against */}
          <div style={{
            background: "var(--bg-surface-hover)", borderRadius: 12, padding: 14, marginBottom: 20,
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px" }}>
                Travel #{selectedTravel.id}
              </p>
              {selectedItinerary ? (
                <RouteConnector
                  fromCode={selectedItinerary.from_country?.icon_base_path} from={selectedItinerary.from_country?.name}
                  toCode={selectedItinerary.to_country?.icon_base_path}     to={selectedItinerary.to_country?.name}
                />
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No itinerary attached</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <TripTypePill type={selectedTravel.trip_type} />
              <ActiveStatusPill isActive={selectedTravel.is_active} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Reward Amount
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
                  color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Currency
              </label>
              <CurrencySelect
                value={currency}
                options={currencyOptions}
                onChange={setCurrency}
              />
            </div>
          </div>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10, marginBottom: 16, resize: "vertical",
              border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: 13.5, boxSizing: "border-box", fontFamily: "inherit",
            }}
          />

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 18, cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
            I agree to Grab n Go's Terms and Policies
          </label>

          {submitError && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 10 }}>{submitError}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 999, border: "none",
              background: canSubmit ? "var(--success, #0d9488)" : "var(--bg-surface-hover)",
              color: canSubmit ? "#fff" : "var(--text-muted)",
              fontSize: 14.5, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Submitting…" : "Submit Offer"}
          </button>
        </>
      )}
    </Modal>
  );
}