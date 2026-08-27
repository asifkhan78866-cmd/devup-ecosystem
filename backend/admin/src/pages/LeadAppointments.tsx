import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  ScrollText, Download, Send, Ban, Stamp, Users, RefreshCw, Search,
  Award, FileText, BookOpen,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * Deeds of appointment for the Lead DevUp directorate.
 *
 * Two lists side by side in one page: who has been selected and is waiting for
 * an instrument, and every instrument already issued. Issuing sends the deed by
 * email on the spot, so the primary action is deliberately one button with the
 * particulars shown before it is pressed — an appointment that goes out with
 * the wrong territory has already reached the person.
 */

interface Tier {
  role: string
  label: string
  abbr: string
  rank: number
  accent: string
  motto: string
  reporting: string
  duties: string[]
}

interface Pending {
  id: string
  applicationNo: string
  role: string
  fullName: string
  email: string
  phone: string | null
  state: string
  city: string | null
  college: string | null
  suggestedJurisdiction: string
  appointment: { id: string; documentNo: string; pdfUrl: string | null; issuedAt: string } | null
}

interface Appointment {
  id: string
  documentNo: string
  role: string
  fullName: string
  email: string
  jurisdiction: string
  state: string
  city: string | null
  college: string | null
  effectiveFrom: string
  effectiveTo: string
  termMonths: number
  status: 'ISSUED' | 'REVOKED'
  pdfUrl: string | null
  certificateUrl: string | null
  handbookUrl: string | null
  issuedAt: string
  revokeReason: string | null
}

/**
 * An appointment produces three documents, and the admin needs each of them
 * separately — the certificate goes out on social media, the deed goes in a
 * file, the handbook gets read.
 */
const DOCUMENTS = [
  { kind: 'certificate', label: 'Certificate', icon: Award,
    hint: 'Sealed and shareable. No terms on it.' },
  { kind: 'deed', label: 'Deed', icon: FileText,
    hint: 'The binding instrument, with all covenants.' },
  { kind: 'handbook', label: 'Handbook', icon: BookOpen,
    hint: 'How the office actually works.' },
] as const

const label = 'block text-[11px] text-white/45 mb-1.5'
const field =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25'

