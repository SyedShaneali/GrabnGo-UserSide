import axiosClient from "./axiosClient";
import { cleanParams, PARAMS_SERIALIZER } from "../utlls/Params";

/**
 * GET /grabngo/api/v1/order/
 *
 * Supported params (all optional):
 *  search, order_by, type
 *  status                 -> string[]
 *  from_country_id, from_city_id, to_country_id, to_city_id
 *  usd_reward_rang_start, usd_reward_rang_end   (spelled "rang" on the backend)
 *  category_ids           -> number[]
 *  payment_verified       -> boolean
 *  match_any_country      -> boolean
 *  page (min 1), limit (min 1)
 */
export const getOrders = async (params = {}) => {
  const { data } = await axiosClient.get("/order/", {
    params: cleanParams(params),
    paramsSerializer: PARAMS_SERIALIZER,
  });
  return data;
};
export const getOrderById = async (orderId) => {
  const { data } = await axiosClient.get(`/order/${orderId}/detail`);
  return data;
};
export const getMyOrders = async (params = {}) => {
  const { data } = await axiosClient.get("/order/user", {
    params: cleanParams(params),
    paramsSerializer: PARAMS_SERIALIZER,
  });
  return data;
};
export const getOrderStatusFlowApi = async (orderId) => {
  const response = await axiosClient.get(`/order/${Number(orderId)}/status-flow`);
  return response.data;
};

/**
 * PUT /grabngo/api/v1/order/{order_id}/status
 *
 * status, order_cancel_reason, is_checklist are all QUERY params, not body.
 */
export const updateOrderStatusApi = async (orderId, { status, orderCancelReason, isChecklist } = {}) => {
  const { data } = await axiosClient.put(`/order/${orderId}/status`, null, {
    params: cleanParams({
      status,
      order_cancel_reason: orderCancelReason,
      is_checklist: isChecklist,
    }),
    paramsSerializer: PARAMS_SERIALIZER,
  });
  return data;
};
/** PUT /grabngo/api/v1/order/{order_id} — body only, no query params */
export const updateOrderApi = async (orderId, body = {}) => {
  const { data } = await axiosClient.put(`/order/${orderId}`, body);
  return data;
};

/** ASSUMED endpoints, change to match your backend */
export const deleteOrderApi = async (orderId) => {
  const { data } = await axiosClient.delete(`/order/${orderId}`);
  return data;
};
export const refundOrderApi = async (orderId) => {
  const { data } = await axiosClient.post(`/order/${orderId}/refund`);
  return data;
};
export const getOrderActivityLogApi = async (orderId) => {
  const { data } = await axiosClient.get(`/order/${orderId}/activity-log`);
  return data;
};
 