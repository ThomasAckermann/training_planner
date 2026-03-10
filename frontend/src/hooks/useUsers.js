import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}`)
      return response.data
    },
    enabled: Boolean(userId),
  })
}
