import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api.js'

function buildSessionParams(filters = {}) {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.age_range) params.age_range = filters.age_range
  if (filters.skill_level) params.skill_level = filters.skill_level
  if (filters.author_id) params.author_id = filters.author_id
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  return params
}

export function useSessions(filters = {}) {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const response = await api.get('/api/sessions', { params: buildSessionParams(filters) })
      return response.data
    },
  })
}

export function useMySessions(filters = {}) {
  return useQuery({
    queryKey: ['sessions', 'mine', filters],
    queryFn: async () => {
      const response = await api.get('/api/sessions/mine', { params: buildSessionParams(filters) })
      return response.data
    },
  })
}

export function useSession(id) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const response = await api.get(`/api/sessions/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/sessions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session created successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create session'
      toast.error(message)
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(`/api/sessions/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', data.id] })
      toast.success('Session updated successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update session'
      toast.error(message)
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/sessions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete session'
      toast.error(message)
    },
  })
}

export function useLikeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/api/sessions/${id}/like`)
      return response.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to like session'
      toast.error(message)
    },
  })
}

export function useAddDrillToSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, data }) => {
      const response = await api.post(`/api/sessions/${sessionId}/drills`, data)
      return response.data
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to add drill to session'
      toast.error(message)
    },
  })
}

export function useReorderSessionDrills() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, drill_session_ids }) => {
      const response = await api.patch(`/api/sessions/${sessionId}/drills`, { drill_session_ids })
      return response.data
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to reorder drills'
      toast.error(message)
    },
  })
}

export function useUpdateDrillInSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, drillSessionId, data }) => {
      const response = await api.patch(`/api/sessions/${sessionId}/drills/${drillSessionId}`, data)
      return response.data
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update drill in session'
      toast.error(message)
    },
  })
}

export function useDuplicateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId) => api.post(`/api/sessions/${sessionId}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'mine'] })
      toast.success('Session duplicated — find it in My Sessions')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to duplicate session'
      toast.error(message)
    },
  })
}

export function useRemoveDrillFromSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, drillSessionId }) => {
      const response = await api.delete(`/api/sessions/${sessionId}/drills/${drillSessionId}`)
      return response.data
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to remove drill from session'
      toast.error(message)
    },
  })
}
