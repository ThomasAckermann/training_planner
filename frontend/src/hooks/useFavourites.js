import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api.js";

export function useMyFavourites() {
  return useQuery({
    queryKey: ["favourites", "mine"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/favourites");
      return res.data;
    },
  });
}

export function useFavouriteDrill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (drillId) =>
      api.post(`/api/drills/${drillId}/favourite`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(
        data.favourited ? "Added to favourites" : "Removed from favourites",
      );
    },
    onError: () => toast.error("Failed to update favourite"),
  });
}

export function useFavouriteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) =>
      api.post(`/api/sessions/${sessionId}/favourite`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(
        data.favourited ? "Added to favourites" : "Removed from favourites",
      );
    },
    onError: () => toast.error("Failed to update favourite"),
  });
}
