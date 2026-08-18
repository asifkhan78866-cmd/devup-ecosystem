import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/SlideOver'
import type { LeadApplication, LeadershipApplicationStatus } from '@/types'

const statuses: Array<'ALL' | LeadershipApplicationStatus> = [
  'ALL',
  'PENDING',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEWING',
  'SELECTED',
  'REJECTED',
]

const roleLabels: Record<LeadApplication['role'], string> = {
  STATE_DIRECTOR: 'State Director',
  REGIONAL_DIRECTOR: 'Regional Director',
  CITY_DIRECTOR: 'City Director',
  CAMPUS_DIRECTOR: 'Campus Director',
}

const statusLabels: Record<LeadershipApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWING: 'Reviewing',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWING: 'Interviewing',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
}

function csvCell(value: string | null | undefined) {
  return `"${(value ?? '').replace(/"/g, '""')}"`
}

export default function LeadApplications() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeadershipApplicationStatus>('ALL')
  const [selected, setSelected] = useState<LeadApplication | null>(null)
  const [reviewStatus, setReviewStatus] = useState<LeadershipApplicationStatus>('PENDING')
  const [reviewNotes, setReviewNotes] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['lead-applications', statusFilter],
    queryFn: async () => {
      const params = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`
      const response = await api.get(`/api/lead-applications${params}`)
      return response.data as { data: LeadApplication[] }
    },
  })

  const applications = data?.data ?? []

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: LeadershipApplicationStatus; notes: string }) => {
      const response = await api.patch(`/api/lead-applications/${id}/status`, {
        status,
        reviewNotes: notes.trim() || undefined,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Application status updated')
      queryClient.invalidateQueries({ queryKey: ['lead-applications'] })
      setSelected(null)
    },
    onError: () => toast.error('Could not update the application status'),
  })

  const openReview = (application: LeadApplication) => {
    setSelected(application)
    setReviewStatus(application.status)
    setReviewNotes(application.reviewNotes ?? '')
  }

  const exportCsv = () => {
    const headers = [
      'Application no.', 'Name', 'Role', 'Email', 'Phone', 'State', 'City', 'College',
      'Branch', 'Year of study', 'Status', 'Submitted at', 'Why lead', 'Experience', '30-day plan', 'Review notes',
    ]
    const rows = applications.map((application) => [
      application.applicationNo,
      application.fullName,
      roleLabels[application.role],
      application.email,
      application.phone,
      application.state,
      application.city,
      application.college,
      application.branch,
      application.yearOfStudy,
      statusLabels[application.status],
      new Date(application.createdAt).toLocaleString(),
      application.whyLead,
      application.pastExperience,
      application.first30DaysPlan,
      application.reviewNotes,
    ])
    const csv = [headers, ...rows].map((row) => row.map((value) => csvCell(String(value ?? ''))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `devup-lead-applications-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Lead Applications" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-500 hover:text-white bg-white/5 border border-white/5'
              }`}
            >
              {status === 'ALL' ? 'All' : statusLabels[status]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <Badge label={`${applications.length} total`} />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={applications.length === 0}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, index) => <div key={index} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : isError ? (
            <div className="p-16 text-center">
              <p className="text-red-400 text-lg">Could not load Lead DevUp applications</p>
              <p className="text-gray-500 text-sm mt-1">{error instanceof Error ? error.message : 'Please refresh and try again.'}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-500 text-lg">No Lead DevUp applications found</p>
              <p className="text-gray-700 text-sm mt-1">New applications will appear here after a successful public-form submission.</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Applicant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">College & location</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Submitted</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{application.fullName}</div>
                      <div className="text-xs text-gray-500">{application.email}</div>
                    </td>
                    <td className="px-6 py-4"><Badge label={roleLabels[application.role]} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div>{application.college}</div>
                      <div className="text-xs text-gray-500">{application.city}, {application.state}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(application.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><Badge label={application.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openReview(application)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SlideOver isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Review Lead Application">
        {selected && (
          <div className="space-y-6">
            <section className="space-y-1">
              <p className="text-xs font-mono text-indigo-400">{selected.applicationNo}</p>
              <h3 className="text-xl font-bold text-white">{selected.fullName}</h3>
              <p className="text-sm text-gray-400">{roleLabels[selected.role]} · {selected.college}</p>
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-600">Email</p><a className="text-indigo-300 break-all" href={`mailto:${selected.email}`}>{selected.email}</a></div>
              <div><p className="text-xs text-gray-600">Phone</p><a className="text-indigo-300" href={`tel:${selected.phone}`}>{selected.phone}</a></div>
              <div><p className="text-xs text-gray-600">Location</p><p className="text-gray-300">{selected.city}, {selected.state}</p></div>
              <div><p className="text-xs text-gray-600">Study</p><p className="text-gray-300">{[selected.branch, selected.yearOfStudy].filter(Boolean).join(' · ') || 'Not provided'}</p></div>
            </section>

            <section><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Why they want to lead</p><p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap">{selected.whyLead}</p></section>
            {selected.pastExperience && <section><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Past experience</p><p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap">{selected.pastExperience}</p></section>}
            {selected.first30DaysPlan && <section><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">First 30-day plan</p><p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap">{selected.first30DaysPlan}</p></section>}

            <section className="space-y-3 border-t border-white/5 pt-5">
              <label className="block text-sm font-medium text-white">Application status</label>
              <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as LeadershipApplicationStatus)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                {statuses.filter((status): status is LeadershipApplicationStatus => status !== 'ALL').map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
              <label className="block text-sm font-medium text-white">Review notes</label>
              <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={4} placeholder="Internal notes for this application" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
              <Button className="w-full" isLoading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: selected.id, status: reviewStatus, notes: reviewNotes })}>Save review</Button>
            </section>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
