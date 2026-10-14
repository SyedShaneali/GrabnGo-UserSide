import { useState } from "react";
// Same file that exports loginApi (adjust the path/name if yours differs)
import { sendOtpApi, verifyOtpApi } from "../api/authApi";
import { extractApiError } from "../components/common/Extractapierror";

export function useOtp() {
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError]         = useState(null);

  const sendOtp = async (email) => {
    setSending(true);
    setError(null);
    try {
      await sendOtpApi({ email, purpose: "VERIFICATION" });
      return { success: true };
    } catch (e) {
      setError(extractApiError(e, "Failed to send the code. Please try again."));
      return { success: false };
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async ({ email, otp }) => {
    setVerifying(true);
    setError(null);
    try {
      const data = await verifyOtpApi({ email, otp });
      return { success: true, data };
    } catch (e) {
      setError(extractApiError(e, "Verification failed. Please try again."));
      return { success: false };
    } finally {
      setVerifying(false);
    }
  };

  const clearError = () => setError(null);

  return { sendOtp, verifyOtp, sending, verifying, error, clearError };
}