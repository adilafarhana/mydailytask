import axios from "axios";
import { getAdminToken } from "./auth";

// Hardcoded base URL as requested by user
const baseHost = "http://127.0.0.1:8000";

export const HOST_URL = baseHost;
export const apiBaseURL = `${baseHost}/api`;

const apiClient = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAdminToken() || localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.url && config.url.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api/, "");
  }
  
  return config;
});

export const getMediaUrl = (path) => {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${HOST_URL}${cleanPath}`;
};

export default apiClient;
