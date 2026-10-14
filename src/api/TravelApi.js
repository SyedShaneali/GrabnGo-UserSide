import axiosClient from "./axiosClient";
import { cleanParams, PARAMS_SERIALIZER } from "../utlls/Params";

/**
 * GET /grabngo/api/v1/travel/
 *
 * Supported params (all optional):
 *  search
 *  from_country_id, from_city_id, to_country_id, to_city_id
 *  from_date, to_date     -> timestamps (ms)
 *  is_verified            -> boolean
 *  match_any_country      -> boolean
 *  page (min 1), limit (min 1)
 */
export const getTravels = async (params = {}) => {
  const { data } = await axiosClient.get("/travel/", {
    params: cleanParams(params),
    paramsSerializer: PARAMS_SERIALIZER,
  });
  return data;
};

/**
 * GET /grabngo/api/v1/travel/user
 *
 * Returns the logged-in user's own travels, each with its itineraries
 * (if any) — used to pick a travel/route when making an offer.
 *
 * Params: page (min 1), limit (min 1)
 */
export const getUserTravels = async (params = {}) => {
  const { data } = await axiosClient.get("/travel/user", {
    params: cleanParams(params),
    paramsSerializer: PARAMS_SERIALIZER,
  });
  return data;
};

export const getTravelById = async (travelId) => {
  const { data } = await axiosClient.get(`/travel/${travelId}`);
  return data;
};
export const createTravel = async (payload) => {
  const { data } = await axiosClient.post("/travel/", payload);
  console.log("travel id is here", data);
  return data;
};
export const submitTravelVerification = async (travelId, payload) => {
  const { data } = await axiosClient.post(`/travel-verification/travel/${travelId}`, payload);
  return data;
};