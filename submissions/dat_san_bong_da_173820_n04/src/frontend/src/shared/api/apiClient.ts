import axios, { AxiosHeaders } from "axios";
import {
  clearTokenFromStorage,
  getBearerToken,
} from "@/shared/utils/tokenStorage";
import { localMockAdapter } from "./localMockAdapter";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

const useStaticLocalDb =
  import.meta.env.MODE !== "test" &&
  (import.meta.env.VITE_USE_MOCK_DB === "true" || !import.meta.env.VITE_API_BASE_URL);

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  ...(useStaticLocalDb ? { adapter: localMockAdapter } : {}),
});

// Request Interceptor: Attach Bearer Token
apiClient.interceptors.request.use((config) => {
  const bearerToken = getBearerToken();

  if (bearerToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", bearerToken);
    config.headers = headers;
  }

  return config;
});

// Response Interceptor: Handle 401 Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearTokenFromStorage();
      if (!window.location.hash.includes("/login") && window.location.pathname !== "/login") {
        window.location.hash = "#/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;