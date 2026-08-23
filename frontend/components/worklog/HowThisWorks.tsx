"use client";

import { useState } from "react";
import { LogIn, ListChecks, FileText, Wallet, ChevronDown, AlertTriangle } from "lucide-react";

/**
 * What an intern is expected to do, in their own words.
 *
 * Deliberately carries no figures — no stipend, no rate, no rupee amount.
 * What someone is paid is between them and the founders, and this panel is
 * rendered on a screen people open in a shared lab or hand to a friend. It
 * says what the rules are, not what anybody earns.
 */

const STEPS = [
  {
    icon: LogIn,
    title: "Check in when you start",
    body: "Office days run to the schedule on your card. On remote days, check in whenever you actually begin — evenings are fine.",
  },
  {
    icon: ListChecks,
    title: "Say what you did, every 90 minutes",
    body: "One or two lines is enough. Tap Meeting, Break, Travel or Blocked instead of typing where it fits. Add a link to a commit or a document when you have one.",
  },
  {
    icon: FileText,
    title: "Write your end-of-day summary",
    body: "What you got done, anything blocking you, what is next. The day is not complete without it.",
  },
];

export default function HowThisWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="text-white text-[15px] font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
            How your internship works
          </div>
          <div className="text-[11.5px] text-[#6b6b6b] mt-0.5">
            Check in, report your time, close the day. Two minutes to read.
          </div>
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[#6b6b6b] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="border-t border-white/5 px-5 py-5">
          <div className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                       style={{ background: "rgba(200,241,53,0.1)" }}>
                    <Icon className="h-4 w-4" style={{ color: "#c8f135" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-[#e4e4e4]">
                      <span className="text-[#6b6b6b] tabular-nums">{i + 1}.</span> {s.title}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#8b8b8b]">{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Said plainly, once, without numbers attached. */}
          <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[12px] leading-relaxed text-amber-200/80">
              Time you do not report does not count as worked. If something genuinely stops you —
              a power cut, no network, illness — file the update late with the reason and your
              founders can excuse it. Being stuck is not a problem; going quiet is.
            </p>
          </div>

          <div className="mt-3 flex gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#8fb6ff" }} />
            <p className="text-[12px] leading-relaxed text-[#8b8b8b]">
              Your reported work is reviewed at the end of each month. Once it is approved, your
              payout is processed within <span className="text-[#d4d4d4]">48 hours</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
