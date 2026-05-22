import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import type { AdminStats } from '@/types'

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/api/admin/stats')
      return res.data.data
    },
  })
}

export function useAdminAuditLogs(page = 1) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', page],
    queryFn: async () => {
      const res = await api.get(`/api/admin/audit-logs?page=${page}&limit=20`)
      return res.data
    },
  })
}
