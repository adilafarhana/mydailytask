import axios from "axios";
import { getAdminToken } from "./auth";

const apiBaseURL ="https://dailytaskmanagemnt.infinityfree.io/";

  // const apiBaseURL =
  // (process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000").replace(
  //   /\/$/,
  //   ""
  // );

const apiClient = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  return `${apiBaseURL}${cleanPath}`;
};

export { apiBaseURL };
export default apiClient;
