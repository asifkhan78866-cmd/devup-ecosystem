import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const MODES = ['ONLINE', 'OFFLINE', 'HYBRID'] as const

const emptyForm = {
  title: '',
  description: '',
  organizer: '',
  subtitle: '',
  prizePool: '',
  mode: 'ONLINE' as string,
  location: '',
  domain: [] as string[],
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  registrationLink: '',
  maxParticipants: '',
  isEcosystemHosted: false,
}

// ISO timestamp -> yyyy-mm-dd for <input type="date">
const toDateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

export default function Hackathons() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showRegistrations, setShowRegistrations] = useState<string | null>(null)
  const [showPartners, setShowPartners] = useState<{ id: string, name: string } | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [domainInput, setDomainInput] = useState('')
  const queryClient = useQueryClient()

  const closeModal = () => { setShowAdd(false); setEditingId(null); setForm(emptyForm); setDomainInput('') }

  const openCreate = () => { setForm(emptyForm); setDomainInput(''); setEditingId(null); setShowAdd(true) }

  const openEdit = (h: any) => {
    setForm({
      title: h.title || '',
      description: h.description || '',
      organizer: h.organizer || '',
      subtitle: h.subtitle || '',
      prizePool: h.prizePool || '',
      mode: h.mode || 'ONLINE',
      location: h.location || '',
      domain: Array.isArray(h.domain) ? h.domain : [],
      startDate: toDateInput(h.startDate),
      endDate: toDateInput(h.endDate),
      registrationDeadline: toDateInput(h.registrationDeadline),
      registrationLink: h.registrationLink || '',
      maxParticipants: h.maxParticipants != null ? String(h.maxParticipants) : '',
      isEcosystemHosted: !!h.isEcosystemHosted,
    })
    setDomainInput('')
    setEditingId(h.id)
    setShowAdd(true)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: async () => {
      const res = await api.get('/api/hackathons?limit=100')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/api/hackathons', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      setShowAdd(false)
      setForm(emptyForm)
      setDomainInput('')
      toast.success('Hackathon created successfully')
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create hackathon'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/hackathons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      toast.success('Hackathon deleted')
    },
    onError: () => toast.error('Failed to delete hackathon'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: Record<string, unknown> }) => 
      api.patch(`/api/hackathons/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      toast.success('Hackathon updated')
    },
    onError: () => toast.error('Failed to update hackathon'),
  })

  const hackathons = data?.data || []

  const handleChange = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addDomain = () => {
    const trimmed = domainInput.trim()
    if (trimmed && !form.domain.includes(trimmed)) {
      setForm(prev => ({ ...prev, domain: [...prev.domain, trimmed] }))
      setDomainInput('')
    }
  }

  const removeDomain = (idx: number) => {
    setForm(prev => ({ ...prev, domain: prev.domain.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim() || !form.description.trim() || !form.organizer.trim()) {
      toast.error('Title, description, and organizer are required')
      return
    }
    if (!form.prizePool.trim()) {
      toast.error('Prize pool is required')
      return
    }
    if (!form.startDate || !form.endDate || !form.registrationDeadline) {
      toast.error('Start date, end date, and registration deadline are required')
      return
    }
    if (form.domain.length === 0) {
      toast.error('At least one domain is required')
      return
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      organizer: form.organizer.trim(),
      prizePool: form.prizePool.trim(),
      mode: form.mode,
      domain: form.domain,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      isEcosystemHosted: form.isEcosystemHosted,
    }

    if (editingId) {
      // On edit, send null to clear optional fields that were emptied.
      payload.subtitle = form.subtitle.trim() || null
      payload.location = form.location.trim() || null
      payload.registrationLink = form.registrationLink.trim() || null
      payload.maxParticipants =
        form.maxParticipants && Number(form.maxParticipants) > 0 ? Number(form.maxParticipants) : null
      updateMutation.mutate({ id: editingId, payload }, { onSuccess: closeModal })
    } else {
      if (form.subtitle.trim()) payload.subtitle = form.subtitle.trim()
      if (form.location.trim()) payload.location = form.location.trim()
      if (form.registrationLink.trim()) payload.registrationLink = form.registrationLink.trim()
      if (form.maxParticipants && Number(form.maxParticipants) > 0) {
        payload.maxParticipants = Number(form.maxParticipants)
      }
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Hackathons" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label={`${hackathons.length} hackathons`} />
          <Button variant="primary" size="md" onClick={openCreate}>+ Add Hackathon</Button>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No hackathons yet</div>
          ) : (
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Mode</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Prize</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Registrations</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Featured</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons.map((h: any) => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{h.title}</div>
                      <div className="text-xs text-gray-500">{h.organizer}</div>
                    </td>
                    <td className="px-6 py-4"><Badge label={h.mode} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{h.prizePool}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setShowRegistrations(h.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-sm font-medium"
                      >
                        {h._count?.leads || 0} Leads <span className="text-xs opacity-75">View →</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => updateMutation.mutate({ id: h.id, payload: { isFeatured: !h.isFeatured } })}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${h.isFeatured ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent border-white/20'}`}
                      >
                        {h.isFeatured && <span className="text-white text-[10px]">✓</span>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowPartners({ id: h.id, name: h.title })}>Partners</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(h)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => { if (window.confirm(`Delete "${h.title}"? This also removes its leads and partners. This cannot be undone.`)) deleteMutation.mutate(h.id) }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Hackathon Modal */}
      <Modal isOpen={showAdd} onClose={closeModal} title={editingId ? 'Edit Hackathon' : 'Add Hackathon'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title *</label>
            <input
              value={form.title} onChange={(e) => handleChange('title', e.target.value)} required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              placeholder="Hackathon Title"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description *</label>
            <textarea
              value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500 resize-none"
              placeholder="Full description of the hackathon..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Subtitle / Tagline</label>
            <input
              value={form.subtitle} onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              placeholder="36-Hour Non-Stop Offline National Innovation Challenge"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Organizer *</label>
              <input
                value={form.organizer} onChange={(e) => handleChange('organizer', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="DevUp Ecosystem"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prize Pool *</label>
              <input
                value={form.prizePool} onChange={(e) => handleChange('prizePool', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="₹1,00,000+"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mode *</label>
              <select
                value={form.mode} onChange={(e) => handleChange('mode', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {MODES.map(m => <option key={m} value={m} className="bg-[#0d0d0d]">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <input
                value={form.location} onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="Hyderabad, India"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date *</label>
              <input
                type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date *</label>
              <input
                type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reg. Deadline *</label>
              <input
                type="date" value={form.registrationDeadline} onChange={(e) => handleChange('registrationDeadline', e.target.value)} required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Domains *</label>
            <div className="flex gap-2 mb-2">
              <input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDomain() } }}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="Type a domain and press Enter"
              />
              <Button variant="ghost" size="sm" type="button" onClick={addDomain}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.domain.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-gray-300">
                  {d}
                  <button type="button" onClick={() => removeDomain(i)} className="text-red-400 hover:text-red-300 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Registration Link</label>
              <input
                value={form.registrationLink} onChange={(e) => handleChange('registrationLink', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="https://forms.gle/..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Participants</label>
              <input
                type="number" value={form.maxParticipants} onChange={(e) => handleChange('maxParticipants', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="isEcosystemHosted" checked={form.isEcosystemHosted}
              onChange={(e) => handleChange('isEcosystemHosted', e.target.checked)}
              className="w-4 h-4 rounded border-white/10"
            />
            <label htmlFor="isEcosystemHosted" className="text-xs text-gray-400">Ecosystem Hosted</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId
                ? (updateMutation.isPending ? 'Saving...' : 'Save Changes')
                : (createMutation.isPending ? 'Creating...' : 'Create Hackathon')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Registrations Modal */}
      {showRegistrations && (
        <RegistrationsModal 
          hackathonId={showRegistrations} 
          onClose={() => setShowRegistrations(null)} 
          hackathonName={hackathons.find((h: any) => h.id === showRegistrations)?.title || 'Hackathon'}
        />
      )}

      {/* Partners Modal */}
      {showPartners && (
        <PartnersModal
          hackathon={showPartners}
          onClose={() => setShowPartners(null)}
        />
      )}
    </div>
  )
}

function RegistrationsModal({ hackathonId, onClose, hackathonName }: { hackathonId: string, onClose: () => void, hackathonName: string }) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['hackathon-leads', hackathonId],
    queryFn: async () => {
      const res = await api.get(`/api/hackathons/${hackathonId}/leads`)
      return res.data
    },
    enabled: !!hackathonId
  })

  const leads = data?.data || []
  
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads
    const s = search.toLowerCase()
    return leads.filter((l: any) => 
      l.name.toLowerCase().includes(s) || 
      l.college.toLowerCase().includes(s)
    )
  }, [leads, search])

  const handleExportCSV = () => {
    if (leads.length === 0) return
    const headers = ['Name', 'Phone', 'Team Size', 'College', 'Registered At', 'Status']
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map((l: any) => [
        `"${l.name}"`,
        `"${l.phone}"`,
        l.teamCount,
        `"${l.college}"`,
        `"${format(new Date(l.createdAt), 'dd MMM yyyy, h:mm a')}"`,
        `"${l.redirectedAt ? 'Redirected' : 'Captured'}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${hackathonName.replace(/\s+/g, '_')}_leads.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Registrations: ${hackathonName}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or college..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Total Members: <span className="text-white font-bold">{filteredLeads.reduce((acc: number, l: any) => acc + (l.teamCount || 0), 0)}</span></div>
            <Button variant="primary" size="sm" onClick={handleExportCSV} disabled={leads.length === 0}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-x-auto max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {search ? 'No registrations match your search.' : 'No website registrations yet.'}
            </div>
          ) : (
            <table className="w-full whitespace-nowrap">
              <thead className="sticky top-0 bg-[#0d0d0d] z-10 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Team Size</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">College</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Registered At</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l: any, i: number) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{l.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{l.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{l.teamCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{l.college}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{format(new Date(l.createdAt), 'dd MMM yyyy, h:mm a')}</td>
                    <td className="px-4 py-3">
                      {l.redirectedAt ? (
                        <span className="inline-flex px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">Redirected to form</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-xs">Captured</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  )
}

function PartnersModal({ hackathon, onClose }: { hackathon: { id: string, name: string }, onClose: () => void }) {
  const [form, setForm] = useState({ name: '', order: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['hackathon', hackathon.id],
    queryFn: async () => {
      const res = await api.get(`/api/hackathons/${hackathon.id}`)
      return res.data
    }
  })

  const partners = data?.data?.partners || []

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/api/hackathons/${hackathon.id}/partners`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] })
      setForm({ name: '', order: '' })
      toast.success('Partner added')
    },
    onError: () => toast.error('Failed to add partner'),
  })

  const deleteMutation = useMutation({
    mutationFn: (pid: string) => api.delete(`/api/hackathons/${hackathon.id}/partners/${pid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] })
      toast.success('Partner removed')
    },
    onError: () => toast.error('Failed to remove partner'),
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ pid, file }: { pid: string, file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/api/hackathons/${hackathon.id}/partners/${pid}/logo`, formData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] })
      toast.success('Logo uploaded')
    },
    onError: () => toast.error('Failed to upload logo'),
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    createMutation.mutate({ name: form.name.trim(), order: form.order ? Number(form.order) : 0 })
  }

  const handleFileChange = (pid: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate({ pid, file: e.target.files[0] })
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Partners: ${hackathon.name}`}>
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Partner Name" required
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
            placeholder="Order"
            className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
          />
          <Button variant="primary" type="submit" disabled={createMutation.isPending}>Add</Button>
        </form>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading partners...</div>
          ) : partners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No partners added yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Order</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Logo</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Name</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p: any) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-gray-400">{p.order}</td>
                    <td className="px-4 py-3">
                      <div className="relative group w-10 h-10 bg-black border border-white/10 rounded overflow-hidden flex items-center justify-center">
                        {p.logoUrl ? (
                          <img src={p.logoUrl} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-xs text-gray-600">No Logo</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <span className="text-[10px] text-white font-medium">Upload</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(p.id, e)} />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate(p.id)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  )
}
