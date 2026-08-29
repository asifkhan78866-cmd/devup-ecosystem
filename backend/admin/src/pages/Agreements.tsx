import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RichText } from '@/components/ui/RichText'
import {
  FileSignature, Plus, Eye, Download, Check, X, Trash2, ChevronLeft, Send, Undo2,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/**
 * MOUs and letters on DevUp letterhead.
 *
 * Two states: a list of everything signed or in progress, and an editor for one
 * document. Picking a type seeds the body with that type's clauses, so nobody
 * starts from a blank page — but every commercial term is left as a blank for
 * a person to fill in deliberately.
 */

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  DRAFT: { bg: 'rgba(255,255,255,0.06)', fg: '#8b8b8b' },
  ISSUED: { bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  SIGNED: { bg: 'rgba(200,241,53,0.12)', fg: '#c8f135' },
  CANCELLED: { bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

interface Template {
  type: string; label: string; blurb: string
  title: string; subtitle: string; abbr: string; bodyHtml: string
}

export default function Agreements() {
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const qc = useQueryClient()

  const { data: list, isLoading } = useQuery<any[]>({
    queryKey: ['agreements'],
    queryFn: async () => (await api.get('/api/admin/agreements')).data.data,
  })

  const { data: templates } = useQuery<Template[]>({
    queryKey: ['agreement-templates'],
    queryFn: async () => (await api.get('/api/admin/agreements/templates')).data.data,
  })

  if (editing) {
    return (
      <Editor
        id={editing}
        templates={templates ?? []}
        onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['agreements'] }) }}
      />
    )
  }

  return (
    <>
      <TopBar title="Agreements & MOUs" />

      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-3xl text-sm text-white/50">
            Memoranda and letters issued on DevUp Ecosystem Pvt Ltd letterhead. Pick the kind of
            agreement, edit the clauses, then issue it — the reference number is allocated once
            and the letterhead repeats on every page.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New agreement
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : !list?.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <FileSignature className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">Nothing yet. Start with a new agreement.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            {list.map((a) => {
              const tone = STATUS_TONE[a.status] ?? STATUS_TONE.DRAFT
              return (
                <button
                  key={a.id}
                  onClick={() => setEditing(a.id)}
                  className="flex w-full items-center gap-4 border-b border-white/5 px-4 py-3.5 text-left transition last:border-0 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] text-white/90">{a.partyName}</div>
                    <div className="truncate text-[11px] text-white/40">
                      {a.title}
                      {a.documentNo ? <span className="font-mono"> · {a.documentNo}</span> : ''}
                    </div>
                  </div>
                  <span className="hidden text-[10.5px] uppercase tracking-wider text-white/30 md:inline">
                    {a.type.toLowerCase()}
                  </span>
                  <span className="hidden text-[10.5px] text-white/30 lg:inline">
                    {format(new Date(a.updatedAt), 'd MMM yyyy')}
                  </span>
                  <span
                    className="shrink-0 rounded px-2 py-1 text-[10px]"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {a.status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {creating && templates && (
        <NewAgreement
          templates={templates}
          onClose={() => setCreating(false)}
          onCreated={(id) => { setCreating(false); setEditing(id); qc.invalidateQueries({ queryKey: ['agreements'] }) }}
        />
      )}
    </>
  )
}

/**
 * A rubber stamp, not a sentence.
 *
 * Once a document has gone out the only question anyone asks of this panel is
 * whether it has — so the answer is a mark you read at a glance, in the same
 * register as the seals on the document itself. The address is part of the
 * stamp because "sent" without "to whom" is the half that gets misremembered.
 */
function SentStamp({ to, at, times }: { to: string | null; at: string; times: number }) {
  return (
    <div className="flex justify-center py-1">
      <div
        className="-rotate-[7deg] select-none rounded-md border-2 px-3.5 py-1.5 text-center"
        style={{ borderColor: 'rgba(200,241,53,0.55)', background: 'rgba(200,241,53,0.06)' }}
      >
        <div
          className="text-[13px] font-extrabold leading-none tracking-[3px]"
          style={{ color: '#c8f135' }}
        >
          SENT
        </div>
        <div className="mt-1 text-[9.5px] leading-tight text-[#c8f135]/70">{to}</div>
        <div className="mt-0.5 text-[8.5px] leading-tight text-[#c8f135]/45">
          {format(new Date(at), 'd MMM yyyy, h:mm a')}
          {times > 1 ? ` · ${times}×` : ''}
        </div>
      </div>
    </div>
  )
}

const label = 'block text-[11px] text-white/45 mb-1.5'
const field =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-[#c8f135]/40'

function NewAgreement({
  templates, onClose, onCreated,
}: { templates: Template[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [type, setType] = useState(templates[0]?.type ?? 'B2B')
  const [partyName, setPartyName] = useState('')

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/agreements', { type, partyName })
      return res.data.data
    },
    onSuccess: (a) => onCreated(a.id),
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not create it'),
  })

  return (
    <Modal isOpen onClose={onClose} title="New agreement">
      <div className="space-y-4">
        <div>
          <label className={label}>What kind?</label>
          <div className="space-y-1.5">
            {templates.map((t) => {
              const active = type === t.type
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className="w-full rounded-lg border px-3 py-2.5 text-left transition"
                  style={
                    active
                      ? { borderColor: 'rgba(200,241,53,0.4)', background: 'rgba(200,241,53,0.07)' }
                      : { borderColor: 'rgba(255,255,255,0.10)' }
                  }
                >
                  <div className="text-[13px] font-medium" style={{ color: active ? '#c8f135' : '#e4e4e4' }}>
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-white/40">{t.blurb}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className={label}>Who is it with?</label>
          <input
            autoFocus
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="Company or organisation name"
            className={field}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={partyName.trim().length < 2 || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? 'Creating…' : 'Create draft'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Editor({ id, templates, onClose }: { id: string; templates: Template[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [dirty, setDirty] = useState(false)

  const { data: board } = useQuery<Array<{ name: string; title: string }>>({
    queryKey: ['agreement-signatories'],
    queryFn: async () => (await api.get('/api/admin/signatories')).data.data,
    staleTime: Infinity,
  })

  const { data } = useQuery<any>({
    queryKey: ['agreement', id],
    queryFn: async () => {
      const a = (await api.get(`/api/admin/agreements/${id}`)).data.data
      setForm({
        title: a.title, partyName: a.partyName, partyAddress: a.partyAddress ?? '',
        partySignatory: a.partySignatory ?? '', partyTitle: a.partyTitle ?? '',
        partySignOrg: a.partySignOrg ?? '',
        extraSignatories: Array.isArray(a.extraSignatories) ? a.extraSignatories : [],
        partyEmail: a.partyEmail ?? '', contentHtml: a.contentHtml,
        effectiveDate: a.effectiveDate?.slice(0, 10) ?? '',
        expiryDate: a.expiryDate?.slice(0, 10) ?? '',
        signatoryName: a.signatoryName ?? '', signatoryTitle: a.signatoryTitle ?? '',
      })
      return a
    },
  })

  // Values are not all strings — the extra signature block is an array.
  const set = (k: string, v: unknown) => { setForm((f: any) => ({ ...f, [k]: v })); setDirty(true) }

  const save = useMutation({
    mutationFn: async () => (await api.patch(`/api/admin/agreements/${id}`, {
      ...form,
      effectiveDate: form.effectiveDate || null,
      expiryDate: form.expiryDate || null,
    })).data.data,
    onSuccess: () => {
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['agreement', id] })
      toast.success('Saved')
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not save'),
  })

  const issue = useMutation({
    mutationFn: async () => {
      if (dirty) await save.mutateAsync()
      return (await api.post(`/api/admin/agreements/${id}/issue`)).data.data
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['agreement', id] })
      toast.success(`Issued as ${a.documentNo}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not issue it'),
  })

  const status = useMutation({
    // ISSUED is a destination too, so a mis-click on "Mark signed" is undoable.
    mutationFn: async (s: 'SIGNED' | 'CANCELLED' | 'ISSUED') =>
      (await api.post(`/api/admin/agreements/${id}/status`, { status: s })).data.data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agreement', id] }); toast.success('Updated') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not update'),
  })

  const remove = useMutation({
    mutationFn: async () => (await api.delete(`/api/admin/agreements/${id}`)).data.data,
    onSuccess: () => { toast.success('Draft deleted'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Could not delete'),
  })

  /** Opened through the API client so the admin token travels with it. */
  const send = useMutation({
    mutationFn: async () => {
      // Save first: an address typed but not saved is not the address the
      // server would send to.
      if (dirty) await save.mutateAsync()
      return (await api.post(`/api/admin/agreements/${id}/send`)).data.data
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['agreement', id] })
      qc.invalidateQueries({ queryKey: ['agreements'] })
      toast.success(`Sent to ${r.sentTo}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Could not send it'),
  })

  const openRendered = async (kind: 'preview' | 'pdf') => {
    if (dirty) await save.mutateAsync()
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow pop-ups'); return }
    try {
      if (kind === 'preview') {
        const res = await api.get(`/api/admin/agreements/${id}/preview`, { responseType: 'text' })
        w.document.open(); w.document.write(res.data as string); w.document.close()
      } else {
        const res = await api.get(`/api/admin/agreements/${id}/pdf`, { responseType: 'blob' })
        w.location.href = URL.createObjectURL(res.data as Blob)
      }
    } catch {
      w.close()
      toast.error('Could not render it')
    }
  }

  if (!data || !form) return <><TopBar title="Agreement" /><p className="p-6 text-sm text-white/40">Loading…</p></>

  const tpl = templates.find((t) => t.type === data.type)
  const locked = data.status === 'SIGNED' || data.status === 'CANCELLED'
  const tone = STATUS_TONE[data.status] ?? STATUS_TONE.DRAFT

  return (
    <>
      <TopBar title="Agreement" />

      <div className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button onClick={onClose} className="inline-flex items-center gap-1 text-[12.5px] text-white/50 transition hover:text-white">
            <ChevronLeft className="h-3.5 w-3.5" /> All agreements
          </button>
          <span className="text-[10.5px] uppercase tracking-wider text-white/35">{tpl?.label ?? data.type}</span>
          {data.documentNo && <span className="font-mono text-[11px] text-white/40">{data.documentNo}</span>}
          <span className="rounded px-2 py-1 text-[10px]" style={{ background: tone.bg, color: tone.fg }}>
            {data.status}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {dirty && <span className="text-[11px] text-amber-400">Unsaved changes</span>}
            <Button variant="outline" disabled={save.isPending} onClick={() => openRendered('preview')}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="outline" onClick={() => openRendered('pdf')}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            {!locked && (
              <Button disabled={save.isPending || !dirty} onClick={() => save.mutate()}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <RichText
              value={form.contentHtml}
              onChange={(html) => set('contentHtml', html)}
              disabled={locked}
            />
            <p className="mt-2 text-[11px] text-white/30">
              Paste your content straight in. Long documents flow onto as many pages as they need,
              with the letterhead repeated on each.
            </p>
          </div>

          <div className="space-y-4">
            <Section title="Document">
              <div>
                <label className={label}>Title</label>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} disabled={locked} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Effective from</label>
                  <input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} disabled={locked} className={field} />
                </div>
                <div>
                  <label className={label}>Valid until</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} disabled={locked} className={field} />
                </div>
              </div>
            </Section>

            <Section title="Second party">
              <div>
                <label className={label}>Name</label>
                <input value={form.partyName} onChange={(e) => set('partyName', e.target.value)} disabled={locked} className={field} />
              </div>
              <div>
                <label className={label}>Address</label>
                <input value={form.partyAddress} onChange={(e) => set('partyAddress', e.target.value)} disabled={locked} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Signatory</label>
                  <input value={form.partySignatory} onChange={(e) => set('partySignatory', e.target.value)} disabled={locked} className={field} />
                </div>
                <div>
                  <label className={label}>Their title</label>
                  <input value={form.partyTitle} onChange={(e) => set('partyTitle', e.target.value)} disabled={locked} className={field} />
                </div>
              </div>

              {/*
                Never locked, even once signed. The address is where the
                document is sent, not part of what was agreed — it appears
                nowhere in the rendered document — and locking it made a signed
                agreement impossible to send at all.
              */}
              <div className="mt-2">
                <label className={label}>Signs as — if not the name above</label>
                <input
                  value={form.partySignOrg}
                  onChange={(e) => set('partySignOrg', e.target.value)}
                  disabled={locked}
                  placeholder={form.partyName}
                  className={field}
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/30">
                  Printed under their signature. Use it when the countersigning body is not the
                  party named in the document — a club or cell inside the college, say.
                </p>
              </div>

              <div className="mt-2">
                <label className={label}>Email — where the document is sent</label>
                <input
                  type="email"
                  value={form.partyEmail}
                  onChange={(e) => set('partyEmail', e.target.value)}
                  placeholder="registrar@college.edu"
                  className={field}
                />
              </div>
            </Section>

            <Section title="Additional signatory">
              {/*
                One extra column at most. A fourth block leaves every rule too
                short to actually sign on at A4.
              */}
              {(form.extraSignatories?.length ?? 0) === 0 ? (
                <button
                  disabled={locked}
                  onClick={() => set('extraSignatories', [{ name: '', title: 'Faculty Coordinator', org: '' }])}
                  className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition hover:text-white disabled:opacity-30"
                >
                  <Plus className="h-3 w-3" /> Add a third signature block
                </button>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className={label}>Their role</label>
                    <input
                      value={form.extraSignatories[0]?.title ?? ''}
                      onChange={(e) =>
                        set('extraSignatories', [{ ...form.extraSignatories[0], title: e.target.value }])
                      }
                      disabled={locked}
                      placeholder="Faculty Coordinator"
                      className={field}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={label}>Name</label>
                      <input
                        value={form.extraSignatories[0]?.name ?? ''}
                        onChange={(e) =>
                          set('extraSignatories', [{ ...form.extraSignatories[0], name: e.target.value }])
                        }
                        disabled={locked}
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={label}>Organisation</label>
                      <input
                        value={form.extraSignatories[0]?.org ?? ''}
                        onChange={(e) =>
                          set('extraSignatories', [{ ...form.extraSignatories[0], org: e.target.value }])
                        }
                        disabled={locked}
                        className={field}
                      />
                    </div>
                  </div>
                  <button
                    disabled={locked}
                    onClick={() => set('extraSignatories', [])}
                    className="inline-flex items-center gap-1 text-[11px] text-white/30 transition hover:text-red-300 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              )}
            </Section>

            <Section title="Signing for DevUp">
              <label className={label}>Director</label>
              <select
                value={form.signatoryName}
                onChange={(e) => {
                  // Title follows the name: an office belongs to the person
                  // holding it, and picking them apart invites a mismatch.
                  const d = board?.find((x) => x.name === e.target.value)
                  setForm((f: any) => ({ ...f, signatoryName: e.target.value, signatoryTitle: d?.title ?? f.signatoryTitle }))
                  setDirty(true)
                }}
                disabled={locked}
                className={field}
              >
                {board?.some((d) => d.name === form.signatoryName) === false && form.signatoryName && (
                  <option value={form.signatoryName}>{form.signatoryName}</option>
                )}
                {board?.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-white/35">{form.signatoryTitle}</p>
            </Section>

            <div className="space-y-2 rounded-2xl border border-white/[0.07] p-4">
              {data.status === 'DRAFT' && (
                <>
                  <Button disabled={issue.isPending} onClick={() => issue.mutate()}>
                    <FileSignature className="h-4 w-4" />
                    {issue.isPending ? 'Issuing…' : 'Issue — allocate reference number'}
                  </Button>
                  <p className="text-[11px] leading-relaxed text-white/35">
                    Takes the next number in this type&apos;s series and renders the PDF. The number
                    is never reused, so issue once you are happy with the wording.
                  </p>
                  <button
                    onClick={() => confirm('Delete this draft?') && remove.mutate()}
                    className="inline-flex items-center gap-1 pt-1 text-[11px] text-white/30 transition hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" /> Delete draft
                  </button>
                </>
              )}

              {(data.status === 'ISSUED' || data.status === 'SIGNED') && (
                <div className="space-y-2">
                  {/*
                    Only offered once a reference number exists. Sending a draft
                    would invite the other side to sign something that cannot be
                    cited afterwards.
                  */}
                  <Button
                    variant={data.sentAt ? 'outline' : 'primary'}
                    disabled={send.isPending || !form.partyEmail?.trim()}
                    isLoading={send.isPending}
                    onClick={() => {
                      if (data.sentAt && !confirm(`Already sent to ${data.sentTo}. Send it again?`)) return
                      send.mutate()
                    }}
                  >
                    <Send className="h-4 w-4" />
                    {data.sentAt ? 'Send again' : 'Send by email'}
                  </Button>

                  {/*
                    Only the action, plus whatever the admin cannot proceed
                    without. Once it has gone the panel says so as a stamp
                    rather than a sentence — the question being asked at a
                    glance is "has this gone out", and a mark answers that
                    faster than a line of prose.
                  */}
                  {!form.partyEmail?.trim() && (
                    <p className="text-[11px] leading-relaxed text-amber-200/60">
                      Add an email under <span className="text-amber-100">Second party</span> to send
                      this.
                    </p>
                  )}

                  {data.sentAt && <SentStamp to={data.sentTo} at={data.sentAt} times={data.sentCount} />}
                </div>
              )}

              {data.status === 'ISSUED' && (
                <div className="flex gap-2 border-t border-white/[0.07] pt-3">
                  {/*
                    Confirmed, because marking signed locks the wording and the
                    button sits next to the one people actually came here to
                    press. A slip used to leave a document nobody could edit.
                  */}
                  <Button
                    variant="outline"
                    disabled={status.isPending}
                    onClick={() =>
                      confirm(
                        'Mark this as signed? The wording locks so the file always matches what was agreed. You can undo it if this was a mistake.'
                      ) && status.mutate('SIGNED')
                    }
                  >
                    <Check className="h-3.5 w-3.5" /> Mark signed
                  </Button>
                  <Button
                    variant="outline"
                    disabled={status.isPending}
                    onClick={() => confirm('Cancel this agreement?') && status.mutate('CANCELLED')}
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              )}

              {data.status === 'SIGNED' && (
                <div className="border-t border-white/[0.07] pt-3">
                  <button
                    onClick={() =>
                      confirm('Unlock this agreement for editing again?') && status.mutate('ISSUED')
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] text-white/35 transition hover:text-white/70"
                  >
                    <Undo2 className="h-3 w-3" /> Marked signed by mistake? Undo
                  </button>
                </div>
              )}

              {locked && (
                <p className="text-[11.5px] text-white/40">
                  {data.status === 'SIGNED'
                    ? 'Signed. The wording is locked so the file always matches what was agreed.'
                    : 'Cancelled.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.07] p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/35">{title}</div>
      {children}
    </div>
  )
}
