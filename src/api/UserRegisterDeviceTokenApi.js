import { useCallback } from "react";

// Same call signature the back office uses: registerDeviceToken(token, "WEB").
// Errors are not swallowed here — useFcmListener catches them and only marks
// the token as registered after this resolves.
export function useRegisterDeviceToken() {
  const registerDeviceToken = useCallback(async (token, deviceType = "WEB") => {
    return updateDeviceTokenApi({ deviceToken: token, deviceType });
  }, []);

  return { registerDeviceToken };
}