import axios from "axios";
import toast from "react-hot-toast";
import { API_ROOT } from "../config/apiConfig";

const axiosClient = axios.create({
  baseURL: API_ROOT,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 50000,
});

// Request interceptor — attach token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error("Server is not responding. Please try again later.");
    } else if (error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;