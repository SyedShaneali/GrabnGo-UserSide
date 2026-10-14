// Shared by useRegister / useOtp.
// Backend error bodies look like { error: "...", code: null }, but this also
// copes with { message }, { detail: "..." } and FastAPI-style 422 arrays.
export const extractApiError = (e, fallback = "Something went wrong. Please try again.") => {
  const body = e?.response?.data;

  if (!e?.response) {
    return "Can't reach the server. Check your internet connection and try again.";
  }

  if (typeof body === "string" && body.trim()) return body;

  const direct = body?.error ?? body?.message;
  if (typeof direct === "string" && direct.trim()) return direct;

  const detail = body?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(". ");
  }

  return fallback;
};