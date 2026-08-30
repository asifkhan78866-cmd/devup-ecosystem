import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Briefcase, Plus, ChevronLeft, Lock, KeyRound, Eye, Trash2, Check, AlertTriangle,
  IndianRupee, Users, ListChecks, PackageCheck, Wrench, Sparkles, Search, History,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * B2B engagements.
 *
 * A board of everything in flight, and a detail view with the pieces that
 * actually decide whether the work makes money: the stage gate, what has been
 * paid, the credentials nobody can otherwise find, and the scope that grew.
 */

const STAGES = [
  'ENQUIRY', 'PROPOSED', 'AGREEMENT_SENT', 'AGREEMENT_SIGNED',
  'DEPOSIT_PAID', 'IN_BUILD', 'DELIVERED', 'MAINTENANCE', 'CLOSED', 'LOST',
] as const
type Stage = (typeof STAGES)[number]

const STAGE_TONE: Record<string, string> = {
  ENQUIRY: '#8b8b8b', PROPOSED: '#8b8b8b', AGREEMENT_SENT: '#facc15',
  AGREEMENT_SIGNED: '#facc15', DEPOSIT_PAID: '#c8f135', IN_BUILD: '#60a5fa',
  DELIVERED: '#c8f135', MAINTENANCE: '#a78bfa', CLOSED: '#6b7280', LOST: '#f87171',
}

