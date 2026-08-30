import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Plus, Package, EyeOff, Eye, Trash2, GripVertical, Undo2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * The service catalogue.
 *
 * These rows are what the public site renders and what an engagement is
 * created against, so the list a client reads and the list work is sold from
 * cannot drift apart. Adding one used to mean editing a TypeScript file and
 * deploying.
 */

interface Service {
  id: string
  slug: string
  name: string
  category: string
  categoryLabel: string
  short: string
  tagline: string | null
  size: string
  whatsIncluded: string[]
  engagementType: string | null
  priceFrom: number | null
  isActive: boolean
  sortOrder: number
  deletedAt: string | null
  deleteReason: string | null
}

const label = 'block text-[11px] text-white/45 mb-1.5'
const field =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-[#c8f135]/40'

const CATEGORIES = [
  { value: 'tech', label: 'Technology' },
  { value: 'ai', label: 'AI' },
  { value: 'creative', label: 'Creative' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal', label: 'Legal' },
  { value: 'mission', label: 'Mission' },
]

export default function Catalogue() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [showRemoved, setShowRemoved] = useState(false)

  const { data: list, isLoading } = useQuery<Service[]>({
    queryKey: ['catalogue', showRemoved],
    queryFn: async () =>
      (await api.get(`/api/admin/b2b/services?includeRemoved=${showRemoved}`)).data.data,
  })

  const toggle = useMutation({
    mutationFn: async (s: Service) =>
      (await api.patch(`/api/admin/b2b/services/${s.id}`, { isActive: !s.isActive })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogue'] }),
    onError: () => toast.error('Could not update it'),
  })

  const remove = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await api.delete(`/api/admin/b2b/services/${id}`, { data: { reason } })).data.data,
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['catalogue'] })
      // Nothing is deleted. A service that has been sold must keep existing, or
      // the client record of what they bought points at nothing.
      toast.success(
        r.engagements > 0
          ? `Marked removed — ${r.engagements} engagement${r.engagements > 1 ? 's' : ''} still reference it`
          : 'Marked removed'
      )
    },
    onError: () => toast.error('Could not remove it'),
  })

  const restore = useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/admin/b2b/services/${id}/restore`)).data.data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogue'] }); toast.success('Restored') },
    onError: () => toast.error('Could not restore it'),
  })

  const active = (list ?? []).filter((s) => s.isActive && !s.deletedAt)
  const removedCount = (list ?? []).filter((s) => s.deletedAt).length

  return (
    <>
      <TopBar title="Service Catalogue" />

      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-3xl text-sm text-white/50">
            What DevUp sells. These rows render on the public site and are what an engagement is
            created against — {active.length} live of {list?.length ?? 0}.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRemoved((v) => !v)}
              className={`rounded-lg border border-white/[0.07] px-3 py-2 text-[11px] transition ${
                showRemoved ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {showRemoved ? `Showing removed${removedCount ? ` (${removedCount})` : ''}` : 'Show removed'}
            </button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New service
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : !list?.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">Nothing in the catalogue yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            {list.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 ${
                  s.deletedAt ? 'bg-red-500/[0.04]' : s.isActive ? '' : 'opacity-45'
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/15" />
                <button
                  onClick={() => !s.deletedAt && setEditing(s)}
                  disabled={Boolean(s.deletedAt)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-[13.5px] ${s.deletedAt ? 'text-white/40 line-through' : 'text-white/90'}`}>
                      {s.name}
                    </span>
                    {/* Removed rows stay visible and marked rather than
                        vanishing: a row that disappears takes its history with
                        it as far as anyone looking can tell. */}
                    {s.deletedAt && (
                      <span className="shrink-0 rounded bg-red-400/15 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-red-300">
                        Removed
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-white/40">
                    {s.deletedAt
                      ? `${format(new Date(s.deletedAt), 'd MMM yyyy')}${s.deleteReason ? ` — ${s.deleteReason}` : ''}`
                      : s.short}
                  </div>
                </button>
                <span className="hidden shrink-0 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/45 sm:inline">
                  {s.categoryLabel}
                </span>
                <span className="hidden w-24 shrink-0 text-right text-[11px] text-white/30 lg:inline">
                  {s.priceFrom ? `from ₹${(s.priceFrom / 100).toLocaleString('en-IN')}` : '—'}
                </span>
                {s.deletedAt ? (
                  <button
                    onClick={() => restore.mutate(s.id)}
                    title="Put it back"
                    className="shrink-0 rounded p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-[#c8f135]"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => toggle.mutate(s)}
                      title={s.isActive ? 'Hide from the site' : 'Show on the site'}
                      className="shrink-0 rounded p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {s.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt(`Remove "${s.name}"? Say why — it stays on the record.`)
                        if (reason !== null) remove.mutate({ id: s.id, reason })
                      }}
                      className="shrink-0 rounded p-1.5 text-white/25 transition hover:bg-white/[0.06] hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <ServiceForm
          service={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['catalogue'] })
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function ServiceForm({
  service, onClose, onSaved,
}: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: service?.name ?? '',
    category: service?.category ?? 'tech',
    categoryLabel: service?.categoryLabel ?? 'Technology',
    short: service?.short ?? '',
    tagline: service?.tagline ?? '',
    size: service?.size ?? 'small',
    engagementType: service?.engagementType ?? '',
    // Rupees on screen, paise on the wire.
    priceFrom: service?.priceFrom ? String(service.priceFrom / 100) : '',
    whatsIncluded: (service?.whatsIncluded ?? []).join('\n'),
    sortOrder: String(service?.sortOrder ?? 0),
  })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: f.name.trim(),
        category: f.category,
        categoryLabel: f.categoryLabel.trim(),
        short: f.short.trim(),
        tagline: f.tagline.trim() || undefined,
        size: f.size,
        engagementType: f.engagementType.trim() || undefined,
        priceFrom: f.priceFrom ? Math.round(Number(f.priceFrom) * 100) : undefined,
        whatsIncluded: f.whatsIncluded.split('\n').map((x) => x.trim()).filter(Boolean),
        sortOrder: Number(f.sortOrder) || 0,
      }
      return service
        ? (await api.patch(`/api/admin/b2b/services/${service.id}`, body)).data.data
        : (await api.post('/api/admin/b2b/services', body)).data.data
    },
    onSuccess: () => { toast.success(service ? 'Saved' : 'Added'); onSaved() },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not save it'),
  })

  const ready = f.name.trim().length > 1 && f.short.trim().length > 0

  return (
    <Modal isOpen onClose={onClose} title={service ? 'Edit service' : 'New service'}>
      <div className="space-y-3">
        <div>
          <label className={label}>Name</label>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} className={field} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Category</label>
            <select
              value={f.category}
              onChange={(e) => {
                const c = CATEGORIES.find((x) => x.value === e.target.value)
                setF((p) => ({ ...p, category: e.target.value, categoryLabel: c?.label ?? p.categoryLabel }))
              }}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Card size</label>
            <select value={f.size} onChange={(e) => set('size', e.target.value)} className={field}>
              <option value="small">Small</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>One line — shown on the card</label>
          <input value={f.short} onChange={(e) => set('short', e.target.value)} className={field} />
        </div>

        <div>
          <label className={label}>Tagline</label>
          <input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} className={field} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Engagement type</label>
            <input
              value={f.engagementType}
              onChange={(e) => set('engagementType', e.target.value)}
              placeholder="Fixed scope · 4–6 weeks"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Price from (₹)</label>
            <input
              type="number"
              value={f.priceFrom}
              onChange={(e) => set('priceFrom', e.target.value)}
              className={field}
            />
            <p className="mt-1 text-[10.5px] text-white/25">
              Indicative. What a client pays lives on the engagement.
            </p>
          </div>
        </div>

        <div>
          <label className={label}>What is included — one per line</label>
          <textarea
            value={f.whatsIncluded}
            onChange={(e) => set('whatsIncluded', e.target.value)}
            rows={5}
            className={field}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready || save.isPending} isLoading={save.isPending} onClick={() => save.mutate()}>
            {service ? 'Save' : 'Add service'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
