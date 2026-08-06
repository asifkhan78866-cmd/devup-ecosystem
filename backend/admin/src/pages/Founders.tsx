import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Award, Download, Send, AlertTriangle, Check, Handshake } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * Founder appointment letters across the whole ecosystem.
 *
 * Founders belong to individual startups, but issuing their letters is a DevUp
 * job — one screen covering every startup rather than opening each workspace in
 * turn. Recipients are ticked explicitly: each letter is numbered and emailed,
 * and neither can be taken back.
 */

interface Founder {
  id: string
  name: string | null
  email: string
  role: string
  title: string | null
  status: string
  joinedAt: string | null
  startup: { id: string; code: string | null; name: string; type: string; logoUrl: string | null }
  letter: { id: string; documentNo: string; pdfUrl: string | null; issuedAt: string } | null
  canIssue: boolean
  blocked: string | null
}

export default function Founders() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<Founder[]>({
    queryKey: ['founders'],
    queryFn: async () => {
      const res = await api.get('/api/admin/founders')
      return res.data.data
    },
  })

  const send = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const res = await api.post('/api/admin/founders/letters', { memberIds })
      return res.data.data
    },
    onSuccess: (result) => {
      setConfirming(false)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['founders'] })
      toast.success(`${result.issued} letter${result.issued === 1 ? '' : 's'} issued and emailed`)
      // Skips carry a reason — surface each one rather than a silent partial run.
      for (const s of result.skipped ?? []) toast.error(`${s.email}: ${s.reason}`, { duration: 6000 })
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not issue letters'),
  })

  const founders = data ?? []
  const eligible = founders.filter((f) => f.canIssue)

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Grouped by startup so the page reads as "who is at which company".
  const byStartup = founders.reduce<Record<string, Founder[]>>((acc, f) => {
    ;(acc[f.startup.name] ??= []).push(f)
    return acc
  }, {})

  return (
    <>
      <TopBar title="Founder Letters" />

      <div className="p-6 space-y-5">
        <p className="text-sm text-white/50 max-w-3xl">
          Appointment letters for founders across every startup in the ecosystem. Each is numbered,
          signed on behalf of DevUp Ecosystem, and emailed with the PDF attached.
        </p>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {(error as any)?.response?.data?.error ?? 'Could not load founders'}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={selected.size === 0 || send.isPending} onClick={() => setConfirming(true)}>
            <Send className="w-4 h-4" />
            {selected.size ? `Send ${selected.size} letter${selected.size === 1 ? '' : 's'}` : 'Send letters'}
          </Button>

          {eligible.length > 0 && (
            <button
              onClick={() => setSelected(new Set(eligible.map((f) => f.id)))}
              className="text-xs text-white/50 transition hover:text-white"
            >
              Select all {eligible.length} who can receive one
            </button>
          )}
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-white/35 transition hover:text-white">
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : founders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Award className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">No founders recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byStartup).map(([name, members]) => (
              <div key={name} className="overflow-hidden rounded-2xl border border-white/[0.07]">
                <div className="flex items-center gap-2.5 bg-white/[0.03] px-4 py-3">
                  {members[0].startup.logoUrl && (
                    <img
                      src={members[0].startup.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded bg-white object-contain p-0.5"
                    />
                  )}
                  <span className="text-sm font-semibold text-white">{name}</span>
                  <span className="font-mono text-[10px] text-white/35">{members[0].startup.code}</span>
                  {members[0].startup.type === 'ECOSYSTEM_PARTNER' && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-wider"
                      style={{ background: 'rgba(120,170,255,0.10)', color: '#8fb6ff' }}
                    >
                      <Handshake className="h-2.5 w-2.5" /> Partner
                    </span>
                  )}
                </div>

                <div className="divide-y divide-white/5">
                  {members.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={!f.canIssue}
                        checked={selected.has(f.id)}
                        onChange={() => toggle(f.id)}
                        className="h-4 w-4 shrink-0 accent-[#c8f135] disabled:opacity-25"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white/90">
                          {f.name ?? f.email.split('@')[0]}
                          {/* The recorded title is what prints on the letter;
                              the permission role is only shown when none is set. */}
                          <span className="text-xs text-white/35"> · {f.title ?? f.role.toLowerCase()}</span>
                        </div>
                        <div className="truncate text-xs text-white/40">{f.email}</div>
                      </div>

                      {f.letter ? (
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="hidden font-mono text-[10px] text-white/30 md:inline">
                            {f.letter.documentNo}
                          </span>
                          <span className="hidden text-[10px] text-white/30 lg:inline">
                            {format(new Date(f.letter.issuedAt), 'd MMM yyyy')}
                          </span>
                          {f.letter.pdfUrl ? (
                            <a
                              href={f.letter.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs"
                              style={{ color: '#c8f135' }}
                            >
                              <Download className="h-3 w-3" /> PDF
                            </a>
                          ) : (
                            <span className="text-[10.5px] text-amber-400">file pending</span>
                          )}
                          <Check className="h-3.5 w-3.5" style={{ color: '#c8f135' }} />
                        </div>
                      ) : f.blocked ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 text-[10.5px] text-amber-400"
                          title={f.blocked}
                        >
                          <AlertTriangle className="h-3 w-3" /> {f.blocked}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10.5px] text-white/30">no letter yet</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} title="Issue founder letters">
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {selected.size} {selected.size === 1 ? 'person' : 'people'} will be issued a numbered
            appointment letter and emailed a copy.
          </p>
          <p className="text-xs text-white/40">
            Letter numbers are sequential per startup and per financial year. They cannot be reused,
            and an issued letter cannot be un-issued — only revoked.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button disabled={send.isPending} onClick={() => send.mutate([...selected])}>
              {send.isPending ? 'Sending…' : `Issue and email ${selected.size}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
