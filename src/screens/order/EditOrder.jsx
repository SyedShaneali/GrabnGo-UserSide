import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderDetail } from "../../hooks/useOrderDetails";
import { useUpdateOrder } from "../../hooks/useUpdateOrder";
import { PLACEHOLDER_IMAGE } from "../../components/Order/OrderMeta";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14,
  background: "var(--bg-surface)", color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
      {children}
    </label>
  );
}

const Row = ({ children }) => <div style={{ display: "flex", gap: 12 }}>{children}</div>;

// validity may be unix seconds or ms depending on backend. We keep whatever unit we received.
const toDateInput = (v) => {
  if (!v) return "";
  const ms = v > 1e12 ? v : v * 1000;
  return new Date(ms).toISOString().slice(0, 10);
};
const fromDateInput = (str, originalValue) => {
  const ms = new Date(str).getTime();
  return originalValue > 1e12 ? ms : Math.floor(ms / 1000);
};

export default function EditOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, loading, error: loadError } = useOrderDetail(orderId);
  const { updateOrder, loading: saving, error: saveError } = useUpdateOrder();

  const [f, setF] = useState(null);
  const [images, setImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  useEffect(() => {
    if (!order) return;
    setF({
      type: order.type || "PURCHASE",
      product_name: order.product_name || "",
      description: order.description || "",
      url: order.url || "",
      quantity: order.quantity ?? 1,
      if_not_available: order.if_not_available || "",
      with_box: !!order.with_box,
      additional_notes: order.additional_notes || "",
      price_currency: order.price_currency || order.display_currency || "",
      unit_price: order.unit_price ?? order.display_price ?? 0,
      reward_currency: order.reward_currency || order.display_currency || "",
      reward: order.reward ?? order.display_reward ?? 0,
      validity: toDateInput(order.validity),
      weight: order.weight ?? "",
      length_in: order.length_in ?? "",
      width_in: order.width_in ?? "",
      height_in: order.height_in ?? "",
      is_active: order.is_active ?? true,
    });
    setImages(order.images || []);
  }, [order]);

  const set = (k) => (e) =>
    setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const removeImage = (src) => {
    setImages((p) => p.filter((i) => i !== src));
    setDeletedImages((p) => [...p, src]);
  };

  const num = (v) => (v === "" || v === null ? undefined : Number(v));

  const handleSave = async (e) => {
    e.preventDefault();
    const body = {
      images,
      unused_image_keys: [],
      deleted_images: deletedImages,
      type: f.type,
      url: f.url || undefined,
      product_name: f.product_name,
      description: f.description,
      quantity: num(f.quantity),
      if_not_available: f.if_not_available || undefined,
      with_box: f.with_box,
      additional_notes: f.additional_notes || undefined,
      from_country_id: order.from_country?.id,
      from_city_id: order.from_city?.id,
      to_country_id: order.to_country?.id,
      to_city_id: order.to_city?.id,
      price_currency: f.price_currency,
      unit_price: num(f.unit_price),
      validity: f.validity ? fromDateInput(f.validity, order.validity) : undefined,
      reward_currency: f.reward_currency,
      reward: num(f.reward),
      order_category_id: order.category?.[0]?.id,
      is_active: f.is_active,
      weight: num(f.weight),
      length_in: num(f.length_in),
      width_in: num(f.width_in),
      height_in: num(f.height_in),
    };
    try {
      await updateOrder(orderId, body);
      navigate(`/orders/${orderId}`, { replace: true });
    } catch {}
  };

  if (loading || (!f && !loadError)) {
    return <div style={{ padding: 24, color: "var(--text-muted)" }}>Loading…</div>;
  }
  if (loadError || !order) {
    return <div style={{ padding: 24, color: "var(--danger)" }}>{loadError || "Order not found"}</div>;
  }

  return (
    <form onSubmit={handleSave} className="px-4 sm:px-6"
      style={{ paddingTop: 20, paddingBottom: 32, display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Edit Order #{order.id}</h1>
      </div>

      {/* Images */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {images.map((src) => (
          <div key={src} style={{ position: "relative", width: 80, height: 80 }}>
            <img src={src} alt="" onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: "1px solid var(--border-subtle)" }} />
            <button type="button" onClick={() => removeImage(src)}
              style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", border: "none", background: "var(--danger)", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: 1 }}>
              ✕
            </button>
          </div>
        ))}
        {images.length === 0 && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No images</span>}
      </div>

      <Field label="Product name">
        <input style={inputStyle} value={f.product_name} onChange={set("product_name")} required />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={f.description} onChange={set("description")} />
      </Field>
      <Field label="Product URL">
        <input style={inputStyle} value={f.url} onChange={set("url")} />
      </Field>

      <Row>
        <Field label="Type">
          <select style={inputStyle} value={f.type} onChange={set("type")}>
            <option value="PURCHASE">Purchase</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </Field>
        <Field label="Quantity">
          <input type="number" min={1} style={inputStyle} value={f.quantity} onChange={set("quantity")} />
        </Field>
      </Row>

      <Row>
        <Field label="Price currency">
          <input style={inputStyle} value={f.price_currency} onChange={set("price_currency")} />
        </Field>
        <Field label="Unit price">
          <input type="number" min={0} step="any" style={inputStyle} value={f.unit_price} onChange={set("unit_price")} />
        </Field>
      </Row>

      <Row>
        <Field label="Reward currency">
          <input style={inputStyle} value={f.reward_currency} onChange={set("reward_currency")} />
        </Field>
        <Field label="Reward">
          <input type="number" min={0} step="any" style={inputStyle} value={f.reward} onChange={set("reward")} />
        </Field>
      </Row>

      <Field label="Valid till">
        <input type="date" style={inputStyle} value={f.validity} onChange={set("validity")} />
      </Field>

      <Row>
        <Field label="Weight">
          <input type="number" min={0} step="any" style={inputStyle} value={f.weight} onChange={set("weight")} />
        </Field>
        <Field label="L (in)">
          <input type="number" min={0} step="any" style={inputStyle} value={f.length_in} onChange={set("length_in")} />
        </Field>
        <Field label="W (in)">
          <input type="number" min={0} step="any" style={inputStyle} value={f.width_in} onChange={set("width_in")} />
        </Field>
        <Field label="H (in)">
          <input type="number" min={0} step="any" style={inputStyle} value={f.height_in} onChange={set("height_in")} />
        </Field>
      </Row>

      <Field label="If not available">
        <input style={inputStyle} value={f.if_not_available} onChange={set("if_not_available")} />
      </Field>
      <Field label="Additional notes">
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={f.additional_notes} onChange={set("additional_notes")} />
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-primary)" }}>
        <input type="checkbox" checked={f.with_box} onChange={set("with_box")} /> Packed with box
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-primary)" }}>
        <input type="checkbox" checked={f.is_active} onChange={set("is_active")} /> Active
      </label>

      {saveError && (
        <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 12, padding: "12px 16px", fontSize: 14 }}>
          {saveError}
        </div>
      )}

      <button type="submit" disabled={saving}
        style={{ width: "100%", padding: "13px 0", borderRadius: 999, border: "none", background: "var(--success, #0d9488)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}