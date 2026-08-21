import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Handshake, Plus, Ticket, Pause, Play, Users } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Partners and the perks they offer.
 *
 * A perk reaches nobody until DevUp moves it to LIVE, which is the whole basis
 * of the arrangement — partners supply the benefit, DevUp vouches for it.
 */

interface Partner {
  id: string
  name: string
  code: string
  slug: string
  logoUrl: string | null
  brandColor: string
  category: string
  status: string
  contactPhone: string | null
  city: string | null
  stats: { perks: number; issued: number; redeemed: number; outstanding: number; expired: number }
}

interface Perk {
  id: string
  partnerId: string
  partner: Partner
  title: string
  subtitle: string | null
  status: string
  percentOff: number | null
  originalPrice: number | null
  finalPrice: number | null
  priceUnit: string | null
  perPersonCap: number
  totalCap: number | null
  awardValidityDays: number
  awardsIssued: number
  remaining: number | null
}

const input =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/25'
const label = 'block text-[11px] text-white/40 mb-1'

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  LIVE: { bg: 'rgba(200,241,53,0.12)', fg: '#c8f135' },
  DRAFT: { bg: 'rgba(255,255,255,0.06)', fg: '#9aa0a6' },
  PAUSED: { bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  EXPIRED: { bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

export default function Partners() {
  const qc = useQueryClient()
  const [showPartner, setShowPartner] = useState(false)
  const [perkFor, setPerkFor] = useState<Partner | null>(null)
  const [awardFor, setAwardFor] = useState<Perk | null>(null)

  const partners = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: async () => (await api.get('/api/admin/partners')).data.data,
  })

  const perks = useQuery<Perk[]>({
    queryKey: ['perks'],
    queryFn: async () => (await api.get('/api/admin/partners/perks/all')).data.data,
  })

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.post(`/api/admin/partners/perks/${id}/status`, { status })).data.data,
    onSuccess: (p: Perk) => {
      qc.invalidateQueries({ queryKey: ['perks'] })
      toast.success(`${p.title} is now ${p.status.toLowerCase()}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not change status'),
  })

  const byPartner = (perks.data ?? []).reduce<Record<string, Perk[]>>((acc, p) => {
    ;(acc[p.partnerId] ??= []).push(p)
    return acc
  }, {})

  return (
    <>
      <TopBar title="Partners" />

      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-white/50">
            Organisations that give DevUp members a benefit. Nothing reaches a member until you move
            it to live.
          </p>
          <Button onClick={() => setShowPartner(true)}>
            <Plus className="h-4 w-4" /> Add partner
          </Button>
        </div>

        {partners.isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : (partners.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Handshake className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">No partners yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(partners.data ?? []).map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-white/[0.07]">
                <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] px-4 py-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                    style={{ background: p.logoUrl ? '#fff' : p.brandColor }}
                  >
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                    ) : (
                      <span className="text-[11px] font-bold text-white">{p.code}</span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{p.name}</div>
                    <div className="text-[11px] text-white/40">
                      {p.code} · {p.category.toLowerCase()}
                      {p.city ? ` · ${p.city}` : ''}
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-4 text-[11px] text-white/45">
                    <span>{p.stats.issued} issued</span>
                    <span style={{ color: '#c8f135' }}>{p.stats.redeemed} redeemed</span>
                    <span>{p.stats.outstanding} outstanding</span>
                    <Button variant="outline" onClick={() => setPerkFor(p)}>
                      <Plus className="h-3.5 w-3.5" /> Perk
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {(byPartner[p.id] ?? []).length === 0 ? (
                    <div className="px-4 py-4 text-xs text-white/30">No perks yet.</div>
                  ) : (
                    (byPartner[p.id] ?? []).map((perk) => {
                      const tone = STATUS_TONE[perk.status] ?? STATUS_TONE.DRAFT
                      return (
                        <div key={perk.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] text-white/90">{perk.title}</div>
                            <div className="truncate text-[11px] text-white/40">
                              {perk.finalPrice != null
                                ? `₹${perk.finalPrice.toLocaleString('en-IN')}${perk.priceUnit ? ` ${perk.priceUnit}` : ''}`
                                : perk.percentOff != null
                                  ? `${perk.percentOff}% off`
                                  : 'No price set'}
                              {' · '}
                              {perk.awardsIssued} issued
                              {perk.remaining != null ? ` · ${perk.remaining} left` : ''}
                              {` · expires ${perk.awardValidityDays}d after award`}
                            </div>
                          </div>

                          <span
                            className="rounded px-2 py-1 text-[10px]"
                            style={{ background: tone.bg, color: tone.fg }}
                          >
                            {perk.status}
                          </span>

                          {perk.status === 'LIVE' ? (
                            <>
                              <Button onClick={() => setAwardFor(perk)}>
                                <Ticket className="h-3.5 w-3.5" /> Award
                              </Button>
                              <button
                                title="Pause"
                                onClick={() => setStatus.mutate({ id: perk.id, status: 'PAUSED' })}
                                className="text-white/35 transition hover:text-white"
                              >
                                <Pause className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              disabled={setStatus.isPending}
                              onClick={() => setStatus.mutate({ id: perk.id, status: 'LIVE' })}
                            >
                              <Play className="h-3.5 w-3.5" /> Approve &amp; go live
                            </Button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPartner && <PartnerModal onClose={() => setShowPartner(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['partners'] })} />}
      {perkFor && (
        <PerkModal
          partner={perkFor}
          onClose={() => setPerkFor(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['perks'] })}
        />
      )}
      {awardFor && (
        <AwardModal
          perk={awardFor}
          onClose={() => setAwardFor(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['perks'] })
            qc.invalidateQueries({ queryKey: ['partners'] })
            qc.invalidateQueries({ queryKey: ['awards'] })
          }}
        />
      )}
    </>
  )
}

function PartnerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: '', code: '', brandColor: '#1F7A4D', category: 'WORKSPACE', logoUrl: '',
    website: '', contactPhone: '', contactEmail: '',
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  })
  const set = (k: string, v: string) => setF({ ...f, [k]: v })

  const save = useMutation({
    mutationFn: async () => (await api.post('/api/admin/partners', f)).data.data,
    onSuccess: () => { toast.success('Partner added'); onSaved(); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not save'),
  })

  return (
    <Modal isOpen onClose={onClose} title="Add partner">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className={label}>Name *</label>
            <input className={input} value={f.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={label}>Code *</label>
            <input
              className={input}
              placeholder="D2PR"
              maxLength={6}
              value={f.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={label}>Category</label>
            <select className={input} value={f.category} onChange={(e) => set('category', e.target.value)}>
              {['WORKSPACE', 'PROGRAM', 'COUNCIL', 'SERVICE', 'OTHER'].map((c) => (
                <option key={c} value={c} className="bg-[#111]">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Ticket colour</label>
            <div className="flex gap-2">
              <input type="color" className="h-9 w-10 rounded bg-transparent" value={f.brandColor} onChange={(e) => set('brandColor', e.target.value)} />
              <input className={input} value={f.brandColor} onChange={(e) => set('brandColor', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Phone</label>
            <input className={input} value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Logo URL</label>
          <input className={input} placeholder="https://…" value={f.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
        </div>
        <div>
          <label className={label}>Address line 1</label>
          <input className={input} value={f.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>City</label><input className={input} value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div><label className={label}>State</label><input className={input} value={f.state} onChange={(e) => set('state', e.target.value)} /></div>
          <div><label className={label}>Pincode</label><input className={input} value={f.pincode} onChange={(e) => set('pincode', e.target.value)} /></div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!f.name || !f.code || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Add partner'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PerkModal({ partner, onClose, onSaved }: { partner: Partner; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title: '', subtitle: '', percentOff: '', originalPrice: '', finalPrice: '',
    priceUnit: 'every month', highlights: '', terms: '',
    totalCap: '', perPersonCap: '1', awardValidityDays: '60',
  })
  const set = (k: string, v: string) => setF({ ...f, [k]: v })

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        partnerId: partner.id,
        title: f.title,
        subtitle: f.subtitle,
        priceUnit: f.priceUnit,
        // One per line beats comma-splitting: "Printer & Scanner, Coffee" is
        // two chips or one depending on the comma, and nobody can tell which.
        highlights: f.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
        terms: f.terms.split('\n').map((s) => s.trim()).filter(Boolean),
        perPersonCap: Number(f.perPersonCap) || 1,
        awardValidityDays: Number(f.awardValidityDays) || 60,
      }
      if (f.percentOff) body.percentOff = Number(f.percentOff)
      if (f.originalPrice) body.originalPrice = Number(f.originalPrice)
      if (f.finalPrice) body.finalPrice = Number(f.finalPrice)
      if (f.totalCap) body.totalCap = Number(f.totalCap)
      return (await api.post('/api/admin/partners/perks', body)).data.data
    },
    onSuccess: () => { toast.success('Perk created as draft — approve it to go live'); onSaved(); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not save'),
  })

  return (
    <Modal isOpen onClose={onClose} title={`New perk — ${partner.name}`}>
      <div className="space-y-3">
        <div>
          <label className={label}>Title *</label>
          <input className={input} placeholder="50% off a monthly workspace pass" value={f.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className={label}>Subtitle</label>
          <input className={input} value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div><label className={label}>% off</label><input className={input} value={f.percentOff} onChange={(e) => set('percentOff', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className={label}>Was ₹</label><input className={input} value={f.originalPrice} onChange={(e) => set('originalPrice', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className={label}>Now ₹</label><input className={input} value={f.finalPrice} onChange={(e) => set('finalPrice', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className={label}>Unit</label><input className={input} value={f.priceUnit} onChange={(e) => set('priceUnit', e.target.value)} /></div>
        </div>

        <div>
          <label className={label}>Highlights — one per line</label>
          <textarea className={input} rows={4} placeholder={'High-Speed Wi-Fi\nUnlimited Coffee & Tea'} value={f.highlights} onChange={(e) => set('highlights', e.target.value)} />
        </div>
        <div>
          <label className={label}>Terms — one per line, first 3 print on the ticket</label>
          <textarea className={input} rows={2} value={f.terms} onChange={(e) => set('terms', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Total cap</label><input className={input} placeholder="unlimited" value={f.totalCap} onChange={(e) => set('totalCap', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className={label}>Per person</label><input className={input} value={f.perPersonCap} onChange={(e) => set('perPersonCap', e.target.value.replace(/\D/g, ''))} /></div>
          <div><label className={label}>Valid for (days)</label><input className={input} value={f.awardValidityDays} onChange={(e) => set('awardValidityDays', e.target.value.replace(/\D/g, ''))} /></div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!f.title || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Create draft'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Bulk award.
 *
 * Names arrive from an event as a list, so the input is a paste box rather
 * than a form repeated N times. Every skipped row comes back with its reason
 * — a partial run that stays quiet is how people get missed.
 */
function AwardModal({ perk, onClose, onSaved }: { perk: Perk; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState('')
  const [sourceEvent, setSourceEvent] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [result, setResult] = useState<any>(null)

  const parsed = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((s) => s.trim())
      // "Name, email" or "email" alone — a bare address still names someone.
      if (parts.length === 1) return { name: parts[0].split('@')[0], email: parts[0] }
      return { name: parts[0], email: parts[1], phone: parts[2] }
    })

  const award = useMutation({
    mutationFn: async () =>
      (
        await api.post('/api/admin/partners/awards', {
          perkId: perk.id,
          recipients: parsed,
          sourceEvent,
          sendEmail,
        })
      ).data.data,
    onSuccess: (r) => {
      setResult(r)
      onSaved()
      toast.success(`${r.issued} ticket${r.issued === 1 ? '' : 's'} issued`)
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not award'),
  })

  const print = useMutation({
    mutationFn: async () => {
      const codes = (result?.issuedTo ?? []).map((i: any) => i.code)
      const list = (await api.get(`/api/admin/partners/awards?perkId=${perk.id}`)).data.data
      const ids = list.filter((a: any) => codes.includes(a.code)).map((a: any) => a.id)
      return (await api.post('/api/admin/partners/awards/print', { awardIds: ids })).data.data
    },
    onSuccess: (r) => window.open(r.url, '_blank'),
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not render tickets'),
  })

  return (
    <Modal isOpen onClose={onClose} title={`Award — ${perk.title}`}>
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {result.issued} ticket{result.issued === 1 ? '' : 's'} issued.
          </p>

          {result.issuedTo.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-white/10 p-2">
              {result.issuedTo.map((i: any) => (
                <div key={i.code} className="flex justify-between text-[11px]">
                  <span className="text-white/70">{i.name}</span>
                  <span className="font-mono text-white/40">{i.code}</span>
                </div>
              ))}
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-3">
              <p className="mb-1 text-[11px] font-medium text-amber-300">
                {result.skipped.length} skipped
              </p>
              {result.skipped.map((s: any, i: number) => (
                <div key={i} className="text-[11px] text-amber-200/80">
                  {s.email} — {s.reason}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Done</Button>
            {result.issued > 0 && (
              <Button disabled={print.isPending} onClick={() => print.mutate()}>
                {print.isPending ? 'Rendering…' : 'Print tickets'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={label}>Awarded at</label>
            <input className={input} placeholder="Devthon 2026" value={sourceEvent} onChange={(e) => setSourceEvent(e.target.value)} />
          </div>

          <div>
            <label className={label}>Recipients — one per line, “Name, email”</label>
            <textarea
              className={`${input} font-mono text-[11.5px]`}
              rows={8}
              placeholder={'Asha Reddy, asha@vjit.ac.in\nRohit Kumar, rohit@vjit.ac.in'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-white/35">
              {parsed.length} recipient{parsed.length === 1 ? '' : 's'} · one ticket each, valid{' '}
              {perk.awardValidityDays} days
              {perk.remaining != null ? ` · ${perk.remaining} left on this perk` : ''}
            </p>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-white/60">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-3.5 w-3.5 accent-[#c8f135]" />
            Also email each recipient their code
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={parsed.length === 0 || award.isPending} onClick={() => award.mutate()}>
              {award.isPending ? 'Issuing…' : `Issue ${parsed.length} ticket${parsed.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
