import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api.js";

export function useDrillComments(drillId) {
  return useQuery({
    queryKey: ["comments", "drill", drillId],
    queryFn: async () => {
      const res = await api.get(`/api/drills/${drillId}/comments`);
      return res.data;
    },
    enabled: Boolean(drillId),
  });
}

export function useSessionComments(sessionId) {
  return useQuery({
    queryKey: ["comments", "session", sessionId],
    queryFn: async () => {
      const res = await api.get(`/api/sessions/${sessionId}/comments`);
      return res.data;
    },
    enabled: Boolean(sessionId),
  });
}

export function useCreateDrillComment(drillId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/drills/${drillId}/comments`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", "drill", drillId],
      });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Failed to post comment";
      toast.error(message);
    },
  });
}

export function useCreateSessionComment(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/sessions/${sessionId}/comments`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", "session", sessionId],
      });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Failed to post comment";
      toast.error(message);
    },
  });
}

export function useDeleteComment(queryKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) =>
      api.delete(`/api/comments/${commentId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail || "Failed to delete comment";
      toast.error(message);
    },
  });
}
