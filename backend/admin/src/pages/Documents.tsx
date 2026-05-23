import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Document as DocType } from '@/types'
import { FileText, Download, Mail, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const DOC_TYPES = ['NDA', 'EQUITY_AGREEMENT', 'PARTNERSHIP_TERMS', 'OTHER'] as const

export default function Documents() {
  const [showUpload, setShowUpload] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocType | null>(null)
  const [uploadForm, setUploadForm] = useState({ startupId: '', type: 'NDA' as typeof DOC_TYPES[number], name: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/api/documents?limit=100')
      return res.data
    },
  })

  const { data: startupData } = useQuery({
    queryKey: ['startups-list'],
    queryFn: async () => {
      const res = await api.get('/api/startups?limit=100')
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setConfirmDelete(null)
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document'),
  })

  const reminderMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/documents/${id}/remind`),
    onSuccess: () => toast.success('Reminder sent to founder'),
    onError: () => toast.error('Failed to send reminder'),
  })

  const uploadMutation = useMutation({
    mutationFn: (payload: typeof uploadForm) => api.post('/api/documents', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setShowUpload(false)
      setUploadForm({ startupId: '', type: 'NDA', name: '' })
      toast.success('Document uploaded — email sent to founder')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to upload document'),
  })

  const documents: DocType[] = data?.data || []
  const startups = startupData?.data || []

  const statusBadge = (doc: DocType) => {
    if (doc.signedByFounder && doc.signedByAdmin) return 'SIGNED'
    if (doc.status === 'EXPIRED') return 'EXPIRED'
    return 'PENDING'
  }

  const formatType = (type: string) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.startupId) {
      toast.error('Please select a startup')
      return
    }
    if (!uploadForm.name.trim()) {
      toast.error('Please enter a document name')
      return
    }
    uploadMutation.mutate(uploadForm)
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Documents" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label={`${documents.length} documents`} />
          <Button variant="primary" size="md" onClick={() => setShowUpload(true)}>+ Upload Document</Button>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No documents yet</p>
              <p className="text-gray-700 text-sm mt-1">Upload NDAs and agreements for startups to sign</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Startup</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Document</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Uploaded</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Founder</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Admin</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{doc.startup?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-white">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge label={formatType(doc.type)} /></td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${doc.signedByFounder ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <span className="ml-2 text-xs text-gray-400">{doc.signedByFounder ? 'Signed' : 'Pending'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${doc.signedByAdmin ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <span className="ml-2 text-xs text-gray-400">{doc.signedByAdmin ? 'Signed' : 'Pending'}</span>
                    </td>
                    <td className="px-6 py-4"><Badge label={statusBadge(doc)} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {!doc.signedByFounder && (
                          <button onClick={() => reminderMutation.mutate(doc.id)} className="p-1.5 text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer" title="Send Reminder">
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setConfirmDelete(doc)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Select Startup *</label>
            <select
              value={uploadForm.startupId}
              onChange={(e) => setUploadForm(prev => ({ ...prev, startupId: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              required
            >
              <option value="" className="bg-[#0d0d0d]">Choose a startup...</option>
              {startups.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-[#0d0d0d]">{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Document Name *</label>
            <input
              value={uploadForm.name}
              onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              placeholder="NDA Agreement - NexusAI"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Document Type</label>
            <select
              value={uploadForm.type}
              onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value as typeof DOC_TYPES[number] }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t} className="bg-[#0d0d0d]">{formatType(t)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Upload File (PDF)</label>
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-indigo-500/30 transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag and drop your PDF here, or click to browse</p>
              <p className="text-xs text-gray-700 mt-1">PDF files only, max 10MB</p>
              <input type="file" accept=".pdf" className="hidden" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Document">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure you want to delete <strong className="text-white">{confirmDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
