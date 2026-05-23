import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ApplicationReview } from '@/components/ApplicationReview'
import type { Application } from '@/types'

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<Application | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      const res = await api.get(`/api/applications${params}`)
      return res.data
    },
  })

  const statuses = ['ALL', 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED']
  const applications: Application[] = data?.data || []

  const getAiScoreColor = (score?: number) => {
    if (!score) return ''
    if (score >= 71) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (score >= 41) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Applications" />
      <div className="p-6 space-y-6">
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-500 hover:text-white bg-white/5 border border-white/5'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <Badge label={`${applications.length} total`} />
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-500 text-lg">No applications found</p>
              <p className="text-gray-700 text-sm mt-1">Applications will appear here when founders apply</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Startup</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Domain</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Stage</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">AI Score</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{app.startupName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{app.oneLiner}</div>
                    </td>
                    <td className="px-6 py-4"><Badge label={app.domain} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{app.stage}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">—</span>
                    </td>
                    <td className="px-6 py-4"><Badge label={app.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(app)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Slide-Over */}
      <ApplicationReview
        application={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
