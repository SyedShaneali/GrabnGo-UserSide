import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubmitTravel } from "../../hooks/useCreateTravel";
import { useSubmitTravelVerification } from "../../hooks/useSubmitTravelVerification";
import { useFileUploader } from "../../hooks/useCreateOrder"; // ⚠️ reuse the same uploader hook
import { useCountries } from "../../hooks/useCountries";
import { useCities } from "../../hooks/useCities";

// One teal family throughout — each trip type gets a different tint of the
// same brand teal so they're still visually distinct without introducing
// unrelated hues into the app's color system.
const TRIP_TYPES = [
  {
    value: "ONE WAY",
    label: "One Way",
    hint: "A single leg, one direction",
    accent: "#0d9488",
    accentBg: "#f0fdfa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
      </svg>
    ),
  },
  {
    value: "ROUND TRIP",
    label: "Round Trip",
    hint: "There and back on a set return date",
    accent: "#0f766e",
    accentBg: "#ecfdf5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    value: "MULTI TRIP",
    label: "Multi Trip",
    hint: "Several legs across one journey",
    accent: "#14b8a6",
    accentBg: "#f0fdfa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.4" /><circle cx="12" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" />
        <path d="M8.2 7.3L10 15.8M15.8 7.3L14 15.8" />
      </svg>
    ),
  },
];

const emptyLeg = () => ({
  from_country_id: "",
  from_city_id: "",
  to_country_id: "",
  to_city_id: "",
  travel_date: "", // "YYYY-MM-DD" from the date picker, converted to epoch ms on submit
  weight_capacity: 1,
  length_in: 1,
  width_in: 1,
  height_in: 1,
});

const emptyForm = {
  trip_type: "ONE WAY",
  return_date: "", // "YYYY-MM-DD", only used/sent for ROUND TRIP
  is_active: true,
  itinerary: [emptyLeg()],
};

// ---------------------------------------------------------------------------
// Date helpers (same approach as Create Order's "validity" field)
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DD" -> epoch milliseconds (end of that day, local time)
function dateStringToEpochMs(dateStr) {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function formatDateShort(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Shared field primitives
// ---------------------------------------------------------------------------
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "var(--bg-page)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

function TextInput(props) {
  return (
    <input
      {...props}
      className={`px-4 py-3 rounded-xl text-base outline-none w-full transition-colors ${props.className || ""}`}
      style={inputStyle}
    />
  );
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="px-4 py-3 rounded-xl text-base outline-none w-full disabled:opacity-50"
      style={inputStyle}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <div
        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
        style={{ background: checked ? "var(--brand)" : "var(--border-subtle)" }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
      <span className="text-left">
        <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</span>
        {hint && <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{hint}</span>}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Document dropzone — accepts images AND pdf/doc files.
// ---------------------------------------------------------------------------
function FileTypeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function isImageFile(file) {
  if (file.type) return file.type.startsWith("image/");
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(file.name || "");
}

function DocumentDropzone({ files, onAdd, onRemove, uploading }) {
  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) onAdd(selected);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {files.map((file, i) => {
          const isImage = isImageFile(file);
          return (
            <div
              key={file.key || i}
              className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1"
              style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}
            >
              {isImage ? (
                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span style={{ color: "var(--text-muted)" }}>
                    <FileTypeIcon />
                  </span>
                  <span
                    className="text-[10px] font-semibold text-center leading-tight px-1 truncate w-full"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {file.name}
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full text-white text-sm flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                ✕
              </button>
            </div>
          );
        })}

        <label
          className="w-24 h-24 rounded-xl flex flex-col items-center justify-center text-sm font-semibold cursor-pointer flex-shrink-0"
          style={{ border: "1px dashed var(--border-subtle)", color: "var(--text-muted)" }}
        >
          {uploading ? "..." : "+ Add"}
          <input
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            multiple
            hidden
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        Accepts images, PDF, or Word documents
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route visual — small dot / line / dot connector
// ---------------------------------------------------------------------------
function RoutePreview({ accent }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accent }} />
      <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}, var(--border-subtle))` }} />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
      </svg>
      <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, var(--border-subtle), ${accent})` }} />
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accent }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capacity — compact stat chips with inline units
// ---------------------------------------------------------------------------
function CapacityField({ label, unit, value, onChange }) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg"
      style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}
    >
      <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="1"
          value={value}
          onChange={onChange}
          className="w-12 text-right text-sm font-bold bg-transparent outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{unit}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One itinerary leg
