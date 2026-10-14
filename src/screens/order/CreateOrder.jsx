import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFileUploader, useSubmitOrder } from "../../hooks/useCreateOrder";
import { useCountries } from "../../hooks/useCountries";
import { useCities } from "../../hooks/useCities";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrency";

const STEPS = [
  { label: "Product" },
  { label: "Shipping & Reward" },
  { label: "Checklist" },
  { label: "Payment" },
  { label: "Summary" },
];

// Same teal family as Create Travel — two tints so "Buy & Deliver" and
// "Carry & Deliver" read as distinct choices without leaving the palette.
const FULFILLMENT_TYPES = [
  {
    value: "PURCHASE",
    label: "Buy & Deliver",
    hint: "We source it, a traveler brings it",
    accent: "#0d9488",
    accentBg: "#f0fdfa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    value: "LUGGAGE",
    label: "Carry & Deliver",
    hint: "You already have it, a traveler carries it",
    accent: "#0f766e",
    accentBg: "#ecfdf5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9M14 17H5" />
        <circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
      </svg>
    ),
  },
];

const emptyForm = {
  type: "PURCHASE", // "PURCHASE" = Buy & Deliver, "CARRY" = Carry & Deliver
  url: "",
  product_name: "",
  description: "",
  unit_price: "",
  price_currency: "USD",
  weight: 1,
  length_in: 1,
  width_in: 1,
  height_in: 1,
  category_ids: [],
  images: [], // [{ key, name, previewUrl }]
  from_country_id: "",
  from_city_id: "",
  to_country_id: "",
  to_city_id: "",
  quantity: 1,
  if_not_available: "",
  validity: "", // "YYYY-MM-DD" from the date picker (converted to epoch ms on submit)
  reward_currency: "USD",
  reward: "",
  with_box: false,
  is_active: true,
  check_list: [],
  payment_attachments: [], // [{ key, name, previewUrl }]
};

// ---------------------------------------------------------------------------
// Date helpers (validity)
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" for tomorrow, in the user's LOCAL timezone
// (toISOString() would use UTC and can be off by a day)
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

