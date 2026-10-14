import axiosClient from "./axiosClient";

// GET /grabngo/api/v1/user/notification/
// is_seen: true | false | null (null = don't send it, i.e. "All")
export const getNotificationsApi = async ({ is_seen = null, page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (is_seen !== null) params.is_seen = is_seen;

  const res = await axiosClient.get("/user/notification/", { params });
  return res.data;
};

// Used by NotificationCountContext. Fetches one unread item and reads the total.
// ⭐ TODO: the response shape isn't confirmed yet — once you send a sample JSON,
// point this at the real total field (and drop the guesses below).
export const getNotificationCountApi = async () => {
  const data = await getNotificationsApi({ is_seen: false, page: 1, limit: 1 });
  return {
    count: data?.total ?? data?.count ?? data?.total_count ?? data?.pagination?.total ?? 0,
  };
};

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

// PATCH /grabngo/api/v1/user/notification/seen  (body: array of ids)
// ⭐ Assumed to mirror the back-office endpoint. Check it exists in Swagger.
export const markNotificationsSeenApi = async (ids) => {
  const res = await axiosClient.patch("/user/notification/seen", ids);
  return res.data;
};