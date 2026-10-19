import axiosClient from "./axiosClient";

/**
 * POST /grabngo/api/v1/offer/
 * body: { order_id, travel_id, itinerary_id, amount, amount_currency, additional_note }
 */
export const addOffer = async (payload) => {
  const { data } = await axiosClient.post("/offer/", payload);
  return data;
};
/**
 * params: { order_id }
 */
export const checkOffer = async (orderId) => {
  const { data } = await axiosClient.get("/offer/check", {
    params: { order_id: orderId },
  });
  return data;
};
export const getOffers = async ({
  filterBy = "RECEIVED",
  search = "",
  page = 1,
  limit = 10,
} = {}) => {
  const { data } = await axiosClient.get("/offer/", {
    params: {
      filter_by: filterBy,
      ...(search ? { search } : {}),
      page,
      limit,
    },
  });
  return data;
};
export const updateOfferStatus = async (offerId, status) => {
  const { data } = await axiosClient.put(`/offer/${offerId}/update-status`, { status });
  return data;
};
 

