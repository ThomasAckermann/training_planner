import axios from "axios";
import useAuthStore from "../store/authStore.js";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const skipRedirectUrls = [
        "/api/auth/me",
        "/api/auth/login",
        "/api/auth/register",
      ];
      const shouldSkip = skipRedirectUrls.some((url) =>
        requestUrl.includes(url),
      );

      if (!shouldSkip) {
        useAuthStore.getState().clearUser();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
