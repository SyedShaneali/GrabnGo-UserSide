import axiosClient from "./axiosClient";

/**
 * GET /grabngo/api/v1/currency/target
 * Returns { currencies: string[] } — all currency codes an offer amount can be made in.
 */
export const getTargetCurrencies = async () => {
  const { data } = await axiosClient.get("/currency/target");
  return data;
};