const label = 'block text-[11px] text-white/45 mb-1.5'
const field =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-[#c8f135]/40'

/** Paise in, rupees out. Money is never a float on the wire. */
const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const toPaise = (v: string) => Math.round(Number(v || 0) * 100)
const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase()

export default function Engagements() {
  const qc = useQueryClient()
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [stage, setStage] = useState<Stage | 'ALL'>('ALL')
  const [q, setQ] = useState('')

  const { data: list, isLoading } = useQuery<any[]>({
    queryKey: ['engagements', stage, q],
    queryFn: async () => {
      const p = new URLSearchParams()
      if (stage !== 'ALL') p.set('stage', stage)
      if (q.trim()) p.set('q', q.trim())
      return (await api.get(`/api/admin/b2b/engagements?${p}`)).data.data
    },
  })

  if (open) {
    return <Detail id={open} onClose={() => { setOpen(null); qc.invalidateQueries({ queryKey: ['engagements'] }) }} />
  }

  const totalOpen = (list ?? [])
    .filter((e) => !['CLOSED', 'LOST'].includes(e.stage))
    .reduce((s, e) => s + e.contractValue, 0)

  return (
    <>
      <TopBar title="Engagements" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm text-white/50">
            Every piece of paid work, from enquiry to handover.
            {totalOpen > 0 && (
              <> <span className="text-white/70">{rupees(totalOpen)}</span> in flight.</>
            )}
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New engagement
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStage(s as Stage | 'ALL')}
              className={`rounded-full px-3 py-1 text-[11px] transition ${
                stage === s ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s === 'ALL' ? 'All' : pretty(s)}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Client, title or reference"
              className="w-60 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white/85 outline-none focus:border-white/25"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : !list?.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Briefcase className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">Nothing here yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            {list.map((e) => {
              const short = e.paid < e.depositDue && !['CLOSED', 'LOST', 'ENQUIRY', 'PROPOSED'].includes(e.stage)
              return (
                <button
                  key={e.id}
                  onClick={() => setOpen(e.id)}
                  className="flex w-full items-center gap-4 border-b border-white/5 px-4 py-3.5 text-left transition last:border-0 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] text-white/90">{e.clientCompany}</div>
                    <div className="truncate text-[11px] text-white/40">
                      {e.title} · <span className="font-mono">{e.code}</span>
                    </div>
                  </div>
                  <div className="hidden w-32 shrink-0 text-right lg:block">
                    <div className="text-[12px] text-white/70">{rupees(e.contractValue)}</div>
                    <div className={`text-[10px] ${short ? 'text-amber-300/80' : 'text-white/30'}`}>
                      {rupees(e.paid)} in
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded px-2 py-1 text-[10px] capitalize"
                    style={{ background: `${STAGE_TONE[e.stage]}1f`, color: STAGE_TONE[e.stage] }}
                  >
                    {pretty(e.stage)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <NewEngagement
          onClose={() => setCreating(false)}
          onCreated={(id) => { setCreating(false); setOpen(id); qc.invalidateQueries({ queryKey: ['engagements'] }) }}
        />
      )}
    </>
  )
}

function NewEngagement({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { data: services } = useQuery<any[]>({
    queryKey: ['catalogue-active'],
    queryFn: async () => (await api.get('/api/admin/b2b/services')).data.data,
  })
  const [f, setF] = useState({
    serviceId: '', clientCompany: '', clientName: '', clientEmail: '',
    clientGstin: '', title: '', contractValue: '', depositPct: '25',
  })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/api/admin/b2b/engagements', {
        serviceId: f.serviceId || null,
        clientCompany: f.clientCompany.trim(),
        clientName: f.clientName.trim(),
        clientEmail: f.clientEmail.trim(),
        clientGstin: f.clientGstin.trim() || undefined,
        title: f.title.trim(),
        contractValue: toPaise(f.contractValue),
        depositPct: Number(f.depositPct) || 25,
      })).data.data,
    onSuccess: (e) => onCreated(e.id),
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not create it'),
  })

  const ready = f.clientCompany.trim() && f.clientName.trim() && f.clientEmail.trim() && f.title.trim()

  return (
    <Modal isOpen onClose={onClose} title="New engagement">
      <div className="space-y-3">
        <div>
          <label className={label}>Service</label>
          <select value={f.serviceId} onChange={(e) => set('serviceId', e.target.value)} className={field}>
            <option value="">— none —</option>
            {(services ?? []).filter((s) => s.isActive).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Client company</label>
            <input value={f.clientCompany} onChange={(e) => set('clientCompany', e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Contact name</label>
            <input value={f.clientName} onChange={(e) => set('clientName', e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input value={f.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Client GSTIN</label>
            <input value={f.clientGstin} onChange={(e) => set('clientGstin', e.target.value)} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>What is being built</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} className={field} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Contract value (₹, ex-GST)</label>
            <input type="number" value={f.contractValue} onChange={(e) => set('contractValue', e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Deposit %</label>
            <input type="number" value={f.depositPct} onChange={(e) => set('depositPct', e.target.value)} className={field} />
            <p className="mt-1 text-[10.5px] text-white/25">
              {f.contractValue ? `${rupees(Math.ceil(toPaise(f.contractValue) * (Number(f.depositPct) || 0) / 100))} before build starts` : ''}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready || create.isPending} isLoading={create.isPending} onClick={() => create.mutate()}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const TABS = [
  { key: 'money', label: 'Money', icon: IndianRupee },
  { key: 'vault', label: 'Vault', icon: KeyRound },
  { key: 'delivery', label: 'Delivery', icon: ListChecks },
  { key: 'handover', label: 'Handover', icon: PackageCheck },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  { key: 'showcase', label: 'Showcase', icon: Sparkles },
] as const

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('money')

  const { data: e } = useQuery<any>({
    queryKey: ['engagement', id],
    queryFn: async () => (await api.get(`/api/admin/b2b/engagements/${id}`)).data.data,
  })
  // Every write also moves the history, so both are invalidated together.
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['engagement', id] })
    qc.invalidateQueries({ queryKey: ['activity'] })
  }

  const stage = useMutation({
    mutationFn: async (s: Stage) =>
      (await api.post(`/api/admin/b2b/engagements/${id}/stage`, { stage: s })).data.data,
    onSuccess: () => { refresh(); toast.success('Stage updated') },
    // The gate explains itself — the message says which condition failed.
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Could not change the stage'),
  })

  if (!e) return <><TopBar title="Engagement" /><p className="p-6 text-sm text-white/40">Loading…</p></>

  const depositMet = e.paid >= e.depositDue
  const signed = e.agreement?.status === 'SIGNED'

  return (
    <>
      <TopBar title="Engagement" />
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <button onClick={onClose} className="flex items-center gap-1 pt-1 text-[12px] text-white/40 hover:text-white">
            <ChevronLeft className="h-3.5 w-3.5" /> All engagements
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white">{e.clientCompany}</h2>
            <p className="text-[12px] text-white/45">
              {e.title} · <span className="font-mono">{e.code}</span>
              {e.service?.name ? ` · ${e.service.name}` : ''}
            </p>
          </div>
          <span
            className="shrink-0 rounded px-2.5 py-1 text-[11px] capitalize"
            style={{ background: `${STAGE_TONE[e.stage]}1f`, color: STAGE_TONE[e.stage] }}
          >
            {pretty(e.stage)}
          </span>
        </div>

        {/* The gate, stated rather than hidden behind a disabled button. */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Contract" value={rupees(e.contractTotal)}
            note={e.contractTotal !== e.contractValue ? `incl. approved changes` : undefined} />
          <Stat label="Received" value={rupees(e.paid)}
            note={`${rupees(e.outstanding)} outstanding`} />
          <Stat label={`Deposit (${e.depositPct}%)`} value={rupees(e.depositDue)}
            note={depositMet ? 'met' : `${rupees(e.depositDue - e.paid)} short`}
            tone={depositMet ? '#c8f135' : '#facc15'} />
        </div>

        <div className="rounded-2xl border border-white/[0.07] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <Lock className="h-3.5 w-3.5 text-white/35" />
            <span className="text-white/50">Before build can start:</span>
            <Gate ok={Boolean(e.agreement)} text="agreement linked" />
            <Gate ok={signed} text="signed" />
            <Gate ok={depositMet} text="deposit received" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s}
                disabled={stage.isPending || s === e.stage}
                onClick={() => stage.mutate(s)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] capitalize transition ${
                  s === e.stage
                    ? 'bg-white/[0.14] text-white'
                    : 'border border-white/[0.07] text-white/45 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {pretty(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.07] pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition ${
                tab === t.key ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white/75'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'money' && <MoneyTab e={e} refresh={refresh} />}
        {tab === 'vault' && <VaultTab e={e} refresh={refresh} />}
        {tab === 'delivery' && <DeliveryTab e={e} refresh={refresh} />}
        {tab === 'handover' && <HandoverTab e={e} refresh={refresh} />}
        {tab === 'maintenance' && <MaintenanceTab e={e} refresh={refresh} />}
        {tab === 'showcase' && <ShowcaseTab e={e} refresh={refresh} />}

        <Activity entity="Engagement" id={e.id} />
      </div>
    </>
  )
}

/**
 * Who changed what, and when.
 *
 * Sits under the record rather than behind a tab: the question it answers —
 * "did that edit save, and what did it actually change" — is asked immediately
 * after editing, not hunted for later.
 */
function Activity({ entity, id }: { entity: string; id: string }) {
  const { data } = useQuery<any[]>({
    queryKey: ['activity', entity, id],
    queryFn: async () => (await api.get(`/api/admin/b2b/activity/${entity}/${id}`)).data.data,
    refetchInterval: false,
  })

  if (!data?.length) return null

  return (
    <div className="rounded-2xl border border-white/[0.07]">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <History className="h-3.5 w-3.5 text-white/35" />
        <span className="text-[12px] text-white/60">History</span>
        <span className="ml-auto text-[10px] text-white/25">{data.length} change{data.length > 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {data.map((a) => (
          <div key={a.id} className="flex items-baseline gap-3 px-4 py-2">
            <span className="text-[12px] text-white/75">{a.summary}</span>
            <span className="ml-auto shrink-0 text-[10.5px] text-white/30">
              {a.by ? `${a.by} · ` : ''}{format(new Date(a.at), 'd MMM, h:mm a')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label: l, value, note, tone }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] p-4">
      <div className="text-[10px] uppercase tracking-wider text-white/30">{l}</div>
      <div className="mt-1 text-[19px] font-semibold text-white">{value}</div>
      {note && <div className="mt-0.5 text-[11px]" style={{ color: tone ?? 'rgba(255,255,255,0.3)' }}>{note}</div>}
    </div>
  )
}

function Gate({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`flex items-center gap-1 ${ok ? 'text-[#c8f135]' : 'text-white/30'}`}>
      {ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {text}
    </span>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07]">
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <span className="text-[12px] text-white/70">{title}</span>
        <div className="ml-auto">{action}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const empty = (t: string) => <p className="text-[12px] text-white/30">{t}</p>

function MoneyTab({ e, refresh }: { e: any; refresh: () => void }) {
  const [pay, setPay] = useState({ amount: '', tds: '', paidOn: new Date().toISOString().slice(0, 10), reference: '' })
  const [inv, setInv] = useState({ subtotal: '', sacCode: '998314', sellerGstin: '' })

  const addPayment = useMutation({
    mutationFn: async () =>
      (await api.post(`/api/admin/b2b/engagements/${e.id}/payments`, {
        amount: toPaise(pay.amount),
        tdsDeducted: pay.tds ? toPaise(pay.tds) : 0,
        paidOn: pay.paidOn,
        reference: pay.reference || undefined,
      })).data.data,
    onSuccess: () => { refresh(); setPay({ ...pay, amount: '', tds: '', reference: '' }); toast.success('Payment recorded') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Could not record it'),
  })

  const addInvoice = useMutation({
    mutationFn: async () =>
      (await api.post(`/api/admin/b2b/engagements/${e.id}/invoices`, {
        subtotal: toPaise(inv.subtotal),
        sacCode: inv.sacCode || undefined,
        sellerGstin: inv.sellerGstin || undefined,
      })).data.data,
    onSuccess: () => { refresh(); setInv({ ...inv, subtotal: '' }); toast.success('Invoice raised') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Could not raise it'),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Invoices">
        <div className="space-y-2">
          {e.invoices.length === 0 && empty('None raised.')}
          {e.invoices.map((i: any) => (
            <div key={i.id} className="flex items-center gap-3 text-[12px]">
              <span className="font-mono text-white/60">{i.number}</span>
              <span className="ml-auto text-white/80">{rupees(i.total)}</span>
              <span className="text-[10px] text-white/35">
                {rupees(i.subtotal)} + {i.gstPct}% GST
              </span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">{i.status}</span>
            </div>
          ))}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
            <input placeholder="Amount ₹" type="number" value={inv.subtotal}
              onChange={(ev) => setInv({ ...inv, subtotal: ev.target.value })} className={field} />
            <input placeholder="SAC" value={inv.sacCode}
              onChange={(ev) => setInv({ ...inv, sacCode: ev.target.value })} className={field} />
            <Button size="sm" disabled={!inv.subtotal || addInvoice.isPending} onClick={() => addInvoice.mutate()}>
              Raise
            </Button>
          </div>
          <p className="text-[10.5px] text-white/25">
            18% GST is added and stored on the invoice, so a later rate change cannot alter one already sent.
          </p>
        </div>
      </Panel>

      <Panel title="Payments received">
        <div className="space-y-2">
          {e.payments.length === 0 && empty('Nothing received yet.')}
          {e.payments.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 text-[12px]">
              <span className="text-white/50">{format(new Date(p.paidOn), 'd MMM yyyy')}</span>
              <span className="ml-auto text-white/85">{rupees(p.amount)}</span>
              {p.tdsDeducted > 0 && (
                <span className="text-[10px] text-white/35">+{rupees(p.tdsDeducted)} TDS</span>
              )}
            </div>
          ))}
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-3">
            <input placeholder="Amount ₹" type="number" value={pay.amount}
              onChange={(ev) => setPay({ ...pay, amount: ev.target.value })} className={field} />
            <input placeholder="TDS ₹" type="number" value={pay.tds}
              onChange={(ev) => setPay({ ...pay, tds: ev.target.value })} className={field} />
            <input type="date" value={pay.paidOn}
              onChange={(ev) => setPay({ ...pay, paidOn: ev.target.value })} className={field} />
            <Button size="sm" disabled={!pay.amount || addPayment.isPending} onClick={() => addPayment.mutate()}>
              Record
            </Button>
          </div>
          <p className="text-[10.5px] text-white/25">
            TDS counts toward the deposit — the client paid it, to the tax authority rather than to you.
          </p>
        </div>
      </Panel>

      <Panel title="Scope changes">
        <div className="space-y-2">
          {e.changes.length === 0 && empty('No changes raised. Anything beyond the agreed scope belongs here, priced.')}
          {e.changes.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 text-[12px]">
              <span className="min-w-0 flex-1 truncate text-white/80">{c.title}</span>
              <span className="text-white/60">{rupees(c.amount)}</span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">{c.status}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pass-through costs">
        <div className="space-y-2">
          {e.costs.length === 0 && empty('Hosting and API bills you pay and rebill. Untracked, you absorb them.')}
          {e.costs.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 text-[12px]">
              <span className="min-w-0 flex-1 truncate text-white/80">{c.vendor}</span>
              <span className="text-white/60">{rupees(c.amount)}</span>
              <span className="text-[10px] text-white/35">{c.rebilled ? 'rebilled' : 'not rebilled'}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function VaultTab({ e, refresh }: { e: any; refresh: () => void }) {
  const [adding, setAdding] = useState(false)
  const [shown, setShown] = useState<Record<string, string>>({})

  const reveal = useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/admin/b2b/credentials/${id}/reveal`)).data.data,
    onSuccess: (r: any, id) => {
      if (r.undecryptable) return toast.error('Stored with a different key — cannot be decrypted')
      setShown((s) => ({ ...s, [id]: r.secret }))
    },
    onError: () => toast.error('Could not reveal it'),
  })

  const remove = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await api.delete(`/api/admin/b2b/credentials/${id}`, { data: { reason } })).data.data,
    onSuccess: () => { refresh(); toast.success('Removed — the record of it stays') },
  })

  return (
    <>
      <Panel
        title="Credentials"
        action={<Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3 w-3" /> Add</Button>}
      >
        <div className="space-y-2">
          {e.credentials.length === 0 &&
            empty('Nothing stored. This is where "which S3 bucket was that" gets an answer.')}
          {e.credentials.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-white/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/60">{c.provider}</span>
                <span className="text-[12.5px] text-white/85">{c.label}</span>
                {c.accountRef && <span className="font-mono text-[11px] text-white/45">{c.accountRef}</span>}
                <div className="ml-auto flex items-center gap-1">
                  {c.hasSecret && (
                    <button
                      onClick={() => reveal.mutate(c.id)}
                      title="Reveal — this is recorded"
                      className="rounded p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const reason = prompt(`Remove ${c.label}? Say why — it stays on the record.`)
                      if (reason !== null) remove.mutate({ id: c.id, reason })
                    }}
                    className="rounded p-1.5 text-white/25 transition hover:bg-white/[0.06] hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {c.purpose && <p className="mt-1 text-[11px] text-white/35">{c.purpose}</p>}
              {shown[c.id] && (
                <div className="mt-2 rounded bg-black/40 px-2.5 py-1.5 font-mono text-[11.5px] text-[#c8f135] break-all">
                  {shown[c.id]}
                </div>
              )}
            </div>
          ))}
          <p className="pt-1 text-[10.5px] text-white/25">
            Secrets are encrypted at rest and never returned by a list. Every reveal is recorded against your account.
          </p>
        </div>
      </Panel>

      {adding && <CredentialForm engagementId={e.id} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); refresh() }} />}
    </>
  )
}

