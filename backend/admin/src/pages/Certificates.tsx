import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Award, Download, Eye, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Blank internship selection certificates for events.
 *
 * Organisers take a printed stack to a college, hand them to whoever performed
 * best on the day and write the names in by hand. So there is nothing to select
 * here and no recipient to choose — only how many, and which fields to
 * pre-print versus leave ruled for a pen.
 */
/**
 * Who signs these.
 *
 * The names go on a printed certificate a student keeps, so they are picked
 * from a list rather than retyped each time — a typo in someone's title is not
 * something you notice until a hundred are already printed.
 */
const SIGNATORIES = [
  { name: 'Faizan Sk', title: 'Co-Founder & CEO' },
  { name: 'Asif Syed', title: 'Co-Founder & CBSO' },
  { name: 'Narsing', title: 'F&H Dept' },
] as const

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

  // All three by default: a selection certificate carries the ecosystem's
  // leadership, not one person's authority.
  const [signing, setSigning] = useState<string[]>(SIGNATORIES.map((s) => s.name))

  const toggleSigner = (name: string) =>
    setSigning((prev) => {
      // Never leave zero — an unsigned certificate is not a document.
      if (prev.includes(name)) return prev.length === 1 ? prev : prev.filter((n) => n !== name)
      return SIGNATORIES.filter((s) => prev.includes(s.name) || s.name === name).map((s) => s.name)
    })

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
      // Hand the file straight to the browser rather than opening a tab that a
      // popup blocker may swallow.
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DevUp-Selection-Certificates-${form.count}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`${form.count} certificate${form.count === 1 ? '' : 's'} ready to print`)
    },
    onError: async (e: any) => {
      // The error body arrives as a Blob, because the request asked for one.
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
                Signed by — {signing.length} of {SIGNATORIES.length}
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

            {/* A scaled sketch of the page, so the shape is obvious before
                spending a render on the real thing. */}
            <div className="mx-auto max-w-[300px] rounded-lg bg-white p-4 text-black shadow-2xl">
              <div className="border border-black/80 p-1.5">
                <div className="border border-black/15 px-3 py-4 text-center">
                  <div className="mx-auto mb-2 h-5 w-5 rounded-sm bg-black/80" />
                  <div className="text-[8px] font-bold tracking-[2px]">DEVUP ECOSYSTEM</div>
                  <div className="mx-auto my-1.5 h-px w-8 bg-black/70" />
                  <div className="text-[7px] font-bold tracking-[1.4px]">
                    INTERNSHIP SELECTION CERTIFICATE
                  </div>
                  <div className="mt-2 text-[5px] tracking-[1.2px] text-black/50">
                    THIS IS TO CERTIFY THAT
                  </div>
                  <div className="mt-3 h-4 border-b border-black" />
                  <div className="mt-0.5 text-[5px] italic text-black/45">Name of Student</div>
                  <div className="mt-2.5 space-y-1">
                    {[100, 92, 96, 84].map((w, i) => (
                      <div
                        key={i}
                        className="mx-auto h-[3px] rounded bg-black/12"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-3 text-[5px] text-black/60">
                    <span className="flex-1 text-left">College: ______</span>
                    <span className="flex-1 text-left">Date: ______</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="w-[45%]">
                      <div className="h-px w-full bg-black/70" />
                      <div className="mt-0.5 text-left text-[5px] font-bold">Authorized Signatory</div>
                    </div>
                    <div className="h-7 w-7 rounded border border-dashed border-black/25" />
                  </div>
                  <div className="mt-2 text-[5px] italic text-black/45">
                    Building People. Products. Possibilities.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Printer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
              <p className="text-[11.5px] leading-relaxed text-white/45">
                A4, one per page, black and white — no colour ink needed. The seal box is left
                empty for your physical stamp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
