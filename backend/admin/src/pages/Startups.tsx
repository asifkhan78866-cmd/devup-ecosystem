import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Startup } from '@/types'
import { ShieldCheck, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Startups() {
  const [showAdd, setShowAdd] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      const res = await api.get('/api/startups?limit=100')
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/startups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success('Startup removed')
    },
    onError: () => toast.error('Failed to remove startup'),
  })

  const startups: Startup[] = data?.data || []

  return (
    <div className="flex flex-col">
      <TopBar title="Startups" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label={`${startups.length} startups`} />
          <Button variant="primary" size="md" onClick={() => setShowAdd(true)}>+ Add Startup</Button>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : startups.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No startups yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Startup</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Domain</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Stage</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Verified</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {startups.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-white/5" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
                        )}
                        <div>
                          <div className="font-medium text-white">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge label={s.domain} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{s.stage}</td>
                    <td className="px-6 py-4">
                      {s.isVerified ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-gray-600" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => {
                        if (confirm('Delete this startup?')) deleteMutation.mutate(s.id)
                      }}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Startup">
        <p className="text-sm text-gray-400">Startup creation form — connect to POST /api/startups</p>
      </Modal>
    </div>
  )
}
