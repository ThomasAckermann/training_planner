import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api.js";

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    },
    enabled: Boolean(userId),
  });
}

export function useFollow(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Failed to update follow";
      toast.error(message);
    },
  });
}

export function useFeed(page = 1) {
  return useQuery({
    queryKey: ["feed", page],
    queryFn: async () => {
      const response = await api.get("/api/feed", { params: { page } });
      return response.data;
    },
  });
}
