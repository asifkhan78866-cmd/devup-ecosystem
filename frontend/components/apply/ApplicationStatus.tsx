"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, X, CalendarDays, Video, MapPin, Award, ExternalLink } from "lucide-react";
import { PIPELINE_STAGES, STAGE_LABEL, candidateApi } from "@/lib/api/workspace";

/**
 * Replaces the apply form once a candidate has applied, so returning to the job
 * shows where they actually are rather than inviting a duplicate submission.
 */

/** Stages the candidate never needs to see as separate steps. */
const HIDDEN = new Set(["ONBOARDING"]);

const WHAT_HAPPENS_NEXT: Record<string, string> = {
  APPLIED: "The team will review your application shortly.",
  RESUME_SCREENING: "Your resume is being reviewed.",
  SHORTLISTED: "You have been shortlisted. Expect to hear about interviews.",
  HR_ROUND: "An HR conversation is the next step.",
  TECHNICAL_ROUND: "A technical round is next.",
  ASSIGNMENT: "You have an assignment stage in this process.",
  FINAL_INTERVIEW: "You are at the final interview stage.",
  SELECTED: "You have been selected. Your offer is being prepared.",
  OFFER_GENERATED: "Your offer is ready — respond below.",
  OFFER_ACCEPTED: "Offer accepted. The team will start onboarding you.",
  ONBOARDED: "You are onboarded. Welcome aboard.",
};

