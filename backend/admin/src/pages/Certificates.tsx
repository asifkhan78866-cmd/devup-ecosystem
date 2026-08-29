import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Award, Download, Eye, Printer, History, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Blank internship selection certificates for events.
 */
type Signatory = { name: string; title: string }

type BatchRecord = {
  id: string
  createdAt: string
  count: number
  college: string | null
  issueDate: string | null
  startSerial: string | null
  endSerial: string | null
  serialRange: string | null
}

export default function Certificates() {
  const [form, setForm] = useState<{
    count: number
    college: string
    issueDate: string
    numbered: boolean
  }>({
    count: 10,
    college: '',
    issueDate: '',
    numbered: true,
  })

  const { data: board } = useQuery<Signatory[]>({
    queryKey: ['signatories'],
    queryFn: async () => (await api.get('/api/admin/signatories')).data.data,
    staleTime: Infinity,
  })
  const SIGNATORIES: Signatory[] = board ?? []

  const { data: historyData, refetch: refetchHistory } = useQuery<BatchRecord[]>({
    queryKey: ['certificate-history'],
    queryFn: async () => (await api.get('/api/admin/certificates/history')).data.data,
  })
  const historyList = historyData ?? []

  // Generic Authorized Signatory by default unless specific names are selected.
  const [signing, setSigning] = useState<string[]>([])

  const toggleSigner = (name: string) =>
    setSigning((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )

  const signatories = SIGNATORIES.filter((s) => signing.includes(s.name)).map((s) => ({
    name: s.name,
    title: s.title,
  }))

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const download = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/certificates/batch', { ...form, signatories }, { responseType: 'blob' })
      return res.data as Blob
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DevUp-Selection-Certificates-${form.count}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`${form.count} certificate${form.count === 1 ? '' : 's'} ready to print`)
      refetchHistory()
    },
    onError: async (e: any) => {
      let msg = 'Could not generate the certificates'
      try {
        const text = await e.response?.data?.text?.()
        if (text) msg = JSON.parse(text).error ?? msg
      } catch {
        /* keep the fallback message */
      }
      toast.error(msg)
    },
  })

  const preview = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/certificates/preview', { ...form, signatories }, { responseType: 'text' })
      return res.data as string
    },
    onSuccess: (html) => {
      const w = window.open('', '_blank')
      if (!w) {
        toast.error('Allow pop-ups to preview')
        return
      }
      w.document.write(html)
      w.document.close()
    },
    onError: () => toast.error('Could not build the preview'),
  })

  const label = 'block text-[11px] text-white/45 mb-1.5'
  const field =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-[#c8f135]/40'

  return (
    <>
      <TopBar title="Selection Certificates" />

      <div className="p-6">
        <p className="mb-6 max-w-3xl text-sm text-white/50">
          Blank internship selection certificates for events. Print a stack, hand them to the
          students who performed best and write the names in by hand. DevUp Ecosystem branding
          only — which startup they join is decided afterwards.
        </p>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-4 rounded-2xl border border-white/[0.07] p-5">
            <div>
              <label className={label}>How many</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.count}
                onChange={(e) => set('count', Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className={field}
              />
              <p className="mt-1.5 text-[11px] text-white/30">One per page, up to 100 in a run.</p>
            </div>

            <div>
              <label className={label}>College — leave blank to write by hand</label>
              <input
                placeholder="e.g. VJIT, Hyderabad"
                value={form.college}
                onChange={(e) => set('college', e.target.value)}
                className={field}
              />
            </div>

            <div>
              <label className={label}>Date of issue — leave blank to write by hand</label>
              <input
                placeholder="e.g. 12 August 2026"
                value={form.issueDate}
                onChange={(e) => set('issueDate', e.target.value)}
                className={field}
              />
            </div>

            <div>
              <label className={label}>
                Signed by — {signing.length === 0 ? 'Authorized Signatory (Default)' : `${signing.length} selected`}
              </label>
              <div className="flex flex-wrap gap-2">
                {SIGNATORIES.map((s) => {
                  const active = signing.includes(s.name)
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleSigner(s.name)}
                      className="rounded-lg border px-3 py-2 text-left transition"
                      style={
                        active
                          ? { borderColor: 'rgba(200,241,53,0.4)', background: 'rgba(200,241,53,0.08)' }
                          : { borderColor: 'rgba(255,255,255,0.10)' }
                      }
                    >
                      <div
                        className="text-[12.5px] font-medium"
                        style={{ color: active ? '#c8f135' : '#e4e4e4' }}
                      >
                        {s.name}
                      </div>
                      <div className="text-[10.5px] text-white/40">{s.title}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={form.numbered}
                onChange={(e) => set('numbered', e.target.checked)}
                className="h-4 w-4 accent-[#c8f135]"
              />
              <span className="text-[12.5px] text-white/70">
                Print a serial on each
                <span className="block text-[11px] text-white/35">
                  Lets you record which certificate went to which student.
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button disabled={download.isPending} onClick={() => download.mutate()}>
                <Download className="h-4 w-4" />
                {download.isPending ? 'Generating…' : `Download ${form.count} PDF`}
              </Button>
              <Button variant="outline" disabled={preview.isPending} onClick={() => preview.mutate()}>
                <Eye className="h-4 w-4" /> Preview one
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] p-5">
            <div className="mb-4 flex items-center gap-2 text-white/80">
              <Award className="h-4 w-4" style={{ color: '#c8f135' }} />
              <span className="text-sm font-semibold">What gets printed</span>
            </div>

            {/* A scaled sketch of the page */}
            <div className="mx-auto max-w-[300px] rounded-lg bg-white p-4 text-black shadow-2xl">
              <div className="border border-black/80 p-1.5">
                <div className="border border-black/15 px-3 py-3.5 text-center">
                  <div className="mx-auto mb-1.5 h-4 w-4 rounded-sm bg-black/80" />
                  <div className="text-[7.5px] font-bold tracking-[2px]">DEVUP ECOSYSTEM</div>
                  <div className="mx-auto my-1 h-px w-6 bg-black/70" />
                  <div className="text-[6.5px] font-bold tracking-[1.2px]">
                    INTERNSHIP SELECTION CERTIFICATE
                  </div>
                  <div className="mt-1.5 text-[4.5px] tracking-[1.2px] text-black/50">
                    THIS IS TO CERTIFY THAT
                  </div>
                  <div className="mt-2.5 h-3.5 border-b border-black" />
                  <div className="mt-0.5 text-[4.5px] italic text-black/45">Name of Student</div>
                  <div className="mt-2 space-y-1">
                    {[100, 92, 96, 84].map((w, i) => (
                      <div
                        key={i}
                        className="mx-auto h-[2.5px] rounded bg-black/12"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 flex gap-2 text-[4.5px] text-black/60">
                    <span className="flex-1 text-left">College: ______</span>
                    <span className="flex-1 text-left">Date: ______</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="w-[50%]">
                      <div className="h-px w-full bg-black/70" />
                      <div className="mt-0.5 text-left text-[4.5px] font-bold tracking-wider uppercase text-black/80">Authorized Signatory</div>
                      <div className="text-left text-[3.5px] text-black/50">DevUp Ecosystem</div>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-900/60 bg-blue-50/50 text-[3.5px] font-bold uppercase text-blue-900 tracking-tighter">
                      Seal
                    </div>
                  </div>
                  <div className="mt-2 text-[4px] italic text-black/45">
                    Building People. Products. Possibilities.
                  </div>
                  <div className="mt-1.5 rounded-sm bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 py-0.5 text-[4px] font-bold tracking-widest uppercase text-black/80">
                    DEVUP ECOSYSTEM
                  </div>
                  <div className="mt-1 text-[3.5px] text-black/40">
                    Official Ecosystem Record &middot; Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Printer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c8f135]" />
              <p className="text-[11.5px] leading-relaxed text-white/60">
                A4, one per page, high resolution — pre-printed with DevUp official seal and aligned signatory credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Previously Issued Certificate Runs History */}
        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.01] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <History className="h-4 w-4 text-[#c8f135]" />
              <h2 className="text-base font-semibold">Generated Certificate History & Verification</h2>
            </div>
            <span className="text-xs text-white/40">
              {historyList.length} previous {historyList.length === 1 ? 'batch' : 'batches'} recorded
            </span>
          </div>

          {historyList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
              No previous certificate batches generated yet. Downloaded batches will be logged here automatically with unique sequential serial numbers.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="border-b border-white/10 bg-white/5 uppercase text-[10px] tracking-wider text-white/40 font-mono">
                  <tr>
                    <th className="px-4 py-3">Generated At</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Serial Series</th>
                    <th className="px-4 py-3">College</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyList.map((batch) => (
                    <tr key={batch.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 font-mono text-white/60">
                        {new Date(batch.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#c8f135]">
                        {batch.count} copy{batch.count === 1 ? '' : 'ies'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-white/90 border border-white/10">
                          <ShieldCheck className="h-3 w-3 text-[#c8f135]" />
                          {batch.serialRange || `${batch.startSerial || 'DEVUP/ISC'} — ${batch.endSerial || ''}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {batch.college || <span className="italic text-white/30">Handwritten</span>}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {batch.issueDate || <span className="italic text-white/30">Handwritten</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              count: batch.count,
                              college: batch.college || '',
                              issueDate: batch.issueDate || '',
                            }))
                            toast.success('Form loaded with this batch settings')
                          }}
                        >
                          Re-load Settings
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