function CredentialForm({ engagementId, onClose, onSaved }: { engagementId: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ provider: 'AWS', accountRef: '', label: '', purpose: '', username: '', url: '', secret: '' })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  const save = useMutation({
    mutationFn: async () => (await api.post(`/api/admin/b2b/engagements/${engagementId}/credentials`, f)).data.data,
    onSuccess: () => { toast.success('Stored'); onSaved() },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not store it'),
  })

  return (
    <Modal isOpen onClose={onClose} title="Add a credential">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Provider</label>
            <input value={f.provider} onChange={(ev) => set('provider', ev.target.value)} placeholder="AWS" className={field} />
          </div>
          <div>
            <label className={label}>Account / bucket / project</label>
            <input value={f.accountRef} onChange={(ev) => set('accountRef', ev.target.value)}
              placeholder="devup-client-assets" className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Label</label>
          <input value={f.label} onChange={(ev) => set('label', ev.target.value)} placeholder="S3 bucket" className={field} />
        </div>
        <div>
          <label className={label}>What it is for</label>
          <input value={f.purpose} onChange={(ev) => set('purpose', ev.target.value)} className={field} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Username</label>
            <input value={f.username} onChange={(ev) => set('username', ev.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>URL</label>
            <input value={f.url} onChange={(ev) => set('url', ev.target.value)} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Secret</label>
          <input type="password" value={f.secret} onChange={(ev) => set('secret', ev.target.value)} className={field} />
          <p className="mt-1 text-[10.5px] text-white/30">
            Encrypted before it is stored. It is never shown again except by an explicit, recorded reveal.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!f.label.trim() || !f.provider.trim() || save.isPending} isLoading={save.isPending}
            onClick={() => save.mutate()}>Store</Button>
        </div>
      </div>
    </Modal>
  )
}

