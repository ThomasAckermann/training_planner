import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api.js";
import useAuthStore from "../store/authStore.js";

export function useAuth() {
  const { user, isLoading, setUser, clearUser, setLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await api.get("/api/auth/me");
        if (!cancelled) {
          setUser(response.data);
        }
      } catch {
        if (!cancelled) {
          clearUser();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (isLoading) {
      checkSession();
    }

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email, password) {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      setUser(response.data);
      toast.success(`Welcome back, ${response.data.name}!`);
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      clearUser();
      navigate("/");
      toast.success("Logged out successfully");
    }
  }

  async function register(data) {
    try {
      const response = await api.post("/api/auth/register", data);
      setUser(response.data);
      toast.success(`Welcome, ${response.data.name}!`);
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
      throw error;
    }
  }

  return { user, isLoading, login, logout, register };
}
