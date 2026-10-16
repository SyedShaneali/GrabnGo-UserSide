import { useState } from "react";
// Same file that exports loginApi (adjust the path/name if yours differs)
import { registerApi } from "../api/authApi";

export function useRegister() {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const register = async (payload) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const data = await registerApi(payload);
      return { success: true, data };
    } catch (e) {
      const body = e?.response?.data;
      setError(body?.message || body?.detail || "Registration failed. Please try again.");
      setErrorCode(body?.error_code ?? body?.code ?? null);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, errorCode };
}