function DeliveryTab({ e, refresh }: { e: any; refresh: () => void }) {
  const [task, setTask] = useState('')
  const [member, setMember] = useState({ name: '', role: '' })
  const [deliv, setDeliv] = useState('')

  const post = (path: string, body: unknown, msg: string) =>
    api.post(path, body).then(() => { refresh(); toast.success(msg) }).catch(() => toast.error('Could not save it'))

  const setDeliverable = useMutation({
    mutationFn: async ({ id, action, by }: any) =>
      (await api.patch(`/api/admin/b2b/deliverables/${id}`, { action, by })).data.data,
    onSuccess: () => refresh(),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Team">
        <div className="space-y-2">
          {e.team.length === 0 && empty('Nobody assigned.')}
          {e.team.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 text-[12px]">
              <Users className="h-3.5 w-3.5 text-white/25" />
              <span className="text-white/85">{m.name}</span>
              <span className="text-[11px] text-white/40">{m.role}</span>
            </div>
          ))}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
            <input placeholder="Name" value={member.name} onChange={(ev) => setMember({ ...member, name: ev.target.value })} className={field} />
            <input placeholder="Role" value={member.role} onChange={(ev) => setMember({ ...member, role: ev.target.value })} className={field} />
            <Button size="sm" disabled={!member.name.trim()}
              onClick={() => post(`/api/admin/b2b/engagements/${e.id}/team`, member, 'Added').then(() => setMember({ name: '', role: '' }))}>
              Add
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Tasks">
        <div className="space-y-2">
          {e.tasks.length === 0 && empty('No tasks yet.')}
          {e.tasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 text-[12px]">
              <span className="min-w-0 flex-1 truncate text-white/85">{t.title}</span>
              <select
                value={t.status}
                onChange={(ev) => api.patch(`/api/admin/b2b/tasks/${t.id}`, { status: ev.target.value }).then(refresh)}
                className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70"
              >
                {['TODO', 'DOING', 'BLOCKED', 'DONE'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
            <input placeholder="What needs doing" value={task} onChange={(ev) => setTask(ev.target.value)} className={field} />
            <Button size="sm" disabled={!task.trim()}
              onClick={() => post(`/api/admin/b2b/engagements/${e.id}/tasks`, { title: task }, 'Added').then(() => setTask(''))}>
              Add
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Deliverables">
        <div className="space-y-2">
          {e.deliverables.length === 0 && empty('Nothing submitted for sign-off.')}
          {e.deliverables.map((d: any) => (
            <div key={d.id} className="flex items-center gap-2 text-[12px]">
              <span className="min-w-0 flex-1 truncate text-white/85">{d.title}</span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">{d.status}</span>
              {d.status === 'DRAFT' && (
                <Button size="sm" variant="ghost" onClick={() => setDeliverable.mutate({ id: d.id, action: 'submit' })}>Submit</Button>
              )}
              {d.status === 'SUBMITTED' && (
                <Button size="sm" variant="ghost"
                  onClick={() => setDeliverable.mutate({ id: d.id, action: 'accept', by: e.approverName ?? 'client' })}>
                  Accept
                </Button>
              )}
            </div>
          ))}
          <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
            <input placeholder="Deliverable" value={deliv} onChange={(ev) => setDeliv(ev.target.value)} className={field} />
            <Button size="sm" disabled={!deliv.trim()}
              onClick={() => post(`/api/admin/b2b/engagements/${e.id}/deliverables`, { title: deliv }, 'Added').then(() => setDeliv(''))}>
              Add
            </Button>
          </div>
          <p className="text-[10.5px] text-white/25">
            Submitted work is deemed accepted after 7 days of silence, so a project can actually end.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function HandoverTab({ e, refresh }: { e: any; refresh: () => void }) {
  const [item, setItem] = useState('')
  const SUGGESTED = ['Source repository', 'Domain and DNS', 'Hosting account', 'Third-party API keys', 'Design files', 'Admin logins']

  return (
    <Panel title="Handover checklist">
      <div className="space-y-2">
        {e.handover.length === 0 && (
          <div className="space-y-2">
            {empty('Nothing listed. This is what stops knowledge living only in somebody’s head.')}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    api.post(`/api/admin/b2b/engagements/${e.id}/handover`, { label: s }).then(refresh)
                  }
                  className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[11px] text-white/45 transition hover:text-white"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {e.handover.map((h: any) => (
          <label key={h.id} className="flex cursor-pointer items-center gap-2.5 text-[12px]">
            <input
              type="checkbox"
              checked={h.done}
              onChange={(ev) => api.patch(`/api/admin/b2b/handover/${h.id}`, { done: ev.target.checked }).then(refresh)}
              className="h-3.5 w-3.5 accent-[#c8f135]"
            />
            <span className={h.done ? 'text-white/35 line-through' : 'text-white/85'}>{h.label}</span>
          </label>
        ))}
        <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
          <input placeholder="Item" value={item} onChange={(ev) => setItem(ev.target.value)} className={field} />
          <Button size="sm" disabled={!item.trim()}
            onClick={() =>
              api.post(`/api/admin/b2b/engagements/${e.id}/handover`, { label: item })
                .then(() => { setItem(''); refresh() })
            }>
            Add
          </Button>
        </div>
      </div>
    </Panel>
  )
}

function MaintenanceTab({ e, refresh }: { e: any; refresh: () => void }) {
  const m = e.maintenance
  const [f, setF] = useState({
    amount: m ? String(m.amount / 100) : '',
    cadence: m?.cadence ?? 'MONTHLY',
    note: '',
  })

  const save = useMutation({
    mutationFn: async () =>
      (await api.post(`/api/admin/b2b/engagements/${e.id}/maintenance`, {
        amount: toPaise(f.amount), cadence: f.cadence, note: f.note || undefined,
      })).data.data,
    onSuccess: () => { refresh(); setF({ ...f, note: '' }); toast.success(m ? 'Rate updated' : 'Plan created') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Could not save it'),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={m ? 'Plan' : 'Set up maintenance'}>
        <div className="space-y-3">
          {m && (
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-[17px] font-semibold text-white">{rupees(m.amount)}</span>
              <span className="text-white/40">{m.cadence.toLowerCase()}</span>
              <span className="ml-auto text-[11px] text-white/35">
                renews {m.renewsOn ? format(new Date(m.renewsOn), 'd MMM yyyy') : '—'}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Amount ₹" type="number" value={f.amount}
              onChange={(ev) => setF({ ...f, amount: ev.target.value })} className={field} />
            <select value={f.cadence} onChange={(ev) => setF({ ...f, cadence: ev.target.value })} className={field}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
            <Button size="sm" disabled={!f.amount || save.isPending} onClick={() => save.mutate()}>
              {m ? 'Update rate' : 'Create'}
            </Button>
          </div>
          {m && (
            <input placeholder="Why the rate changed" value={f.note}
              onChange={(ev) => setF({ ...f, note: ev.target.value })} className={field} />
          )}
          <p className="text-[10.5px] text-white/25">
            Warranty is {e.warrantyDays} days after delivery — free bug fixes. Maintenance is what follows it.
          </p>
        </div>
      </Panel>

      {m && (
        <Panel title="Rate history">
          <div className="space-y-2">
            {m.rates.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 text-[12px]">
                <span className="text-white/50">{format(new Date(r.effectiveOn), 'd MMM yyyy')}</span>
                <span className="ml-auto text-white/85">{rupees(r.amount)}</span>
                {r.note && <span className="text-[10px] text-white/35">{r.note}</span>}
              </div>
            ))}
            <p className="pt-1 text-[10.5px] text-white/25">
              Kept so an invoice raised months ago can still be explained.
            </p>
          </div>
        </Panel>
      )}
    </div>
  )
}

function ShowcaseTab({ e, refresh }: { e: any; refresh: () => void }) {
  const s = e.showcase
  const [f, setF] = useState({
    title: s?.title ?? e.title,
    summary: s?.summary ?? '',
    outcome: s?.outcome ?? '',
    clientNamed: s?.clientNamed ?? false,
    consentGiven: s?.consentGiven ?? false,
    consentBy: s?.consentBy ?? '',
    published: s?.published ?? false,
  })

  const save = useMutation({
    mutationFn: async () => (await api.put(`/api/admin/b2b/engagements/${e.id}/showcase`, f)).data.data,
    onSuccess: () => { refresh(); toast.success('Saved') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Could not save it'),
  })

  return (
    <Panel title="Publish this work">
      <div className="space-y-3">
        <div>
          <label className={label}>Title</label>
          <input value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} className={field} />
        </div>
        <div>
          <label className={label}>Summary</label>
          <textarea value={f.summary} onChange={(ev) => setF({ ...f, summary: ev.target.value })} rows={3} className={field} />
        </div>
        <div>
          <label className={label}>Outcome</label>
          <input value={f.outcome} onChange={(ev) => setF({ ...f, outcome: ev.target.value })} className={field} />
        </div>

        <div className="space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-amber-100/80">
            <input type="checkbox" checked={f.consentGiven}
              onChange={(ev) => setF({ ...f, consentGiven: ev.target.checked })} className="h-3.5 w-3.5 accent-[#c8f135]" />
            The client has agreed to this being published
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-amber-100/80">
            <input type="checkbox" checked={f.clientNamed}
              onChange={(ev) => setF({ ...f, clientNamed: ev.target.checked })} className="h-3.5 w-3.5 accent-[#c8f135]" />
            …and to being named
          </label>
          <input placeholder="Who agreed, and how" value={f.consentBy}
            onChange={(ev) => setF({ ...f, consentBy: ev.target.value })} className={field} />
          <p className="text-[10.5px] leading-relaxed text-amber-200/50">
            Consent to show the work and consent to be named are different permissions. Without the first,
            publishing is refused.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-white/70">
          <input type="checkbox" checked={f.published}
            onChange={(ev) => setF({ ...f, published: ev.target.checked })} className="h-3.5 w-3.5 accent-[#c8f135]" />
          Live on the site
        </label>

        <div className="flex justify-end">
          <Button disabled={save.isPending} isLoading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </div>
      </div>
    </Panel>
  )
}
