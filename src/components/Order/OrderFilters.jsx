import { useState, useEffect } from "react";
import { useCountries } from "../../hooks/useCountries";
import { useCities } from "../../hooks/useCities";
import { useCategories } from "../../hooks/useCategories";

export const ORDER_STATUSES = [
  "DRAFT", "OPEN", "ASSIGNED", "PURCHASING", "PURCHASED", "PRODUCT IN HAND",
  "PURCHASE VERIFIED", "HANDOVER PENDING", "HANDED OVER", "HANDOVER CONFIRMED",
  "TRAVELING", "ARRIVED", "DISPATCHED", "RECEIVED", "CANCELED",
];

// prettier labels for the chips — "PRODUCT_IN_HAND" -> "Product In Hand"
function prettyStatus(s) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const emptyOrderFilters = {
  status: [],
  from_country_id: "",
  from_city_id: "",
  to_country_id: "",
  to_city_id: "",
  usd_reward_rang_start: "",
  usd_reward_rang_end: "",
  category_ids: [],
  payment_verified: null, // null = any, true, false
  type: "",               // "" = any, "PURCHASE", "CARRY"
  match_any_country: false,
};

// filters -> the exact query object useMyOrders/getOrders expects, dropping
// anything empty so cleanParams on the API side doesn't send blank strings
export function buildOrderFilterParams(f) {
  const params = {};
  if (f.status?.length) params.status = f.status;
  if (f.from_country_id) params.from_country_id = Number(f.from_country_id);
  if (f.from_city_id) params.from_city_id = Number(f.from_city_id);
  if (f.to_country_id) params.to_country_id = Number(f.to_country_id);
  if (f.to_city_id) params.to_city_id = Number(f.to_city_id);
  if (f.usd_reward_rang_start !== "") params.usd_reward_rang_start = Number(f.usd_reward_rang_start);
  if (f.usd_reward_rang_end !== "") params.usd_reward_rang_end = Number(f.usd_reward_rang_end);
  if (f.category_ids?.length) params.category_ids = f.category_ids;
  if (f.payment_verified !== null) params.payment_verified = f.payment_verified;
  if (f.type) params.type = f.type;
  if (f.match_any_country) params.match_any_country = true;
  return params;
}

export function countActiveFilters(f) {
  let n = 0;
  if (f.status?.length) n++;
  if (f.from_country_id) n++;
  if (f.to_country_id) n++;
  if (f.usd_reward_rang_start !== "" || f.usd_reward_rang_end !== "") n++;
  if (f.category_ids?.length) n++;
  if (f.payment_verified !== null) n++;
  if (f.type) n++;
  if (f.match_any_country) n++;
  return n;
}

/* ── small pieces ── */
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

function StatusChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 999,
        border: `1px solid ${active ? "var(--brand)" : "var(--border-subtle)"}`,
        background: active ? "var(--brand-light)" : "var(--bg-page)",
        color: active ? "var(--brand)" : "var(--text-secondary)",
        fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function TriToggle({ label, value, onChange }) {
  // value: null (any) | true | false
  const options = [
    { key: "any", label: "Any", val: null },
    { key: "yes", label: "Yes", val: true },
    { key: "no", label: "No", val: false },
  ];
  return (
    <div>
      <span className="text-xs font-bold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 10, background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
        {options.map((o) => {
          const active = value === o.val;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.val)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none",
                background: active ? "var(--bg-surface)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── the panel itself ── */
export default function OrderFiltersModal({ open, initialFilters, onApply, onClose }) {
  const [draft, setDraft] = useState(initialFilters);
  const { countries } = useCountries();
  const { cities: fromCities } = useCities(draft.from_country_id);
  const { cities: toCities } = useCities(draft.to_country_id);
  const { categories } = useCategories();

  // reset the draft to whatever's currently applied each time the modal opens
  useEffect(() => {
    if (open) setDraft(initialFilters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const toggleStatus = (s) => {
    const has = draft.status.includes(s);
    update({ status: has ? draft.status.filter((x) => x !== s) : [...draft.status, s] });
  };

  const allSubCategories = categories.flatMap((p) => p.categories || []);
  const toggleCategory = (id) => {
    const has = draft.category_ids.includes(id);
    update({ category_ids: has ? draft.category_ids.filter((c) => c !== id) : [...draft.category_ids, id] });
  };

  const handleClear = () => setDraft(emptyOrderFilters);
  const handleApply = () => { onApply(draft); onClose(); };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-subtle)", width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
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
          {/* Status */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Status</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ORDER_STATUSES.map((s) => (
                <StatusChip key={s} label={prettyStatus(s)} active={draft.status.includes(s)} onClick={() => toggleStatus(s)} />
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Fulfillment type</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "", label: "Any" },
                { value: "PURCHASE", label: "Buy & Deliver" },
                { value: "LUGGAGE", label: "Carry & Deliver" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ type: opt.value })}
                  style={{
                    flex: 1, padding: "8px 10px", borderRadius: 10,
                    border: `1px solid ${draft.type === opt.value ? "var(--brand)" : "var(--border-subtle)"}`,
                    background: draft.type === opt.value ? "var(--brand-light)" : "var(--bg-page)",
                    color: draft.type === opt.value ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Match either country</span>
            <button
              type="button"
              onClick={() => update({ match_any_country: !draft.match_any_country })}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div style={{ width: 40, height: 22, borderRadius: 999, background: draft.match_any_country ? "var(--brand)" : "var(--border-subtle)", display: "flex", alignItems: "center", padding: 2 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", transform: draft.match_any_country ? "translateX(18px)" : "translateX(0)", transition: "transform 0.15s" }} />
              </div>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                Show orders matching origin OR destination, not both
              </span>
            </button>
          </div>

          {/* Reward range */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Reward (USD)</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min">
                <TextInput type="number" min="0" placeholder="0" value={draft.usd_reward_rang_start} onChange={(e) => update({ usd_reward_rang_start: e.target.value })} />
              </Field>
              <Field label="Max">
                <TextInput type="number" min="0" placeholder="Any" value={draft.usd_reward_rang_end} onChange={(e) => update({ usd_reward_rang_end: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>Category</span>
            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: 8, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}>
              {allSubCategories.length === 0 ? (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>Loading categories...</p>
              ) : (
                allSubCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 px-1 py-1 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
                    <input type="checkbox" checked={draft.category_ids.includes(cat.id)} onChange={() => toggleCategory(cat.id)} />
                    {cat.name}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Payment verified */}
          <TriToggle label="Payment verified" value={draft.payment_verified} onChange={(v) => update({ payment_verified: v })} />
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