export default function LeadAppointments() {
  const qc = useQueryClient()
  const [issuing, setIssuing] = useState<Pending | null>(null)
  const [manual, setManual] = useState(false)
  const [revoking, setRevoking] = useState<Appointment | null>(null)
  const [search, setSearch] = useState('')

  const { data: tiers } = useQuery<Tier[]>({
    queryKey: ['lead-appointment-tiers'],
    queryFn: async () => (await api.get('/api/admin/lead-appointments/tiers')).data.data,
    staleTime: Infinity,
  })

  const { data: pending, isLoading: pendingLoading } = useQuery<Pending[]>({
    queryKey: ['lead-appointments-pending'],
    queryFn: async () => (await api.get('/api/admin/lead-appointments/pending')).data.data,
  })

  const { data: issued, isLoading: issuedLoading } = useQuery<Appointment[]>({
    queryKey: ['lead-appointments'],
    queryFn: async () => (await api.get('/api/admin/lead-appointments')).data.data,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['lead-appointments'] })
    qc.invalidateQueries({ queryKey: ['lead-appointments-pending'] })
  }

  const issueAll = useMutation({
    mutationFn: async () => (await api.post('/api/admin/lead-appointments/issue-all')).data.data,
    onSuccess: (r: any) => {
      refresh()
      if (r.failed) toast.error(`${r.issued} issued, ${r.failed} failed`)
      else if (r.issued) toast.success(`${r.issued} deed${r.issued > 1 ? 's' : ''} issued and emailed`)
      else toast('Nobody is waiting for a deed')
    },
    onError: () => toast.error('Could not issue the deeds'),
  })

  const tierOf = useMemo(() => {
    const m: Record<string, Tier> = {}
    for (const t of tiers ?? []) m[t.role] = t
    return m
  }, [tiers])

  const waiting = (pending ?? []).filter((p) => !p.appointment)
  const filtered = (issued ?? []).filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.documentNo.toLowerCase().includes(q) ||
      a.jurisdiction.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <TopBar title="Lead DevUp Appointments" />

      <div className="space-y-5 p-6">
        {/* The four offices, so the hierarchy is visible before anyone is put in one. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(tiers ?? []).map((t) => {
            const held = (issued ?? []).filter((a) => a.role === t.role && a.status === 'ISSUED').length
            return (
              <div
                key={t.role}
                className="rounded-2xl border border-white/[0.07] p-4"
                style={{ background: `linear-gradient(160deg, ${t.accent}22, transparent 70%)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex gap-1">
                    {Array.from({ length: 4 }, (_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rotate-45"
                        style={{
                          background: i < t.rank ? t.accent : 'transparent',
                          border: i < t.rank ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      />
                    ))}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/30">{t.abbr}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{t.label}</p>
                <p className="mt-0.5 text-[11px] italic text-white/35">{t.motto}</p>
                <p className="mt-3 text-[22px] font-semibold leading-none text-white">{held}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/30">in post</p>
              </div>
            )
          })}
        </div>

        {/* ── Waiting for an instrument ─────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.07]">
          <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <Users className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-medium text-white">Selected, awaiting appointment</h2>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/50">
              {waiting.length}
            </span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setManual(true)}>
                <Stamp className="h-3.5 w-3.5" /> Appoint someone directly
              </Button>
              <Button
                size="sm"
                disabled={!waiting.length || issueAll.isPending}
                isLoading={issueAll.isPending}
                onClick={() => issueAll.mutate()}
              >
                <Send className="h-3.5 w-3.5" /> Issue all {waiting.length ? `(${waiting.length})` : ''}
              </Button>
            </div>
          </header>

          {pendingLoading ? (
            <p className="px-5 py-6 text-sm text-white/40">Loading…</p>
          ) : !waiting.length ? (
            <p className="px-5 py-6 text-sm text-white/40">
              Nobody is waiting. Applicants appear here once their Lead application is marked
              <span className="text-white/70"> Selected</span>.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {waiting.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span
                    className="h-8 w-1 rounded-full"
                    style={{ background: tierOf[p.role]?.accent ?? '#555' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{p.fullName}</p>
                    <p className="truncate text-[11px] text-white/40">
                      {p.email} · {p.applicationNo}
                    </p>
                  </div>
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="truncate text-[12px] text-white/70">{tierOf[p.role]?.label ?? p.role}</p>
                    <p className="truncate text-[11px] text-white/35">{p.suggestedJurisdiction || '—'}</p>
                  </div>
                  <Button size="sm" onClick={() => setIssuing(p)}>
                    <Stamp className="h-3.5 w-3.5" /> Issue deed
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Issued instruments ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.07]">
          <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <ScrollText className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-medium text-white">Instruments issued</h2>
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, territory or number"
                className="w-64 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white/85 outline-none focus:border-white/25"
              />
            </div>
          </header>

          {issuedLoading ? (
            <p className="px-5 py-6 text-sm text-white/40">Loading…</p>
          ) : !filtered.length ? (
            <p className="px-5 py-6 text-sm text-white/40">Nothing issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-white/30">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Instrument</th>
                    <th className="px-5 py-2.5 font-medium">Appointee</th>
                    <th className="px-5 py-2.5 font-medium">Office</th>
                    <th className="px-5 py-2.5 font-medium">Term</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filtered.map((a) => (
                    <Row key={a.id} a={a} tier={tierOf[a.role]} onRevoke={() => setRevoking(a)} onDone={refresh} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {issuing && (
        <IssueModal
          pending={issuing}
          tier={tierOf[issuing.role]}
          onClose={() => setIssuing(null)}
          onIssued={() => { setIssuing(null); refresh() }}
        />
      )}
      {manual && (
        <IssueModal
          tiers={tiers ?? []}
          onClose={() => setManual(false)}
          onIssued={() => { setManual(false); refresh() }}
        />
      )}
      {revoking && (
        <RevokeModal
          appointment={revoking}
          onClose={() => setRevoking(null)}
          onDone={() => { setRevoking(null); refresh() }}
        />
      )}
    </>
  )
}

function Row({
  a, tier, onRevoke, onDone,
}: { a: Appointment; tier?: Tier; onRevoke: () => void; onDone: () => void }) {
  const resend = useMutation({
    mutationFn: async () => (await api.post(`/api/admin/lead-appointments/${a.id}/resend`)).data.data,
    onSuccess: (r: any) => {
      onDone()
      toast.success(
        r.pdfGenerated
          ? 'All three documents regenerated and emailed'
          : `Emailed ${r.documents?.length ?? 0} of 3 — the rest could not be generated`
      )
    },
    onError: () => toast.error('Could not resend it'),
  })

  const open = async (as: 'preview' | 'pdf', kind: string) => {
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow pop-ups'); return }
    try {
      // Fetched through the axios client so the admin token travels with it;
      // a plain link would hit the endpoint unauthenticated.
      if (as === 'preview') {
        const res = await api.get(
          `/api/admin/lead-appointments/${a.id}/preview?kind=${kind}`, { responseType: 'text' })
        w.document.open(); w.document.write(res.data as string); w.document.close()
      } else {
        const res = await api.get(
          `/api/admin/lead-appointments/${a.id}/pdf?kind=${kind}`, { responseType: 'blob' })
        w.location.href = URL.createObjectURL(res.data as Blob)
      }
    } catch {
      w.close()
      toast.error('Could not render it')
    }
  }

  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="px-5 py-3">
        <span className="font-mono text-[11px] text-white/70">{a.documentNo}</span>
        <p className="text-[10px] text-white/30">{format(new Date(a.issuedAt), 'dd MMM yyyy')}</p>
      </td>
      <td className="px-5 py-3">
        <p className="text-white/90">{a.fullName}</p>
        <p className="text-[11px] text-white/35">{a.email}</p>
      </td>
      <td className="px-5 py-3">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rotate-45" style={{ background: tier?.accent ?? '#555' }} />
          <span className="text-white/80">{tier?.label ?? a.role}</span>
        </span>
        <p className="text-[11px] text-white/35">{a.jurisdiction}</p>
      </td>
      <td className="px-5 py-3 text-[11px] text-white/50">
        {format(new Date(a.effectiveFrom), 'dd MMM yy')} – {format(new Date(a.effectiveTo), 'dd MMM yy')}
      </td>
      <td className="px-5 py-3">
        {a.status === 'ISSUED' ? (
          <span className="rounded-full bg-[#c8f135]/10 px-2 py-0.5 text-[10px] font-medium text-[#c8f135]">
            In post
          </span>
        ) : (
          <span title={a.revokeReason ?? ''} className="rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
            Revoked
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {DOCUMENTS.map((d) => (
            <span key={d.kind} className="flex items-center rounded-lg border border-white/[0.07]">
              <button
                onClick={() => open('preview', d.kind)}
                title={`Preview the ${d.label.toLowerCase()} — ${d.hint}`}
                className="flex items-center gap-1.5 rounded-l-lg px-2 py-1.5 text-[11px] text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              >
                <d.icon className="h-3.5 w-3.5" />
                {d.label}
              </button>
              <button
                onClick={() => open('pdf', d.kind)}
                title={`Download the ${d.label.toLowerCase()} as PDF`}
                className="rounded-r-lg border-l border-white/[0.07] px-1.5 py-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {a.status === 'ISSUED' && (
            <>
              <Button
                variant="ghost" size="sm" isLoading={resend.isPending}
                onClick={() => resend.mutate()} title="Regenerate all three and email again"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onRevoke} title="Revoke">
                <Ban className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/**
 * One modal for both routes into an appointment.
 *
 * With a `pending` application the particulars are read-only except for the
 * territory and the term — those are the two the intake form cannot know. Without
 * one, every field is typed in.
 */
function IssueModal({
  pending, tier, tiers, onClose, onIssued,
}: {
  pending?: Pending
  tier?: Tier
  tiers?: Tier[]
  onClose: () => void
  onIssued: () => void
}) {
  const [role, setRole] = useState(pending?.role ?? tiers?.[0]?.role ?? 'CAMPUS_DIRECTOR')
  const [fullName, setFullName] = useState(pending?.fullName ?? '')
  const [email, setEmail] = useState(pending?.email ?? '')
  const [phone, setPhone] = useState(pending?.phone ?? '')
  const [state, setState] = useState(pending?.state ?? '')
  const [city, setCity] = useState(pending?.city ?? '')
  const [college, setCollege] = useState(pending?.college ?? '')
  const [jurisdiction, setJurisdiction] = useState(pending?.suggestedJurisdiction ?? '')
  const [termMonths, setTermMonths] = useState(12)
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10))

  const active = tier ?? tiers?.find((t) => t.role === role)

  // Typing a territory by hand is the exception; while it is untouched it should
  // keep tracking the narrowest field the tier is defined by.
  const [touched, setTouched] = useState(Boolean(pending?.suggestedJurisdiction))
  useEffect(() => {
    if (touched || pending) return
    setJurisdiction(
      role === 'CAMPUS_DIRECTOR' ? college || city || state
        : role === 'CITY_DIRECTOR' ? city || state
        : role === 'REGIONAL_DIRECTOR' ? (city ? `${city} Region` : state)
        : state
    )
  }, [role, state, city, college, touched, pending])

  const issue = useMutation({
    mutationFn: async () => {
      const body = pending
        ? { applicationId: pending.id, jurisdiction, termMonths, effectiveFrom }
        : { role, fullName, email, phone, state, city, college, jurisdiction, termMonths, effectiveFrom }
      return (await api.post('/api/admin/lead-appointments', body)).data.data
    },
    onSuccess: (r: any) => {
      if (!r.created) toast('They already hold a deed for this office')
      else if (r.pdfGenerated) toast.success(`${r.appointment.documentNo} issued — all three documents emailed`)
      else toast.success(
        `${r.appointment.documentNo} issued, but only ${r.documents?.length ?? 0} of 3 documents rendered. Use Regenerate.`
      )
      onIssued()
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error ?? 'Could not issue the deed'),
  })

  const ready = pending
    ? Boolean(jurisdiction.trim())
    : Boolean(fullName.trim() && email.trim() && state.trim() && jurisdiction.trim())

  return (
    <Modal isOpen onClose={onClose} title={pending ? 'Issue deed of appointment' : 'Appoint someone directly'}>
      <div className="space-y-4">
        {active && (
          <div
            className="rounded-xl border border-white/10 p-3.5"
            style={{ background: `linear-gradient(160deg, ${active.accent}26, transparent 75%)` }}
          >
            <p className="text-sm font-semibold text-white">{active.label}</p>
            <p className="mt-0.5 text-[11px] italic text-white/40">{active.motto}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/50">{active.reporting}</p>
          </div>
        )}

        {!pending && (
          <div>
            <label className={label}>Office</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={field}>
              {(tiers ?? []).map((t) => (
                <option key={t.role} value={t.role}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Full name</label>
            <input
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              disabled={Boolean(pending)} className={field}
            />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(pending)} className={field}
            />
          </div>
          <div>
            <label className={label}>State</label>
            <input
              value={state} onChange={(e) => setState(e.target.value)}
              disabled={Boolean(pending)} className={field}
            />
          </div>
          <div>
            <label className={label}>City</label>
            <input
              value={city ?? ''} onChange={(e) => setCity(e.target.value)}
              disabled={Boolean(pending)} className={field}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Institution</label>
            <input
              value={college ?? ''} onChange={(e) => setCollege(e.target.value)}
              disabled={Boolean(pending)} className={field}
            />
          </div>
          {!pending && (
            <div className="col-span-2">
              <label className={label}>Phone</label>
              <input value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} className={field} />
            </div>
          )}
        </div>

        <div>
          <label className={label}>Territory — as it will be written on the deed</label>
          <input
            value={jurisdiction}
            onChange={(e) => { setJurisdiction(e.target.value); setTouched(true) }}
            className={field}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Effective from</label>
            <input
              type="date" value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)} className={field}
            />
          </div>
          <div>
            <label className={label}>Term (months)</label>
            <input
              type="number" min={1} max={60} value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))} className={field}
            />
          </div>
        </div>

        <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-200/70">
          Issuing allocates a permanent instrument number and emails the certificate, deed and
          handbook to
          <span className="text-amber-100"> {pending?.email || email || 'the appointee'} </span>
          straight away. Check the territory before you press it.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready || issue.isPending} isLoading={issue.isPending} onClick={() => issue.mutate()}>
            <Stamp className="h-4 w-4" /> Issue and email
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function RevokeModal({
  appointment, onClose, onDone,
}: { appointment: Appointment; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')

  const revoke = useMutation({
    mutationFn: async () =>
      (await api.post(`/api/admin/lead-appointments/${appointment.id}/revoke`, { reason })).data.data,
    onSuccess: () => { toast.success('Appointment revoked and the holder notified'); onDone() },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not revoke it'),
  })

  return (
    <Modal isOpen onClose={onClose} title="Revoke this appointment">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          <span className="text-white">{appointment.fullName}</span> holds
          <span className="text-white"> {appointment.documentNo}</span> for {appointment.jurisdiction}.
          Revoking ends the office and emails them the reason.
        </p>
        <div>
          <label className={label}>Reason — the holder is told this</label>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className={field} placeholder="Stepped down at the end of the academic year"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger" disabled={reason.trim().length < 3 || revoke.isPending}
            isLoading={revoke.isPending} onClick={() => revoke.mutate()}
          >
            <Ban className="h-4 w-4" /> Revoke
          </Button>
        </div>
      </div>
    </Modal>
  )
}
