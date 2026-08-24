import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3,
  Link2, Quote, Eraser, Table,
} from 'lucide-react'

/**
 * A small rich-text editor for agreement bodies.
 *
 * Built on contentEditable rather than pulling in a full editor framework: the
 * output has to survive a server-side allowlist and end up as print CSS, so the
 * set of things worth supporting is short and fixed. document.execCommand is
 * formally deprecated but implemented everywhere, and nothing here depends on
 * behaviour beyond bold, lists and headings.
 *
 * Paste is the interesting part. Content arrives from Word and Google Docs
 * carrying their fonts, sizes and colours; left alone, every MOU would look
 * slightly different from the last. So pasted HTML is stripped to structure on
 * the way in, and the server sanitises again on the way out.
 */

const ALLOWED = new Set([
  'P', 'BR', 'HR', 'H1', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'UL', 'OL', 'LI', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'A',
])

/** Keeps the shape of pasted content, discards how it looked. */
function cleanPasted(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      walk(child)
      if (!ALLOWED.has(child.tagName)) {
        // Unwrap rather than delete: a <span> wrapper is noise, its text is not.
        child.replaceWith(...Array.from(child.childNodes))
        continue
      }
      for (const attr of Array.from(child.attributes)) {
        if (child.tagName === 'A' && attr.name === 'href') continue
        if ((child.tagName === 'TD' || child.tagName === 'TH') &&
            (attr.name === 'colspan' || attr.name === 'rowspan')) continue
        child.removeAttribute(attr.name)
      }
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}

interface Props {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

export function RichText({ value, onChange, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  /**
   * Only write into the DOM when the incoming value differs from what is
   * already there. Feeding it back on every keystroke would move the caret to
   * the start of the document as you type.
   */
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '<p><br></p>'
    }
  }, [value])

  const emit = () => onChange(ref.current?.innerHTML ?? '')

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    emit()
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      document.execCommand('insertHTML', false, cleanPasted(html))
    } else {
      // Blank lines in plain text are paragraph breaks, not literal newlines.
      const paras = text.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      document.execCommand('insertHTML', false, paras.join(''))
    }
    emit()
  }

  const insertLink = () => {
    if (!linkUrl.trim()) return
    run('createLink', linkUrl.trim())
    setLinkUrl('')
    setLinkOpen(false)
  }

  const insertTable = () => {
    const rows = 3, cols = 3
    const head = `<tr>${Array.from({ length: cols }, () => '<th>&nbsp;</th>').join('')}</tr>`
    const body = Array.from({ length: rows - 1 }, () =>
      `<tr>${Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('')}</tr>`
    ).join('')
    run('insertHTML', `<table><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`)
  }

  const Btn = ({ onClick, title, children }: any) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep the selection alive
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-white/[0.03] px-2 py-1.5">
        <Btn title="Bold (Ctrl+B)" onClick={() => run('bold')}><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn title="Italic (Ctrl+I)" onClick={() => run('italic')}><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn title="Underline (Ctrl+U)" onClick={() => run('underline')}><Underline className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <Btn title="Section heading" onClick={() => run('formatBlock', 'h2')}><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Sub-heading" onClick={() => run('formatBlock', 'h3')}><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Body text" onClick={() => run('formatBlock', 'p')}>
          <span className="px-0.5 text-[11px] font-medium">P</span>
        </Btn>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <Btn title="Bulleted list" onClick={() => run('insertUnorderedList')}><List className="h-3.5 w-3.5" /></Btn>
        <Btn title="Numbered list" onClick={() => run('insertOrderedList')}><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn title="Quote" onClick={() => run('formatBlock', 'blockquote')}><Quote className="h-3.5 w-3.5" /></Btn>
        <Btn title="Table" onClick={insertTable}><Table className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <Btn title="Link" onClick={() => setLinkOpen((o) => !o)}><Link2 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Clear formatting" onClick={() => run('removeFormat')}><Eraser className="h-3.5 w-3.5" /></Btn>

        <span className="ml-auto pr-1 text-[10px] text-white/25">
          Pasted content keeps its structure, not its styling
        </span>
      </div>

      {linkOpen && (
        <div className="flex gap-2 border-b border-white/10 bg-white/[0.02] px-2 py-2">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), insertLink())}
            placeholder="https://…  (select text first)"
            className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/90 outline-none"
          />
          <button
            type="button"
            onClick={insertLink}
            className="rounded px-2.5 py-1 text-xs"
            style={{ background: 'rgba(200,241,53,0.15)', color: '#c8f135' }}
          >
            Add
          </button>
        </div>
      )}

      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        spellCheck
        className="agreement-body min-h-[420px] max-h-[62vh] overflow-y-auto bg-[#0d0d0d] px-6 py-5 text-[13.5px] leading-relaxed text-white/85 outline-none"
      />
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
