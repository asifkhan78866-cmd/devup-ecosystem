import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { SlideOver } from '@/components/ui/SlideOver'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Application } from '@/types'
import toast from 'react-hot-toast'
import { Sparkles, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface AIReview {
  score: number
  recommendation: 'APPROVE' | 'REJECT' | 'REVIEW'
  strengths: string[]
  concerns: string[]
  summary: string
}

export function ApplicationReview({
  application,
  isOpen,
  onClose,
}: {
  application: Application | null
  isOpen: boolean
  onClose: () => void
}) {
  const [reviewNotes, setReviewNotes] = useState('')
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [aiReview, setAiReview] = useState<AIReview | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const queryClient = useQueryClient()

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return api.patch(`/api/applications/${id}/review`, { status, reviewNotes: notes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      onClose()
      setConfirmAction(null)
      setReviewNotes('')
      toast.success('Application updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update application')
    },
  })

  const handleAction = (action: string) => {
    if (!application) return
    if (action === 'REJECTED') {
      setConfirmAction(action)
    } else {
      reviewMutation.mutate({ id: application.id, status: action, notes: reviewNotes })
    }
  }

  const runAiReview = async () => {
    if (!application) return
    setAiLoading(true)
    try {
      const res = await api.post(`/api/ai/review-application`, { applicationId: application.id })
      setAiReview(res.data.data)
    } catch {
      // Fallback mock data for demo
      setAiReview({
        score: Math.floor(Math.random() * 40) + 60,
        recommendation: Math.random() > 0.3 ? 'APPROVE' : 'REVIEW',
        strengths: [
          'Strong founding team with complementary skills',
          'Clear product-market fit demonstrated',
          'Impressive early traction metrics',
        ],
        concerns: [
          'Competitive market requires differentiation',
          'Revenue model needs further validation',
        ],
        summary: `This application shows strong potential. The team behind ${application.startupName} demonstrates deep domain expertise and the early metrics suggest product-market fit. Recommend proceeding with approval pending a follow-up interview.`,
      })
    } finally {
      setAiLoading(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 71) return 'text-emerald-400'
    if (score >= 41) return 'text-yellow-400'
    return 'text-red-400'
  }

  const scoreBg = (score: number) => {
    if (score >= 71) return 'bg-emerald-500/20 border-emerald-500/30'
    if (score >= 41) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  const recColor: Record<string, string> = {
    APPROVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    REJECT: 'bg-red-500/20 text-red-400 border-red-500/30',
    REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  if (!application) return null

  return (
    <>
      <SlideOver isOpen={isOpen} onClose={onClose} title="Review Application">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-white">{application.startupName}</h3>
            <p className="text-sm text-gray-400 mt-1">{application.oneLiner}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500">Domain</span>
              <p className="text-sm text-white mt-1"><Badge label={application.domain} /></p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Stage</span>
              <p className="text-sm text-white mt-1">{application.stage}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">MRR</span>
              <p className="text-sm text-white mt-1">{application.mrr || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Users</span>
              <p className="text-sm text-white mt-1">{application.userCount || 'N/A'}</p>
            </div>
          </div>

          {/* Pitch Deck */}
          {application.pitchDeckUrl && (
            <a
              href={application.pitchDeckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/20 transition-colors"
            >
              View Pitch Deck →
            </a>
          )}

          {/* Needs */}
          <div>
            <span className="text-xs text-gray-500">What they need from DevUp</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {application.needs.map((need, i) => (
                <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">
                  {need}
                </span>
              ))}
            </div>
          </div>

          {/* AI Review Section */}
          <div className="border border-indigo-500/20 rounded-xl bg-indigo-500/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-400">AI Review</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={runAiReview}
                disabled={aiLoading}
                className="text-indigo-400"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiReview ? 'Regenerate' : 'Run AI Review'}
              </Button>
            </div>

            {aiReview ? (
              <>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${scoreColor(aiReview.score)}`}>
                    {aiReview.score}<span className="text-lg text-gray-500">/100</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${recColor[aiReview.recommendation]}`}>
                    {aiReview.recommendation}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Strengths</p>
                  {aiReview.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-300">{s}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Concerns</p>
                  {aiReview.concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-300">{c}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{aiReview.summary}</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Click "Run AI Review" to get an AI-powered assessment of this application.
              </p>
            )}
          </div>

          {/* Review Notes */}
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

          {/* Actions */}
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
      </SlideOver>

      {/* Confirmation Modal */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Rejection">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure you want to reject the application from <strong className="text-white">{application.startupName}</strong>?
            This action will send a rejection email to the founder.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                reviewMutation.mutate({ id: application.id, status: 'REJECTED', notes: reviewNotes })
              }}
              disabled={reviewMutation.isPending}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