export default function ApplicationStatus({
  application,
  onChanged,
}: {
  application: any;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closed = Boolean(application.outcome);
  const rejected = application.outcome === "REJECTED";
  const withdrawn = application.outcome === "WITHDRAWN";
  const hired = application.outcome === "HIRED";

  const template: string[] = application.job?.pipelineTemplate?.length
    ? application.job.pipelineTemplate
    : [...PIPELINE_STAGES];
  const steps = template.filter((s) => !HIDDEN.has(s));

  const reachedIdx = steps.indexOf(application.stage);
  const reached = new Set(
    (application.events ?? []).map((e: any) => e.toStage as string)
  );

  const offer = application.offer;
  const offerPending = offer?.status === "SENT";
  // An acceptance can be taken back right up until they join — usually because
  // a second startup in the ecosystem also made an offer.
  const canWithdraw = offer?.status === "ACCEPTED" && !hired;
  const nextInterview = application.interviews?.[0];

  const respond = async (accept: boolean) => {
    if (!accept && canWithdraw && !confirm(
      "Withdraw your acceptance? The startup will be told you are not joining, and this offer cannot be accepted again."
    )) return;

    setBusy(true);
    setError(null);
    try {
      await candidateApi.respondToOffer(
        application.id,
        accept,
        accept ? undefined : canWithdraw ? "Withdrawn after accepting" : "Declined by candidate"
      );
      onChanged?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
            style={
              rejected || withdrawn
                ? { background: "rgba(248,113,113,0.1)", color: "#f87171" }
                : hired
                  ? { background: "rgba(200,241,53,0.12)", color: "#c8f135" }
                  : { background: "rgba(200,241,53,0.1)", color: "#c8f135" }
            }
          >
            {rejected || withdrawn ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {closed ? application.outcome : STAGE_LABEL[application.stage] ?? application.stage}
          </span>
          <span className="text-[11px] tabular-nums text-[#5a5a5a]">{application.applicationNo}</span>
        </div>

        <p className="text-[13px] leading-relaxed text-[#a1a1a1]">
          {rejected
            ? "Thank you for applying. The team is not moving forward with your application this time — this reflects fit for this particular role, and you are welcome to apply for other openings."
            : withdrawn
              ? "You withdrew this application."
              : WHAT_HAPPENS_NEXT[application.stage] ?? "Your application is in progress."}
        </p>

        <p className="mt-2 text-[11px] text-[#5a5a5a]">
          Applied {new Date(application.appliedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
      )}

      {/* Offer */}
      {offer && (
        <div
          className="mb-5 rounded-xl border p-4"
          style={{ background: "rgba(200,241,53,0.05)", borderColor: "rgba(200,241,53,0.25)" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-[#c8f135]" />
            <span className="text-[13px] font-semibold text-white">
              {offerPending ? "You have an offer" : `Offer ${offer.status.toLowerCase()}`}
            </span>
          </div>
          <div className="mb-3 space-y-1 text-[11.5px] text-[#a1a1a1]">
            <div>{offer.designation}</div>
            {(offer.ctc || offer.stipend) && <div>{offer.ctc ?? offer.stipend}</div>}
            <div>Joining {new Date(offer.joiningDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
            {offerPending && (
              <div className="text-[#facc15]">
                Respond by {new Date(offer.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
            )}
          </div>
          {offerPending && (
            <div className="flex gap-2">
              <button
                onClick={() => respond(true)}
                disabled={busy}
                className="flex-1 rounded-lg py-2 text-[12px] font-semibold disabled:opacity-50"
                style={{ background: "#c8f135", color: "#0a0a0a" }}
              >
                Accept offer
              </button>
              <button
                onClick={() => respond(false)}
                disabled={busy}
                className="rounded-lg border border-white/10 px-3 py-2 text-[12px] text-[#8b8b8b] transition hover:text-[#f87171] disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
          {canWithdraw && (
            <div className="border-t border-white/[0.08] pt-3">
              <p className="mb-2 text-[11px] text-[#6b6b6b]">
                Accepted an offer elsewhere? Withdraw here first — you can only hold one accepted
                offer across the ecosystem at a time.
              </p>
              <button
                onClick={() => respond(false)}
                disabled={busy}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-[11.5px] text-[#8b8b8b] transition hover:text-[#f87171] disabled:opacity-50"
              >
                Withdraw acceptance
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upcoming interview */}
      {nextInterview && !closed && (
        <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#8fb6ff]" />
            <span className="text-[13px] font-semibold text-white">
              {STAGE_LABEL[nextInterview.stage] ?? nextInterview.stage} scheduled
            </span>
          </div>
          <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#a1a1a1]">
            <span>
              {new Date(nextInterview.scheduledAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </span>
            <span className="flex items-center gap-1">
              {nextInterview.mode === "ONLINE" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {nextInterview.mode}
            </span>
          </div>
          {nextInterview.meetingUrl && (
            <a
              href={nextInterview.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{ background: "rgba(143,182,255,0.12)", color: "#8fb6ff" }}
            >
              Join interview <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Pipeline */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
        <p className="mb-3.5 text-[11px] uppercase tracking-wider text-[#6b6b6b]">Hiring process</p>
        <ol className="space-y-0">
          {steps.map((stage, i) => {
            const done = reached.has(stage) && i < reachedIdx;
            const current = i === reachedIdx && !closed;
            const isLast = i === steps.length - 1;

            return (
              <li key={stage} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast && (
                  <span
                    className="absolute left-[7px] top-4 bottom-0 w-px"
                    style={{ background: done ? "rgba(200,241,53,0.3)" : "rgba(255,255,255,0.07)" }}
                  />
                )}
                <span
                  className="z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: done ? "#c8f135" : current ? "rgba(200,241,53,0.18)" : "rgba(255,255,255,0.06)",
                    border: current ? "2px solid #c8f135" : "none",
                  }}
                >
                  {done && <Check className="h-2.5 w-2.5" style={{ color: "#0a0a0a" }} strokeWidth={3.5} />}
                </span>
                <span
                  className="text-[12.5px] leading-tight"
                  style={{
                    color: current ? "#ffffff" : done ? "#a1a1a1" : "#5a5a5a",
                    fontWeight: current ? 600 : 400,
                  }}
                >
                  {STAGE_LABEL[stage] ?? stage}
                  {current && <span className="ml-2 text-[10px] font-normal text-[#c8f135]">You are here</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <Link
        href="/dashboard/applications"
        className="mt-4 inline-block text-[12px] text-[#c8f135] hover:underline"
      >
        View all your applications →
      </Link>
    </div>
  );
}