function formatDateString(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// currencies from useCurrencies() might come back as plain strings
// ("USD") or objects ({ code: "USD" } / { id, name }). Normalize to
// { id, name } so <Select> doesn't care which.
function normalizeCurrencyOptions(currencies) {
  return (currencies || []).map((c) => {
    if (typeof c === "string") return { id: c, name: c };
    const code = c.code || c.id || c.name;
    return { id: code, name: c.name || code };
  });
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState(null);

  const { submitOrder, submitting } = useSubmitOrder();

  const { countries } = useCountries();
  const { cities: fromCities } = useCities(form.from_country_id);
  const { cities: toCities } = useCities(form.to_country_id);
  const { categories } = useCategories();
  const { currencies } = useCurrencies();
  const currencyOptions = normalizeCurrencyOptions(currencies);

  const activeFulfillment = FULFILLMENT_TYPES.find((t) => t.value === form.type);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const goNext = () => {
    // Validate validity date on the Shipping & Reward step.
    // The date input's `min` doesn't stop users typing a past date manually,
    // so we check here too.
    if (step === 1) {
      if (!form.validity) {
        setSubmitError("Please select a delivery validity date");
        return;
      }
      if (dateStringToEpochMs(form.validity) <= Date.now()) {
        setSubmitError("Validity date must be in the future");
        return;
      }
    }
    setSubmitError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleConfirm = async () => {
    setSubmitError(null);

    // Final safety check before sending
    if (!form.validity || dateStringToEpochMs(form.validity) <= Date.now()) {
      setSubmitError("Validity date must be in the future");
      return;
    }

    const isCarry = form.type === "CARRY";

    const payload = {
      images: form.images.map((img) => img.key),
      unused_image_keys: [],
      type: form.type,
      url: form.url,
      product_name: form.product_name,
      quantity: Number(form.quantity) || 1,
      if_not_available: form.if_not_available,
      with_box: form.with_box,
      description: form.description,
      from_country_id: Number(form.from_country_id) || 0,
      from_city_id: Number(form.from_city_id) || 0,
      to_country_id: Number(form.to_country_id) || 0,
      to_city_id: Number(form.to_city_id) || 0,
      // Carry & Deliver has no product price — don't send price fields at all
      ...(isCarry
        ? {}
        : {
            price_currency: form.price_currency,
            unit_price: Number(form.unit_price) || 0,
          }),
      validity: dateStringToEpochMs(form.validity), // epoch milliseconds
      reward_currency: form.reward_currency,
      reward: Number(form.reward) || 0,
      category_ids: form.category_ids,
      check_list: form.check_list,
      is_active: form.is_active,
      weight: Number(form.weight) || 1,
      length_in: Number(form.length_in) || 1,
      width_in: Number(form.width_in) || 1,
      height_in: Number(form.height_in) || 1,
      payment_request: {
        attachment: form.payment_attachments.map((img) => img.key),
        unused_images_key: [],
      },
    };

    try {
     const order = await submitOrder(payload);
      navigate(`/order-details/${order.id}`, { state: { order, justCreated: true } });;
    } catch (err) {
      setSubmitError(err.message || "Something went wrong creating the order");
    }
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <h1 style={{ color: "var(--text-primary)" }} className="text-2xl font-extrabold mb-1">
        Create Order
      </h1>
      <p style={{ color: "var(--text-muted)" }} className="text-sm mb-6">
        {STEPS[step].label} — step {step + 1} of {STEPS.length}
      </p>

      <Stepper steps={STEPS} current={step} accent={activeFulfillment.accent} />

      <div
        className="mt-6 rounded-2xl p-5 sm:p-8"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        {step === 0 && (
          <StepProduct form={form} update={update} categories={categories} currencyOptions={currencyOptions} accent={activeFulfillment.accent} />
        )}
        {step === 1 && (
          <StepShipping
            form={form}
            update={update}
            countries={countries}
            fromCities={fromCities}
            toCities={toCities}
            currencyOptions={currencyOptions}
            accent={activeFulfillment.accent}
          />
        )}
        {step === 2 && <StepChecklist form={form} update={update} accent={activeFulfillment.accent} />}
        {step === 3 && <StepPayment form={form} update={update} />}
        {step === 4 && (
          <StepSummary
            form={form}
            countries={countries}
            fromCities={fromCities}
            toCities={toCities}
            categories={categories}
          />
        )}

        {submitError && (
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="px-5 py-3 rounded-xl text-base font-semibold disabled:opacity-40"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="px-6 py-3 rounded-xl text-base font-semibold text-white"
              style={{ background: activeFulfillment.accent }}
            >
              {step === 1 ? "Submit order details" : "Continue"}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="px-6 py-3 rounded-xl text-base font-semibold text-white disabled:opacity-60"
              style={{ background: activeFulfillment.accent }}
            >
              {submitting ? "Placing order..." : "Confirm Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepper header
// ---------------------------------------------------------------------------
function Stepper({ steps, current, accent }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors"
              style={{
                background: i < current ? accent : i === current ? accent : "var(--bg-page)",
                border: i === current ? `2px solid ${accent}` : "none",
                color: i <= current ? "#fff" : "var(--text-muted)",
                boxShadow: i === current ? `0 0 0 4px ${accent}22` : "none",
              }}
            >
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className="text-xs font-semibold hidden sm:block whitespace-nowrap"
              style={{ color: i === current ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="flex-1 h-[2px] mx-2 transition-colors"
              style={{ background: i < current ? accent : "var(--border-subtle)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
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
      className={`px-4 py-3 rounded-xl text-base outline-none w-full ${props.className || ""}`}
      style={inputStyle}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`px-4 py-3 rounded-xl text-base outline-none resize-none w-full ${props.className || ""}`}
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

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <div
        className="w-12 h-7 rounded-full flex items-center px-1 transition-colors"
        style={{ background: checked ? "var(--brand)" : "var(--border-subtle)" }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
      <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
    </button>
  );
}

function ImageDropzone({ images, onAdd, onRemove, uploading }) {
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAdd(files);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.key || i}
            className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full text-white text-sm flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              ✕
            </button>
          </div>
        ))}

        <label
          className="w-24 h-24 rounded-xl flex flex-col items-center justify-center text-sm font-semibold cursor-pointer flex-shrink-0"
          style={{ border: "1px dashed var(--border-subtle)", color: "var(--text-muted)" }}
        >
          {uploading ? "..." : "+ Add"}
          <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capacity — compact stat chips with inline units (same as Create Travel)
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
          min="0"
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
// Route visual — reused from Create Travel for the Shipping step
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
// Category multi-select dropdown
// ---------------------------------------------------------------------------
function CategoryDropdown({ categories, selectedIds, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allSubCategories = categories.flatMap((parent) => parent.categories || []);
  const selectedNames = allSubCategories
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);

  const buttonLabel =
    selectedNames.length === 0
      ? "Select categories"
      : selectedNames.length <= 2
      ? selectedNames.join(", ")
      : `${selectedNames.length} categories selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-3 rounded-xl text-base outline-none w-full flex items-center justify-between text-left"
        style={inputStyle}
      >
        <span style={{ color: selectedNames.length ? "var(--text-primary)" : "var(--text-muted)" }}>
          {buttonLabel}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--text-muted)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto rounded-xl p-3"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          {categories.length === 0 ? (
            <p className="text-sm italic px-1 py-2" style={{ color: "var(--text-muted)" }}>
              Loading categories...
            </p>
          ) : (
            categories.map((parent) => (
              <div key={parent.id} className="mb-3 last:mb-0">
                <span
                  className="text-xs font-bold uppercase tracking-wide block px-1 mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {parent.name}
                </span>
                <div className="flex flex-col">
                  {(parent.categories || []).map((cat) => {
                    const checked = selectedIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(cat.id)}
                          className="w-4 h-4"
                        />
                        {cat.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Product info
// ---------------------------------------------------------------------------
function StepProduct({ form, update, categories, currencyOptions, accent }) {
  const { uploadFiles, uploading } = useFileUploader();

  const handleAddImages = async (files) => {
    try {
      const uploaded = await uploadFiles(files);
      update({ images: [...form.images, ...uploaded] });
    } catch {
      // error already tracked in the hook; surface a toast here if you have one
    }
  };

  const removeImage = (i) => update({ images: form.images.filter((_, idx) => idx !== i) });

  const toggleCategory = (id) => {
    const has = form.category_ids.includes(id);
    update({
      category_ids: has ? form.category_ids.filter((c) => c !== id) : [...form.category_ids, id],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          How should this order be fulfilled?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {FULFILLMENT_TYPES.map((opt) => {
            const active = form.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ type: opt.value })}
                className="text-left px-4 py-3.5 rounded-xl transition-colors"
                style={{
                  background: active ? opt.accentBg : "var(--bg-page)",
                  border: `1.5px solid ${active ? opt.accent : "var(--border-subtle)"}`,
                }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: active ? opt.accent : "var(--bg-surface)", color: active ? "#fff" : "var(--text-muted)" }}
                >
                  {opt.icon}
                </span>
                <span className="block text-sm font-extrabold" style={{ color: active ? opt.accent : "var(--text-primary)" }}>
                  {opt.label}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: active ? opt.accent : "var(--text-muted)", opacity: active ? 0.85 : 1 }}>
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {form.type === "PURCHASE" && (
        <Field label="Product URL">
          <TextInput
            className="max-w-2xl"
            placeholder="https://store.example.com/product"
            value={form.url}
            onChange={(e) => update({ url: e.target.value })}
          />
        </Field>
      )}

      <Field label="Product name">
        <TextInput
          className="max-w-2xl"
          placeholder="e.g. Sony WH-1000XM5 Headphones"
          value={form.product_name}
          onChange={(e) => update({ product_name: e.target.value })}
        />
      </Field>

      <Field label="Description">
        <TextArea
          className="max-w-3xl"
          rows={4}
          placeholder="Color, model, anything the traveler should know"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </Field>

      {/* Price + currency — Buy & Deliver only (Carry & Deliver has no product price) */}
      {form.type === "PURCHASE" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
          <Field label="Price">
            <TextInput
              type="number"
              min="0"
              placeholder="0.00"
              value={form.unit_price}
              onChange={(e) => update({ unit_price: e.target.value })}
            />
          </Field>
          <Field label="Currency">
            <Select
              value={form.price_currency}
              onChange={(e) => update({ price_currency: e.target.value })}
              options={currencyOptions}
              placeholder="Select currency"
            />
          </Field>
        </div>
      )}

      <div>
        <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          Dimensions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-3xl">
          <CapacityField label="Weight" unit="kg" value={form.weight} onChange={(e) => update({ weight: e.target.value })} />
          <CapacityField label="Length" unit="in" value={form.length_in} onChange={(e) => update({ length_in: e.target.value })} />
          <CapacityField label="Width" unit="in" value={form.width_in} onChange={(e) => update({ width_in: e.target.value })} />
          <CapacityField label="Height" unit="in" value={form.height_in} onChange={(e) => update({ height_in: e.target.value })} />
        </div>
      </div>

      <Field label="Category">
        <div className="max-w-2xl">
          <CategoryDropdown categories={categories} selectedIds={form.category_ids} onToggle={toggleCategory} />
        </div>
      </Field>

      <div>
        <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          Product images
        </span>
        <ImageDropzone images={form.images} onAdd={handleAddImages} onRemove={removeImage} uploading={uploading} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Shipping & reward
// ---------------------------------------------------------------------------
function StepShipping({ form, update, countries, fromCities, toCities, currencyOptions, accent }) {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <RoutePreview accent={accent} />
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                Origin
              </span>
              <div className="flex flex-col gap-2">
                <Select
                  value={form.from_country_id}
                  onChange={(e) => update({ from_country_id: e.target.value, from_city_id: "" })}
                  options={countries}
                  placeholder="Country"
                />
                <Select
                  value={form.from_city_id}
                  onChange={(e) => update({ from_city_id: e.target.value })}
                  options={fromCities}
                  placeholder="City"
                  disabled={!form.from_country_id}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                Destination
              </span>
              <div className="flex flex-col gap-2">
                <Select
                  value={form.to_country_id}
                  onChange={(e) => update({ to_country_id: e.target.value, to_city_id: "" })}
                  options={countries}
                  placeholder="Country"
                />
                <Select
                  value={form.to_city_id}
                  onChange={(e) => update({ to_city_id: e.target.value })}
                  options={toCities}
                  placeholder="City"
                  disabled={!form.to_country_id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Quantity">
          <TextInput type="number" min="1" value={form.quantity} onChange={(e) => update({ quantity: e.target.value })} />
        </Field>
        <Field label="Delivery validity (date)">
          <TextInput
            type="date"
            min={getTomorrowDateString()}
            value={form.validity}
            onChange={(e) => update({ validity: e.target.value })}
          />
        </Field>
      </div>

      <Field label="If item isn't available">
        <TextArea
          rows={3}
          placeholder="e.g. Refund me / pick the closest alternative"
          value={form.if_not_available}
          onChange={(e) => update({ if_not_available: e.target.value })}
        />
      </Field>

      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{ background: `${accent}0d`, border: `1px solid ${accent}33` }}
      >
        <p className="text-sm font-extrabold mb-3" style={{ color: accent }}>Traveler reward</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reward">
            <TextInput type="number" min="0" value={form.reward} onChange={(e) => update({ reward: e.target.value })} />
          </Field>
          <Field label="Currency">
            <Select
              value={form.reward_currency}
              onChange={(e) => update({ reward_currency: e.target.value })}
              options={currencyOptions}
              placeholder="Select currency"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Toggle checked={form.with_box} onChange={(v) => update({ with_box: v })} label="Deliver with original box" />
        <Toggle checked={form.is_active} onChange={(v) => update({ is_active: v })} label={form.is_active ? "Active" : "Inactive"} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Checklist
// ---------------------------------------------------------------------------
function StepChecklist({ form, update, accent }) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const val = draft.trim();
    if (!val) return;
    update({ check_list: [...form.check_list, val] });
    setDraft("");
  };

  const removeItem = (i) => update({ check_list: form.check_list.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Add the things the traveler should confirm before handing the item over — e.g. "Seal unopened", "Matches photos".
      </p>

      <div className="flex gap-3">
        <TextInput
          className="flex-1"
          placeholder="Add a checklist point"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
        />
        <button
          type="button"
          onClick={addItem}
          className="px-5 rounded-xl text-base font-bold text-white"
          style={{ background: accent }}
        >
          Add
        </button>
      </div>

      {form.check_list.length === 0 ? (
        <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
          No checklist points yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {form.check_list.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base"
              style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                style={{ background: `${accent}1a`, color: accent }}
              >
                {i + 1}
              </span>
              <span className="flex-1">{item}</span>
              <button type="button" onClick={() => removeItem(i)} style={{ color: "var(--danger)" }} className="font-bold text-sm flex-shrink-0">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Payment verification
// ---------------------------------------------------------------------------
function StepPayment({ form, update }) {
  const { uploadFiles, uploading } = useFileUploader();

  const handleAdd = async (files) => {
    try {
      const uploaded = await uploadFiles(files);
      update({ payment_attachments: [...form.payment_attachments, ...uploaded] });
    } catch {
      // error already tracked in the hook
    }
  };

  const remove = (i) =>
    update({ payment_attachments: form.payment_attachments.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Upload a screenshot or photo of your payment so it can be verified.
      </p>
      <ImageDropzone images={form.payment_attachments} onAdd={handleAdd} onRemove={remove} uploading={uploading} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Summary
// ---------------------------------------------------------------------------
function SummaryRow({ label, value }) {
  if (value === undefined || value === "" || value === null) return null;
  return (
    <div className="flex justify-between py-2 text-base" style={{ borderBottom: "1px solid var(--bg-surface-hover)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold text-right" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function SummarySection({ title, children }) {
  return (
    <section className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--bg-page)", border: "1px solid var(--border-subtle)" }}>
      <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function StepSummary({ form, countries, fromCities, toCities, categories }) {
  const countryName = (id) => countries.find((c) => String(c.id) === String(id))?.name || "—";
  const cityName = (list, id) => list.find((c) => String(c.id) === String(id))?.name || "—";

  const allSubCategories = categories.flatMap((parent) => parent.categories || []);
  const categoryNames = allSubCategories
    .filter((c) => form.category_ids.includes(c.id))
    .map((c) => c.name)
    .join(", ");

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {form.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {form.images.map((img, i) => (
            <img
              key={i}
              src={img.previewUrl}
              alt=""
              className="w-20 h-20 rounded-lg object-cover"
              style={{ border: "1px solid var(--border-subtle)" }}
            />
          ))}
        </div>
      )}

      <SummarySection title="Product">
        <SummaryRow label="Fulfillment" value={form.type === "PURCHASE" ? "Buy & Deliver" : "Carry & Deliver"} />
        <SummaryRow label="Name" value={form.product_name} />
        {form.type === "PURCHASE" && (
          <SummaryRow label="Price" value={form.unit_price && `${form.unit_price} ${form.price_currency}`} />
        )}
        <SummaryRow label="Dimensions" value={`${form.weight}kg · ${form.length_in}×${form.width_in}×${form.height_in} in`} />
        <SummaryRow label="Category" value={categoryNames} />
      </SummarySection>

      <SummarySection title="Shipping & reward">
        <SummaryRow label="From" value={`${cityName(fromCities, form.from_city_id)}, ${countryName(form.from_country_id)}`} />
        <SummaryRow label="To" value={`${cityName(toCities, form.to_city_id)}, ${countryName(form.to_country_id)}`} />
        <SummaryRow label="Quantity" value={form.quantity} />
        <SummaryRow label="Valid until" value={formatDateString(form.validity)} />
        <SummaryRow label="Reward" value={form.reward && `${form.reward} ${form.reward_currency}`} />
        <SummaryRow label="Original box" value={form.with_box ? "Yes" : "No"} />
        <SummaryRow label="Status" value={form.is_active ? "Active" : "Inactive"} />
      </SummarySection>

      {form.check_list.length > 0 && (
        <SummarySection title="Checklist">
          <ul className="list-disc pl-5 text-base" style={{ color: "var(--text-primary)" }}>
            {form.check_list.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </SummarySection>
      )}

      <SummarySection title="Payment">
        <SummaryRow label="Attachments" value={form.payment_attachments.length ? `${form.payment_attachments.length} uploaded` : "None"} />
      </SummarySection>
    </div>
  );
}