// ---------------------------------------------------------------------------
function ItineraryLeg({ leg, index, total, countries, accent, onChange, onRemove }) {
  const { cities: fromCities } = useCities(leg.from_country_id);
  const { cities: toCities } = useCities(leg.to_country_id);

  const update = (patch) => onChange(index, { ...leg, ...patch });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
    >
      {/* Leg header: number badge, route preview, remove */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {total > 1 && (
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{ background: accent, color: "#fff" }}
          >
            {index + 1}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <RoutePreview accent={accent} />
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs font-bold flex-shrink-0"
            style={{ color: "var(--danger)" }}
          >
            Remove
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              Origin
            </span>
            <div className="flex flex-col gap-2">
              <Select
                value={leg.from_country_id}
                onChange={(e) => update({ from_country_id: e.target.value, from_city_id: "" })}
                options={countries}
                placeholder="Country"
              />
              <Select
                value={leg.from_city_id}
                onChange={(e) => update({ from_city_id: e.target.value })}
                options={fromCities}
                placeholder="City"
                disabled={!leg.from_country_id}
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              Destination
            </span>
            <div className="flex flex-col gap-2">
              <Select
                value={leg.to_country_id}
                onChange={(e) => update({ to_country_id: e.target.value, to_city_id: "" })}
                options={countries}
                placeholder="Country"
              />
              <Select
                value={leg.to_city_id}
                onChange={(e) => update({ to_city_id: e.target.value })}
                options={toCities}
                placeholder="City"
                disabled={!leg.to_country_id}
              />
            </div>
          </div>
        </div>

        <Field label="Travel date">
          <TextInput
            type="date"
            min={getTomorrowDateString()}
            value={leg.travel_date}
            onChange={(e) => update({ travel_date: e.target.value })}
            className="max-w-[200px]"
          />
        </Field>

        <div>
          <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            Capacity
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <CapacityField label="Weight" unit="kg" value={leg.weight_capacity} onChange={(e) => update({ weight_capacity: e.target.value })} />
            <CapacityField label="Length" unit="in" value={leg.length_in} onChange={(e) => update({ length_in: e.target.value })} />
            <CapacityField label="Width" unit="in" value={leg.width_in} onChange={(e) => update({ width_in: e.target.value })} />
            <CapacityField label="Height" unit="in" value={leg.height_in} onChange={(e) => update({ height_in: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post-creation step — upload verification documents, or skip
// ---------------------------------------------------------------------------
function StepVerification({ travelId, onDone }) {
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState(null);
  const { uploadFiles, uploading } = useFileUploader();
  const { submitVerification, submitting } = useSubmitTravelVerification();

  const handleAdd = async (files) => {
    try {
      const uploaded = await uploadFiles(files);
      setAttachments((a) => [...a, ...uploaded]);
    } catch {
      // error already tracked in the uploader hook
    }
  };

  const remove = (i) => setAttachments((a) => a.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError(null);
    try {
      await submitVerification(travelId, {
        attachment: attachments.map((a) => a.key),
        unused_images_key: [],
      });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 sm:p-8 flex flex-col gap-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--brand-light)", color: "var(--brand)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
            Verify your travel
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Upload a ticket, boarding pass, or booking confirmation to get verified faster.
            This is optional — you can skip it and do it later.
          </p>
        </div>
      </div>

      <DocumentDropzone files={attachments} onAdd={handleAdd} onRemove={remove} uploading={uploading} />

      {error && (
        <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onDone}
          className="px-5 py-3 rounded-xl text-base font-semibold"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          Skip for now
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || attachments.length === 0}
          className="px-6 py-3 rounded-xl text-base font-bold text-white disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {submitting ? "Submitting..." : "Submit Documents"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function CreateTravel() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [createdTravelId, setCreatedTravelId] = useState(null);
  const { submitTravel, submitting } = useSubmitTravel();
  const { countries } = useCountries();

  const isRoundTrip = form.trip_type === "ROUND TRIP";
  const isMultiTrip = form.trip_type === "MULTI TRIP";
  const activeType = TRIP_TYPES.find((t) => t.value === form.trip_type);

  const setTripType = (value) => {
    setError(null);
    setForm((f) => ({
      ...f,
      trip_type: value,
      itinerary: value === "MULTI TRIP" ? f.itinerary : [f.itinerary[0]],
      return_date: value === "ROUND TRIP" ? f.return_date : "",
    }));
  };

  const updateLeg = (index, updatedLeg) => {
    setForm((f) => {
      const itinerary = [...f.itinerary];
      itinerary[index] = updatedLeg;
      return { ...f, itinerary };
    });
  };

  const addLeg = () => setForm((f) => ({ ...f, itinerary: [...f.itinerary, emptyLeg()] }));

  const removeLeg = (index) =>
    setForm((f) => ({ ...f, itinerary: f.itinerary.filter((_, i) => i !== index) }));

  const validate = () => {
    for (let i = 0; i < form.itinerary.length; i++) {
      const leg = form.itinerary[i];
      const label = form.itinerary.length > 1 ? `Leg ${i + 1}: ` : "";
      if (!leg.from_country_id || !leg.from_city_id) return `${label}Please select the origin`;
      if (!leg.to_country_id || !leg.to_city_id) return `${label}Please select the destination`;
      if (!leg.travel_date) return `${label}Please select a travel date`;
      if (dateStringToEpochMs(leg.travel_date) <= Date.now())
        return `${label}Travel date must be in the future`;
      if (!leg.weight_capacity || Number(leg.weight_capacity) < 1)
        return `${label}Weight capacity must be at least 1`;
    }

    if (isRoundTrip) {
      if (!form.return_date) return "Please select a return date";
      const departureMs = dateStringToEpochMs(form.itinerary[0].travel_date);
      if (dateStringToEpochMs(form.return_date) <= departureMs)
        return "Return date must be after the travel date";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const payload = {
      trip_type: form.trip_type,
      is_active: form.is_active,
      itinerary: form.itinerary.map((leg) => ({
        from_country_id: Number(leg.from_country_id) || 0,
        from_city_id: Number(leg.from_city_id) || 0,
        to_country_id: Number(leg.to_country_id) || 0,
        to_city_id: Number(leg.to_city_id) || 0,
        travel_date: dateStringToEpochMs(leg.travel_date),
        weight_capacity: Number(leg.weight_capacity) || 1,
        length_in: Number(leg.length_in) || 1,
        width_in: Number(leg.width_in) || 1,
        height_in: Number(leg.height_in) || 1,
      })),
    };

    if (isRoundTrip) {
      payload.return_date = dateStringToEpochMs(form.return_date);
    }

    try {
      const created = await submitTravel(payload);
      const travelId = created?.id ?? created?.data?.id;
      setCreatedTravelId(travelId);
    } catch (err) {
      setError(err.message || "Something went wrong creating the travel");
    }
  };

  if (createdTravelId) {
    return (
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <h1 style={{ color: "var(--text-primary)" }} className="text-2xl font-extrabold mb-1">
          Create Travel
        </h1>
        <p style={{ color: "var(--text-muted)" }} className="text-sm mb-6">
          Travel created — one more optional step
        </p>
        <StepVerification travelId={createdTravelId} onDone={() => navigate("/my-travels")} />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <h1 style={{ color: "var(--text-primary)" }} className="text-2xl font-extrabold mb-1">
        Create Travel
      </h1>
      <p style={{ color: "var(--text-muted)" }} className="text-sm mb-6">
        Let travelers know your route so buyers can send you offers
      </p>

      {/* Trip type — same teal family, different tints per mode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        {TRIP_TYPES.map((t) => {
          const active = form.trip_type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTripType(t.value)}
              className="text-left px-4 py-3.5 rounded-xl transition-colors"
              style={{
                background: active ? t.accentBg : "var(--bg-surface)",
                border: `1.5px solid ${active ? t.accent : "var(--border-subtle)"}`,
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ background: active ? t.accent : "var(--bg-page)", color: active ? "#fff" : "var(--text-muted)" }}
              >
                {t.icon}
              </span>
              <span className="block text-sm font-extrabold" style={{ color: active ? t.accent : "var(--text-primary)" }}>
                {t.label}
              </span>
              <span className="block text-xs mt-0.5" style={{ color: active ? t.accent : "var(--text-muted)", opacity: active ? 0.85 : 1 }}>
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-5 sm:p-8 flex flex-col gap-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        {form.itinerary.map((leg, i) => (
          <ItineraryLeg
            key={i}
            leg={leg}
            index={i}
            total={form.itinerary.length}
            countries={countries}
            accent={activeType.accent}
            onChange={updateLeg}
            onRemove={removeLeg}
          />
        ))}

        {isMultiTrip && (
          <button
            type="button"
            onClick={addLeg}
            className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ color: activeType.accent, border: `1.5px dashed ${activeType.accent}` }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another leg
          </button>
        )}

        {isRoundTrip && (
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            style={{ background: activeType.accentBg, border: `1px solid ${activeType.accent}33` }}
          >
            <div>
              <p className="text-sm font-extrabold" style={{ color: activeType.accent }}>Return leg</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {formatDateShort(form.itinerary[0]?.travel_date)
                  ? `Coming back after ${formatDateShort(form.itinerary[0].travel_date)}`
                  : "When are you heading back?"}
              </p>
            </div>
            <Field label="Return date">
              <TextInput
                type="date"
                min={form.itinerary[0]?.travel_date || getTomorrowDateString()}
                value={form.return_date}
                onChange={(e) => setForm((f) => ({ ...f, return_date: e.target.value }))}
                className="max-w-[200px]"
              />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            label={form.is_active ? "Travel is active" : "Travel is inactive"}
            hint="Inactive travels won't be shown to buyers"
          />
        </div>

        {error && (
          <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl text-base font-bold text-white disabled:opacity-60"
            style={{ background: activeType.accent }}
          >
            {submitting ? "Creating travel..." : "Create Travel"}
          </button>
        </div>
      </div>
    </div>
  );
}