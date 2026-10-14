// src/api/OrderMatchApi.js
import axiosClient from "./axiosClient";

// GET /grabngo/api/v1/travel/match-by-order
// from_country_id / to_country_id are optional filters. We only send order_id
// because the backend can already match against the order's own route.
export const getMatchedTravelsApi = async ({ orderId, page = 1, limit = 10 }) => {
  const res = await axiosClient.get("/travel/match-by-order", {
    params: { order_id: orderId, page, limit },
  });
  return res.data;
};

// ⭐ ASSUMED endpoint (mirrors POST /order/). Confirm in Swagger and change if needed.
export const getOrderByIdApi = async (orderId) => {
  const res = await axiosClient.get(`/order/${orderId}`);
  return res.data;
};

// ⭐ TODO: send me the real "send request" endpoint and body, then fix this.
// Placeholder: the order owner asks a traveler (travel) to carry the order.
export const sendTravelRequestApi = async ({ orderId, travelId }) => {
  const res = await axiosClient.post("/request/", {
    order_id: orderId,
    travel_id: travelId,
  });
  return res.data;
};