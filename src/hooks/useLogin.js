import { useState } from "react";
import { loginApi } from "../api/authApi";
import { requestNotificationPermission } from "../utlls/Notifications";

// Asks for notification permission and returns the FCM token, or "" if the
// user denies / ignores the prompt / the browser doesn't support it.
// The 8s cap means a prompt left open never blocks login; if they allow it
// later, watchNotificationPermission in useFcmListener registers the token then.
const getFcmToken = async () => {
  try {
    const token = await Promise.race([
      requestNotificationPermission(),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    return token || "";
  } catch {
    return "";
  }
};

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const login = async ({ credentials, password }) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // ⭐ Kept as the first await so the permission prompt still counts as
      // coming from the user's click on "Log In".
      const deviceToken = await getFcmToken();

      const data = await loginApi({ credentials, password, timezone, deviceToken });

      const token = data?.access_token || data?.token || data?.data?.access_token;

      if (!token) {
        setError("Login failed. No token received.");
        return { success: false, error: "No token received" };
      }
      return { success: true, data };
    } catch (err) {
      const message =
        err.response?.data?.error || "Login failed. Please try again.";
      const code = err.response?.data?.code || null;

      setError(message);
      setErrorCode(code);

      return { success: false, error: message, code };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, errorCode };
};