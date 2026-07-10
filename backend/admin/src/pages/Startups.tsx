import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Startup } from '@/types'
import { ShieldCheck, Shield, Upload, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

function LogoUpload({ value, onChange, error }: {
  value: File | string | null
  onChange: (file: File) => void
  error?: string
}) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : value instanceof File ? URL.createObjectURL(value) : null
  )

  const handleFile = (file: File) => {
    onChange(file)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        fontFamily: 'Inter', fontSize: 13, color: '#a1a1a1',
        marginBottom: 8, display: 'block',
      }}>
        Startup Logo <span style={{ color: '#c8f135' }}>*</span>
        <span style={{ color: '#6b6b6b', marginLeft: 6 }}>required</span>
      </label>

      <div
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          width: 100, height: 100,
          border: `1px dashed ${error ? '#ef4444' : 'rgba(200,241,53,0.25)'}`,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          background: '#0a0a0a',
        }}
        onClick={() => document.getElementById('logo-input')?.click()}
      >
        {preview ? (
          <img src={preview} alt="logo preview" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Upload size={20} color="#6b6b6b" />
        )}
        <input
          id="logo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {error && (
        <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
          {error}
        </p>
      )}
      <p style={{ color: '#3d3d3d', fontSize: 11, marginTop: 6 }}>
        JPEG, PNG, or WEBP. Max 2MB. Square images work best.
      </p>
    </div>
  )
}

