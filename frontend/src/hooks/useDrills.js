import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api.js'

function buildParams(filters = {}) {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.age_range) params.age_range = filters.age_range
  if (filters.skill_level) params.skill_level = filters.skill_level
  if (filters.focus_area) params.focus_area = filters.focus_area
  if (filters.author_id) params.author_id = filters.author_id
  if (filters.sort_by) params.sort_by = filters.sort_by
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  return params
}

export function useDrills(filters = {}) {
  return useQuery({
    queryKey: ['drills', filters],
    queryFn: async () => {
      const response = await api.get('/api/drills', { params: buildParams(filters) })
      return response.data
    },
  })
}

export function useMyDrills(filters = {}) {
  return useQuery({
    queryKey: ['drills', 'mine', filters],
    queryFn: async () => {
      const response = await api.get('/api/drills/mine', { params: buildParams(filters) })
      return response.data
    },
  })
}

export function useDrill(id) {
  return useQuery({
    queryKey: ['drill', id],
    queryFn: async () => {
      const response = await api.get(`/api/drills/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useCreateDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/drills', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
      toast.success('Drill created successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to create drill'
      toast.error(message)
    },
  })
}

export function useUpdateDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(`/api/drills/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
      queryClient.invalidateQueries({ queryKey: ['drill', data.id] })
      toast.success('Drill updated successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update drill'
      toast.error(message)
    },
  })
}

export function useDeleteDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/drills/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
      toast.success('Drill deleted successfully!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to delete drill'
      toast.error(message)
    },
  })
}

export function useLikeDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/api/drills/${id}/like`)
      return response.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['drill', id] })
      queryClient.invalidateQueries({ queryKey: ['drills'] })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to like drill'
      toast.error(message)
    },
  })
}

export function useSaveDrawing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ drillId, drawingJson, thumbnailDataUrl }) => {
      const formData = new FormData()
      formData.append('drawing_json', drawingJson)

      if (thumbnailDataUrl) {
        const res = await fetch(thumbnailDataUrl)
        const blob = await res.blob()
        formData.append('thumbnail', blob, 'thumbnail.png')
      }

      const response = await api.post(`/api/drills/${drillId}/drawing`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drill', data.id] })
      queryClient.invalidateQueries({ queryKey: ['drills'] })
      toast.success('Drawing saved!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to save drawing'
      toast.error(message)
    },
  })
}
