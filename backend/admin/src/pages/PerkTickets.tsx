import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Ticket, Printer, Search, Ban, ScanLine, Check } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * Every ticket ever issued.
 *
 * Doubles as the fallback redemption desk: when a partner cannot verify a code
 * themselves — no account yet, no phone signal, a queue building — DevUp can
 * confirm it here on their behalf.
 */

interface Award {
  id: string
  code: string
  recipientName: string
  recipientEmail: string
  sourceEvent: string | null
  issuedAt: string
  expiresAt: string
  status: string
  redeemedAt: string | null
  perk: { id: string; title: string }
  partner: { id: string; name: string; brandColor: string }
}

const TONE: Record<string, { bg: string; fg: string }> = {
  ISSUED: { bg: 'rgba(200,241,53,0.12)', fg: '#c8f135' },
  REDEEMED: { bg: 'rgba(143,182,255,0.12)', fg: '#8fb6ff' },
  EXPIRED: { bg: 'rgba(255,255,255,0.06)', fg: '#8b9299' },
  REVOKED: { bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

export default function PerkTickets() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [redeeming, setRedeeming] = useState(false)

  const awards = useQuery<Award[]>({
    queryKey: ['awards', q],
    queryFn: async () =>
      (await api.get(`/api/admin/partners/awards${q ? `?q=${encodeURIComponent(q)}` : ''}`)).data.data,
  })

  const print = useMutation({
    mutationFn: async (ids: string[]) =>
      (await api.post('/api/admin/partners/awards/print', { awardIds: ids })).data.data,
    onSuccess: (r) => {
      window.open(r.url, '_blank')
      setSelected(new Set())
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not render'),
  })

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const reason = prompt('Why is this ticket being revoked?')
      if (reason === null) throw new Error('cancelled')
      return (await api.post(`/api/admin/partners/awards/${id}/revoke`, { reason })).data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['awards'] })
      toast.success('Ticket revoked')
    },
    onError: (e: any) => {
      if (e.message === 'cancelled') return
      toast.error(e.response?.data?.error ?? 'Could not revoke')
    },
  })

  const rows = awards.data ?? []
  const printable = rows.filter((a) => a.status !== 'REVOKED')

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <>
      <TopBar title="Perk Tickets" />

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email or code"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <Button disabled={selected.size === 0 || print.isPending} onClick={() => print.mutate([...selected])}>
            <Printer className="h-4 w-4" />
            {selected.size ? `Print ${selected.size}` : 'Print'}
          </Button>

          {printable.length > 0 && (
            <button
              onClick={() => setSelected(new Set(printable.map((a) => a.id)))}
              className="text-xs text-white/45 transition hover:text-white"
            >
              Select all {printable.length}
            </button>
          )}

          <Button variant="outline" onClick={() => setRedeeming(true)}>
            <ScanLine className="h-4 w-4" /> Redeem a code
          </Button>
        </div>

        {awards.isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Ticket className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">
              {q ? 'Nothing matches that search.' : 'No tickets issued yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['', 'Code', 'Recipient', 'Perk', 'Awarded at', 'Issued', 'Expires', 'Status', ''].map((h, i) => (
                    <th key={i} className="whitespace-nowrap px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((a) => {
                  const tone = TONE[a.status] ?? TONE.EXPIRED
                  return (
                    <tr key={a.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          disabled={a.status === 'REVOKED'}
                          checked={selected.has(a.id)}
                          onChange={() => toggle(a.id)}
                          className="h-3.5 w-3.5 accent-[#c8f135] disabled:opacity-25"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px]" style={{ color: a.partner.brandColor }}>
                        {a.code}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-white/90">{a.recipientName}</div>
                        <div className="text-[10px] text-white/35">{a.recipientEmail}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-white/60">
                        <div>{a.perk.title}</div>
                        <div className="text-[10px] text-white/35">{a.partner.name}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-white/45">{a.sourceEvent ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-white/45">
                        {format(new Date(a.issuedAt), 'd MMM yy')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-white/45">
                        {format(new Date(a.expiresAt), 'd MMM yy')}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded px-2 py-1 text-[10px]" style={{ background: tone.bg, color: tone.fg }}>
                          {a.status}
                        </span>
                        {a.redeemedAt && (
                          <div className="mt-0.5 text-[9.5px] text-white/30">
                            {format(new Date(a.redeemedAt), 'd MMM')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {a.status === 'ISSUED' && (
                          <button
                            title="Revoke"
                            onClick={() => revoke.mutate(a.id)}
                            className="text-white/25 transition hover:text-[#f87171]"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {redeeming && (
        <RedeemModal
          onClose={() => setRedeeming(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ['awards'] })}
        />
      )}
    </>
  )
}

function RedeemModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState('')
  const [checked, setChecked] = useState<any>(null)

  // Checking is separate from consuming: the desk sees who the ticket belongs
  // to and decides, rather than the scan itself burning it.
  const check = useMutation({
    mutationFn: async () => (await api.get(`/api/verify/${encodeURIComponent(code.trim())}`)).data.data,
    onSuccess: setChecked,
    onError: () => toast.error('Could not check that code'),
  })

  const redeem = useMutation({
    mutationFn: async () => (await api.post('/api/admin/partners/awards/redeem', { code: code.trim() })).data.data,
    onSuccess: (r) => {
      toast.success(`Redeemed for ${r.recipientName}`)
      onDone()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not redeem'),
  })

  return (
    <Modal isOpen onClose={onClose} title="Redeem a ticket">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] text-white/40">Code from the ticket</label>
          <input
            autoFocus
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setChecked(null) }}
            onKeyDown={(e) => e.key === 'Enter' && code && check.mutate()}
            placeholder="DVP-D2PR-XXXXXX"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm tracking-wider text-white outline-none focus:border-white/25"
          />
        </div>

        {checked && (
          <div
            className="rounded-xl border p-3"
            style={
              checked.valid
                ? { borderColor: 'rgba(200,241,53,0.25)', background: 'rgba(200,241,53,0.07)' }
                : { borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.07)' }
            }
          >
            {!checked.found ? (
              <p className="text-sm text-red-300">No ticket with that code.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {checked.valid ? (
                    <Check className="h-4 w-4" style={{ color: '#c8f135' }} />
                  ) : (
                    <Ban className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm font-semibold text-white">{checked.recipientName}</span>
                  <span className="text-[11px] text-white/40">{checked.status}</span>
                </div>
                <p className="mt-1 text-[11.5px] text-white/60">
                  {checked.perkTitle} · {checked.partnerName}
                </p>
                {checked.redeemedAt && (
                  <p className="mt-1 text-[11px] text-white/40">
                    Already used on {format(new Date(checked.redeemedAt), 'd MMM yyyy')}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!checked ? (
            <Button disabled={!code || check.isPending} onClick={() => check.mutate()}>
              {check.isPending ? 'Checking…' : 'Check'}
            </Button>
          ) : (
            <Button disabled={!checked.valid || redeem.isPending} onClick={() => redeem.mutate()}>
              {redeem.isPending ? 'Redeeming…' : 'Mark redeemed'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
