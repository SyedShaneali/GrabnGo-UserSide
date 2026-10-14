import axiosClient from "./axiosClient";

export async function getCategories() {
  const { data } = await axiosClient.get(`/category/`);
  return data; // [{ id, name, categories: [{ id, name, icon_base_path }] }]
}