function ScreenshotUpload({ files, onAdd, onRemove }: {
  files: (File | string)[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        fontFamily: 'Inter', fontSize: 13, color: '#a1a1a1',
        marginBottom: 8, display: 'block',
      }}>
        Product Screenshots
        <span style={{ color: '#6b6b6b', marginLeft: 6 }}>
          optional, up to 6
        </span>
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {files.map((file, i) => (
          <div key={i} style={{
            width: 80, height: 80, borderRadius: 10,
            position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <img
              src={typeof file === 'string' ? file : URL.createObjectURL(file)}
              alt={`screenshot ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)', border: 'none',
                color: '#fff', fontSize: 11, cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        ))}

        {files.length < 6 && (
          <div
            onClick={() => document.getElementById('screenshot-input')?.click()}
            style={{
              width: 80, height: 80, borderRadius: 10,
              border: '1px dashed rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} color="#6b6b6b" />
            <input
              id="screenshot-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) onAdd(Array.from(e.target.files))
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AiResearchButton({ 
  websiteUrl, startupName, startupId, onResult 
}: {
  websiteUrl: string
  startupName: string
  startupId?: string
  onResult: (analysis: any) => void
}) {
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Crawling website...')
  const [error, setError] = useState<string | null>(null)

  const handleResearch = async () => {
    if (!websiteUrl || !startupName) {
      setError('Enter website URL and startup name first')
      return
    }
    setError(null)
    setLoading(true)

    const messages = [
      'Crawling website...',
      'Searching the web...',
      'Synthesizing analysis...',
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingText(messages[i])
    }, 2500)

    try {
      let formattedUrl = websiteUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const res = await api.post('/api/ai/research-startup', { startupId, startupName, websiteUrl: formattedUrl })
      onResult(res.data.data.analysis)
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors?.[0]?.message || err.response?.data?.error || err.message || 'Research failed'
      setError(errorMessage)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={handleResearch}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: loading ? '#1a1a1a' : 'rgba(200,241,53,0.1)',
          border: '1px solid rgba(200,241,53,0.25)',
          borderRadius: 8, color: '#c8f135',
          fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              border: '2px solid rgba(200,241,53,0.2)',
              borderTopColor: '#c8f135',
              animation: 'spin 0.8s linear infinite',
            }} />
            {loadingText}
          </>
        ) : (
          <>🔍 Research with AI</>
        )}
      </button>
      {error && (
        <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function AiResultPreview({ analysis, onInsertOverview }: {
  analysis: any
  onInsertOverview: (text: string) => void
}) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(200,241,53,0.15)',
      borderRadius: 12, padding: 20, marginTop: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ fontFamily: 'Syne', fontSize: 14, 
          fontWeight: 700, color: '#c8f135' }}>
          AI Analysis Result
        </span>
        <span style={{
          fontFamily: 'Inter', fontSize: 11,
          padding: '2px 8px', borderRadius: 4,
          background: analysis.confidence === 'high' 
            ? 'rgba(34,197,94,0.1)' 
            : analysis.confidence === 'medium'
            ? 'rgba(245,158,11,0.1)'
            : 'rgba(239,68,68,0.1)',
          color: analysis.confidence === 'high' 
            ? '#22c55e' 
            : analysis.confidence === 'medium' ? '#f59e0b' : '#ef4444',
        }}>
          {analysis.confidence} confidence
        </span>
      </div>

      <p style={{ fontFamily: 'Inter', fontSize: 13, 
        color: '#a1a1a1', lineHeight: 1.6, marginBottom: 12 }}>
        {analysis.overview}
      </p>

      <button
        type="button"
        onClick={() => onInsertOverview(analysis.overview)}
        style={{
          fontSize: 12, color: '#c8f135', background: 'none',
          border: 'none', cursor: 'pointer', textDecoration: 'underline',
        }}
      >
        Use this as the startup description →
      </button>

      {analysis.redFlags?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#6b6b6b', 
            textTransform: 'uppercase' }}>
            Flags to review
          </span>
          {analysis.redFlags.map((flag: string, i: number) => (
            <p key={i} style={{ fontSize: 12, color: '#f59e0b', 
              marginTop: 4 }}>
              ⚠ {flag}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

const DOMAINS = [
  { label: 'AI/ML', value: 'AI_ML' },
  { label: 'FinTech', value: 'FINTECH' },
  { label: 'EdTech', value: 'EDTECH' },
  { label: 'HealthTech', value: 'HEALTHTECH' },
  { label: 'DevTools', value: 'DEVTOOLS' },
  { label: 'SaaS', value: 'SAAS' },
  { label: 'Web3', value: 'WEB3' },
  { label: 'E-commerce', value: 'E_COMMERCE' },
  { label: 'CleanTech', value: 'CLEANTECH' },
  { label: 'DeepTech', value: 'DEEPTECH' },
  { label: 'Other', value: 'OTHER' }
]

const STAGES = [
  { label: 'Idea', value: 'IDEA' },
  { label: 'MVP', value: 'MVP' },
  { label: 'Pre-Seed', value: 'PRE_SEED' },
  { label: 'Seed', value: 'SEED' },
  { label: 'Series A', value: 'SERIES_A' },
  { label: 'Series B', value: 'SERIES_B' },
  { label: 'Growth', value: 'GROWTH' }
]

const HEADCOUNTS = ['1-5', '6-15', '16-50', '51-100', '100+']

const emptyForm = {
  name: '', slug: '', tagline: '', description: '', domain: 'AI_ML', stage: 'MVP',
  foundedYear: new Date().getFullYear(), headcount: '1-5', location: '', website: '', githubUrl: '',
  founderNames: [] as string[],
}

function InviteFounder({ startupId }: { startupId: string }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const trimmed = email.trim()
    if (!trimmed) { toast.error('Enter an email'); return }
    setSending(true)
    try {
      await api.post(`/api/startups/${startupId}/invite`, { email: trimmed })
      toast.success(`Invite sent to ${trimmed}`)
      setEmail('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="pt-4 border-t border-white/5">
      <label className="block text-xs text-gray-500 mb-1">Invite Founder (login-linked owner)</label>
      <p className="text-xs text-gray-600 mb-2">
        Emails an invite; on accept they get a real account linked as an OWNER of this startup —
        separate from the display &ldquo;Founder Names&rdquo; above.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
          placeholder="founder@startup.com"
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
        />
        <Button variant="primary" type="button" onClick={send} disabled={sending}>
          {sending ? 'Sending...' : 'Send Invite'}
        </Button>
      </div>
    </div>
  )
}

export default function Startups() {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<Startup | null>(null)
  const [logoFile, setLogoFile] = useState<File | string | null>(null)
  const [screenshotFiles, setScreenshotFiles] = useState<(File | string)[]>([])
  const [logoError, setLogoError] = useState<string>()
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      const res = await api.get('/api/startups?limit=100')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/api/startups', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setShowAdd(false)
      setForm(emptyForm)
      setLogoFile(null)
      setScreenshotFiles([])
      setAiAnalysis(null)
      toast.success('Startup created successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create startup'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string, formData: FormData }) => api.patch(`/api/startups/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      setShowAdd(false)
      setEditId(null)
      setForm(emptyForm)
      setLogoFile(null)
      setScreenshotFiles([])
      setAiAnalysis(null)
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
      githubUrl: s.githubUrl || '', founderNames: (s as any).founderNames || [],
    })
    setEditId(s.id)
    setLogoFile(s.logoUrl || null)
    setScreenshotFiles(s.screenshotUrls || [])
    setAiAnalysis(null)
    setLogoError(undefined)
    setShowAdd(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.tagline.trim()) {
      toast.error('Name and tagline are required')
      return
    }
    if (!logoFile && !editId) {
      setLogoError('A logo is required')
      return
    }

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'founderNames') {
        formData.append(k, JSON.stringify(v))
      } else {
        formData.append(k, String(v))
      }
    })
    if (logoFile instanceof File) formData.append('logo', logoFile)
    screenshotFiles.forEach((f) => {
      if (f instanceof File) formData.append('screenshots', f)
    })

    if (editId) {
      updateMutation.mutate({ id: editId, formData })
    } else {
      createMutation.mutate(formData)
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
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
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Startup Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditId(null); setForm(emptyForm); setLogoFile(null); setScreenshotFiles([]); setAiAnalysis(null); setLogoError(undefined) }} title={editId ? 'Edit Startup' : 'Add Startup'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LogoUpload 
            value={logoFile} 
            onChange={(f) => { setLogoFile(f); setLogoError(undefined) }} 
            error={logoError} 
          />
          <ScreenshotUpload 
            files={screenshotFiles} 
            onAdd={(newFiles) => setScreenshotFiles(prev => [...prev, ...newFiles].slice(0, 6))}
            onRemove={(index) => setScreenshotFiles(prev => prev.filter((_, i) => i !== index))}
          />

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
            {aiAnalysis && (
              <AiResultPreview 
                analysis={aiAnalysis} 
                onInsertOverview={(text) => handleChange('description', text)} 
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Domain</label>
              <select
                value={form.domain} onChange={(e) => handleChange('domain', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {DOMAINS.map(d => <option key={d.value} value={d.value} className="bg-[#0d0d0d]">{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stage</label>
              <select
                value={form.stage} onChange={(e) => handleChange('stage', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
              >
                {STAGES.map(s => <option key={s.value} value={s.value} className="bg-[#0d0d0d]">{s.label}</option>)}
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
              <AiResearchButton 
                websiteUrl={form.website} 
                startupName={form.name} 
                startupId={editId || undefined}
                onResult={(res) => setAiAnalysis(res)}
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-gray-500">Founder Names (up to 4)</label>
              {form.founderNames.length < 4 && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, founderNames: [...prev.founderNames, ''] }))}
                  className="text-[#c8f135] text-xs font-medium hover:underline"
                >
                  + Add Founder
                </button>
              )}
            </div>
            <div className="space-y-2">
              {form.founderNames.map((founder, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={founder}
                    onChange={(e) => {
                      const newFounders = [...form.founderNames]
                      newFounders[index] = e.target.value
                      setForm(prev => ({ ...prev, founderNames: newFounders }))
                    }}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500"
                    placeholder={`Founder ${index + 1} Name`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newFounders = form.founderNames.filter((_, i) => i !== index)
                      setForm(prev => ({ ...prev, founderNames: newFounders }))
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-red-400 hover:bg-white/10"
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.founderNames.length === 0 && (
                <p className="text-xs text-gray-600 italic">No founders added yet.</p>
              )}
            </div>
          </div>

          {editId && <InviteFounder startupId={editId} />}

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
