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

const DOMAINS = ['AI/ML', 'Fintech', 'EdTech', 'HealthTech', 'SaaS', 'Web3', 'E-commerce', 'CleanTech', 'DeepTech', 'Other']
const STAGES = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Growth']
const HEADCOUNTS = ['1-5', '6-15', '16-50', '51-100', '100+']

const emptyForm = {
  name: '', slug: '', tagline: '', description: '', domain: 'AI/ML', stage: 'MVP',
  foundedYear: new Date().getFullYear(), headcount: '1-5', location: '', website: '', githubUrl: '',
}

export default function Startups() {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<Startup | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      const res = await api.get('/api/startups?limit=100')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/api/startups', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setShowAdd(false)
      setForm(emptyForm)
      toast.success('Startup created successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create startup'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: typeof form & { id: string }) => api.patch(`/api/startups/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setShowAdd(false)
      setEditId(null)
      setForm(emptyForm)
      toast.success('Startup updated successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update startup'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/startups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setConfirmDelete(null)
      toast.success('Startup removed')
    },
    onError: () => toast.error('Failed to remove startup'),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/startups/${id}`, { isVerified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.success('Startup verified')
    },
    onError: () => toast.error('Failed to verify startup'),
  })

  const startups: Startup[] = data?.data || []

  const openEdit = (s: Startup) => {
    setForm({
      name: s.name, slug: s.slug, tagline: s.tagline, description: s.description,
      domain: s.domain, stage: s.stage, foundedYear: s.foundedYear,
      headcount: s.headcount, location: s.location, website: s.website || '',
      githubUrl: '',
    })
    setEditId(s.id)
    setShowAdd(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.tagline.trim()) {
      toast.error('Name and tagline are required')
      return
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleChange = (key: string, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'name' && !editId) {
      setForm(prev => ({ ...prev, slug: (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Startups" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label={`${startups.length} startups`} />
          <Button variant="primary" size="md" onClick={() => { setForm(emptyForm); setEditId(null); setShowAdd(true) }}>+ Add Startup</Button>
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
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Jobs</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Founded</th>
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
                        <button onClick={() => verifyMutation.mutate(s.id)} className="cursor-pointer" title="Click to verify">
                          <Shield className="w-5 h-5 text-gray-600 hover:text-emerald-400 transition-colors" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{s.jobs?.length || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{s.foundedYear}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(s)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Startup Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditId(null); setForm(emptyForm) }} title={editId ? 'Edit Startup' : 'Add Startup'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input
                value={form.name} onChange={(e) => handleChange('name', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="NexusAI"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug</label>
              <input
                value={form.slug} onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="nexus-ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tagline *</label>
            <input
              value={form.tagline} onChange={(e) => handleChange('tagline', e.target.value)} required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              placeholder="AI-powered document analysis for enterprises"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500 resize-none"
              placeholder="Full description of the startup..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Domain</label>
              <select
                value={form.domain} onChange={(e) => handleChange('domain', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {DOMAINS.map(d => <option key={d} value={d} className="bg-[#0d0d0d]">{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stage</label>
              <select
                value={form.stage} onChange={(e) => handleChange('stage', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {STAGES.map(s => <option key={s} value={s} className="bg-[#0d0d0d]">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Headcount</label>
              <select
                value={form.headcount} onChange={(e) => handleChange('headcount', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {HEADCOUNTS.map(h => <option key={h} value={h} className="bg-[#0d0d0d]">{h}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Founded Year</label>
              <input
                type="number" value={form.foundedYear} onChange={(e) => handleChange('foundedYear', parseInt(e.target.value) || 2024)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <input
                value={form.location} onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="Bangalore, India"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Website</label>
              <input
                value={form.website} onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="https://nexusai.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">GitHub</label>
              <input
                value={form.githubUrl} onChange={(e) => handleChange('githubUrl', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="https://github.com/nexusai"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
            <Button variant="ghost" onClick={() => { setShowAdd(false); setEditId(null); setForm(emptyForm) }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editId ? 'Update Startup' : 'Create Startup'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure you want to remove <strong className="text-white">{confirmDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
