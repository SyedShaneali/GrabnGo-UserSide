import axiosClient from "./axiosClient";

// crypto.randomUUID() only exists in secure contexts (HTTPS / localhost),
// so fall back to getRandomValues (works on plain HTTP), then Math.random.
const generateUUID = () => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
      return [
        hex.slice(0, 4).join(""),
        hex.slice(4, 6).join(""),
        hex.slice(6, 8).join(""),
        hex.slice(8, 10).join(""),
        hex.slice(10, 16).join(""),
      ].join("-");
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const getDeviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = generateUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
};

// ⭐ deviceToken is the real FCM token now ("" if the user denied / ignored the prompt).
export const loginApi = async ({ credentials, password, timezone, deviceToken = "" }) => {
  const res = await axiosClient.post("/pre-auth/login/", {
    credentials,
    password,
    device_id: getDeviceId(),
    device_token: deviceToken,
    device_type: "WEB",
    timezone,
    app_version: "1.0.0",
  });
  return res.data;
};

export const registerApi = async ({
  name,
  email,
  phone,
  password,
  default_currency,
  home_country,
  deviceToken = "", // ⭐ optional — register screen can pass it the same way login does
}) => {
  const res = await axiosClient.post(
    "/", // <-- confirm the real "Create User" path from your API docs
    {
      name,
      email,
      phone,
      password,
      default_currency,
      home_country,
      device_id: getDeviceId(),
      device_token: deviceToken,
      device_type: "WEB",
      app_version: "1.0.0",
    }
    // If the backend actually needs the `unique-identifier` header, add:
    // { headers: { "unique-identifier": getDeviceId() } }
  );
  return res.data;
};

// Paths assume axiosClient's baseURL already ends with /grabngo/api/v1
// (change them if your baseURL differs).

export const sendOtpApi = async ({ email, purpose = "VERIFICATION" }) => {
  const res = await axiosClient.post(
    "/otp/send",
    { purpose },
    { params: { email } }
    // If the backend needs the optional `unique-identifier` header, add:
    // { params: { email }, headers: { "unique-identifier": getDeviceId() } }
  );
  return res.data;
};

export const verifyOtpApi = async ({ email, otp }) => {
  const res = await axiosClient.post(
    "/otp/verification",
    { otp: Number(otp) }, // the API expects an integer
    { params: { email } }
  );
  return res.data;
};