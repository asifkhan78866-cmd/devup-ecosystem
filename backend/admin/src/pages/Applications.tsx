import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/SlideOver'
import { Modal } from '@/components/ui/Modal'
import type { Application } from '@/types'
import toast from 'react-hot-toast'

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ app: Application; action: string } | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      const res = await api.get(`/api/applications${params}`)
      return res.data
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return api.patch(`/api/applications/${id}/review`, { status, reviewNotes: notes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setSelected(null)
      setConfirmAction(null)
      toast.success('Application updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update application')
    },
  })

  const handleAction = (action: string) => {
    if (!selected) return
    if (action === 'REJECTED') {
      setConfirmAction({ app: selected, action })
    } else {
      reviewMutation.mutate({ id: selected.id, status: action, notes: reviewNotes })
    }
  }

  const statuses = ['ALL', 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED']
  const applications: Application[] = data?.data || []

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
          <div className="ml-auto">
            <Badge label={`${applications.length} total`} />
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
                    <td className="px-6 py-4"><Badge label={app.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(app); setReviewNotes('') }}>
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
      <SlideOver isOpen={!!selected} onClose={() => setSelected(null)} title="Review Application">
        {selected && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">{selected.startupName}</h3>
              <p className="text-sm text-gray-400 mt-1">{selected.oneLiner}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Domain</span>
                <p className="text-sm text-white mt-1"><Badge label={selected.domain} /></p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Stage</span>
                <p className="text-sm text-white mt-1">{selected.stage}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">MRR</span>
                <p className="text-sm text-white mt-1">{selected.mrr || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Users</span>
                <p className="text-sm text-white mt-1">{selected.userCount || 'N/A'}</p>
              </div>
            </div>

            {selected.pitchDeckUrl && (
              <a
                href={selected.pitchDeckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/20 transition-colors"
              >
                View Pitch Deck →
              </a>
            )}

            <div>
              <span className="text-xs text-gray-500">What they need from DevUp</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {selected.needs.map((need, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">
                    {need}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 outline-none focus:border-indigo-500 resize-none"
                placeholder="Add review notes..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5">
              <Button variant="success" onClick={() => handleAction('APPROVED')} disabled={reviewMutation.isPending}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => handleAction('REJECTED')} disabled={reviewMutation.isPending}>
                Reject
              </Button>
              <Button variant="outline" onClick={() => handleAction('REVIEWING')} disabled={reviewMutation.isPending}>
                Request More Info
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Confirmation Modal */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Rejection">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure you want to reject the application from <strong className="text-white">{confirmAction?.app.startupName}</strong>?
            This action will send a rejection email to the founder.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmAction) {
                  reviewMutation.mutate({ id: confirmAction.app.id, status: 'REJECTED', notes: reviewNotes })
                }
              }}
              disabled={reviewMutation.isPending}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
