import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api.js";

export function useModules(filters = {}) {
  return useQuery({
    queryKey: ["modules", filters],
    queryFn: async () => {
      const params = {};
      if (filters.phase_type) params.phase_type = filters.phase_type;
      if (filters.search) params.search = filters.search;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.author_id) params.author_id = filters.author_id;
      const { data } = await api.get("/api/modules", { params });
      return data;
    },
  });
}

export function useMyModules() {
  return useQuery({
    queryKey: ["modules", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/api/modules/mine");
      return data;
    },
  });
}

export function useModule(id) {
  return useQuery({
    queryKey: ["module", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/modules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/api/modules", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module created");
    },
    onError: () => toast.error("Failed to create module"),
  });
}

export function useUpdateModule(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.patch(`/api/modules/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["module", id] });
      toast.success("Module updated");
    },
    onError: () => toast.error("Failed to update module"),
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/modules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module deleted");
    },
    onError: () => toast.error("Failed to delete module"),
  });
}

export function useLikeModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/api/modules/${id}/like`).then((r) => r.data),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["module", id] });
    },
    onError: () => toast.error("Failed to like module"),
  });
}

export function useFavouriteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(`/api/modules/${id}/favourite`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(
        data.favourited ? "Added to favourites" : "Removed from favourites",
      );
    },
    onError: () => toast.error("Failed to update favourite"),
  });
}

export function useExpandModuleIntoSession(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId) =>
      api
        .post(`/api/sessions/${sessionId}/modules/${moduleId}`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      toast.success("Module added to session");
    },
    onError: () => toast.error("Failed to add module"),
  });
}
