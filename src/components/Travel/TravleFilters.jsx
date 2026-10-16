import { useState, useEffect } from "react";
import { useCountries } from "../../hooks/useCountries";
import { useCities } from "../../hooks/useCities";

export const emptyTravelFilters = {
  from_country_id: "",
  from_city_id: "",
  to_country_id: "",
  to_city_id: "",
  from_date: "",   // "YYYY-MM-DD"
  to_date: "",     // "YYYY-MM-DD"
  is_verified: false,
  match_any_country: false,
};

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" -> epoch ms, start of day (for from_date's lower bound)
function dateStringToStartOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

// "YYYY-MM-DD" -> epoch ms, end of day (for to_date's upper bound)
function dateStringToEndOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

// filters -> the exact query object useTravels/getTravels expects, dropping
// anything empty so cleanParams doesn't send blank strings
export function buildTravelFilterParams(f) {
  const params = {};
  if (f.from_country_id) params.from_country_id = Number(f.from_country_id);
  if (f.from_city_id) params.from_city_id = Number(f.from_city_id);
  if (f.to_country_id) params.to_country_id = Number(f.to_country_id);
  if (f.to_city_id) params.to_city_id = Number(f.to_city_id);
  if (f.from_date) params.from_date = dateStringToStartOfDayMs(f.from_date);
  if (f.to_date) params.to_date = dateStringToEndOfDayMs(f.to_date);
  if (f.is_verified) params.is_verified = true;
  if (f.match_any_country) params.match_any_country = true;
  return params;
}

export function countActiveTravelFilters(f) {
  let n = 0;
  if (f.from_country_id) n++;
  if (f.to_country_id) n++;
  if (f.from_date || f.to_date) n++;
  if (f.is_verified) n++;
  if (f.match_any_country) n++;
  return n;
}

/* ── small pieces (same look as OrderFiltersModal) ── */
const inputStyle = {
  background: "var(--bg-page)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="px-3 py-2.5 rounded-lg text-sm outline-none w-full disabled:opacity-50"
      style={inputStyle}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`px-3 py-2.5 rounded-lg text-sm outline-none w-full ${props.className || ""}`}
      style={inputStyle}
    />
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left" }}>
      <div style={{ width: 40, height: 22, borderRadius: 999, background: checked ? "var(--brand)" : "var(--border-subtle)", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, marginTop: 1 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", transform: checked ? "translateX(18px)" : "translateX(0)", transition: "transform 0.15s" }} />
      </div>
      <div>
        <span className="text-xs font-bold block" style={{ color: "var(--text-secondary)" }}>{label}</span>
        {description && (
          <span className="text-xs block" style={{ color: "var(--text-muted)", marginTop: 2 }}>{description}</span>
        )}
      </div>
    </button>
  );
}

/* ── the panel itself ── */
export default function TravelFiltersModal({ open, initialFilters, onApply, onClose }) {
  const [draft, setDraft] = useState(initialFilters);
  const { countries } = useCountries();
  const { cities: fromCities } = useCities(draft.from_country_id);
  const { cities: toCities } = useCities(draft.to_country_id);

  // reset the draft to whatever's currently applied each time the modal opens
  useEffect(() => {
    if (open) setDraft(initialFilters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleClear = () => setDraft(emptyTravelFilters);
  const handleApply = () => { onApply(draft); onClose(); };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--bg-surface-hover)" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Filters</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Origin */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Origin</span>
            <div className="grid grid-cols-2 gap-3">
              <Select value={draft.from_country_id} onChange={(e) => update({ from_country_id: e.target.value, from_city_id: "" })} options={countries} placeholder="Country" />
              <Select value={draft.from_city_id} onChange={(e) => update({ from_city_id: e.target.value })} options={fromCities} placeholder="City" disabled={!draft.from_country_id} />
            </div>
          </div>

          {/* Destination */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Destination</span>
            <div className="grid grid-cols-2 gap-3">
              <Select value={draft.to_country_id} onChange={(e) => update({ to_country_id: e.target.value, to_city_id: "" })} options={countries} placeholder="Country" />
              <Select value={draft.to_city_id} onChange={(e) => update({ to_city_id: e.target.value })} options={toCities} placeholder="City" disabled={!draft.to_country_id} />
            </div>
          </div>

          <Toggle
            checked={draft.match_any_country}
            onChange={(v) => update({ match_any_country: v })}
            label="Match either country"
            description="Show travels matching origin OR destination, not both"
          />

          {/* Travel date range */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Travel date</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <TextInput type="date" value={draft.from_date} onChange={(e) => update({ from_date: e.target.value })} />
              </Field>
              <Field label="To">
                <TextInput type="date" min={draft.from_date || undefined} value={draft.to_date} onChange={(e) => update({ to_date: e.target.value })} />
              </Field>
            </div>
          </div>

          <Toggle
            checked={draft.is_verified}
            onChange={(v) => update({ is_verified: v })}
            label="Verified travelers only"
            description="Only show travels with a verified travel document"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--bg-surface-hover)" }}>
          <button onClick={handleClear} className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Clear all
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--brand)" }}
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}