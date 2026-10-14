
// TODO: swap this for whatever axios instance currencyApi.js uses (the one
// that already carries your baseURL + auth interceptor), so this stays
// consistent with the rest of the app instead of hardcoding a host here.

import axiosClient from "./axiosClient";

export async function getCountries() {
  const { data } = await axiosClient.get(`/country/`);
  return data; // [{ id, name, short_name, icon_base_path, weightage, icon_path }]
}

export async function getCitiesByCountry(countryId) {
  const { data } = await axiosClient.get(`/country/${countryId}`);
  return data; // [{ id, name, short_name, icon_base_path, weightage, icon_path }]
}