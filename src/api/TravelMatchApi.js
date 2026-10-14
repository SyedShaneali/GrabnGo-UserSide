// src/api/TravelMatchApi.js
// ⚠️ Change this import to whatever http client your other api files use
// (the one OrderMatchApi.js uses). It must be a client with a baseURL + auth token set up.

import axiosClient from "./axiosClient";

/**
 * GET /grabngo/api/v1/order/match-by-travel
 * Orders that match a given travel.
 * Only travel_id is required by us; the country ids are optional filters.
 */
export async function getMatchedOrdersByTravelApi({
  travel_id,
  from_country_id,
  to_country_id,
  page = 1,
  limit = 10,
} = {}) {
  const params = { page, limit };
  if (travel_id != null) params.travel_id = travel_id;
  if (from_country_id) params.from_country_id = from_country_id;
  if (to_country_id) params.to_country_id = to_country_id;

  const res = await axiosClient.get("/order/match-by-travel", { params });
  return res?.data ?? res;
}