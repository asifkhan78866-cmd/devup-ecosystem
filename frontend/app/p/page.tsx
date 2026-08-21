"use client";

import { useEffect, useState, useCallback } from "react";
import { ScanLine, CheckCircle2, XCircle, Clock, Ban, Ticket } from "lucide-react";
import ProtectedContent from "@/components/auth/ProtectedContent";
import { partnerApi } from "@/lib/api/workspace";

/**
 * Partner portal.
 *
 * One job, done fast: someone is standing at the desk holding a ticket. So the
 * code box is focused on load, Enter checks, and the verdict is the largest
 * thing on screen.
 *
 * Checking and redeeming are two steps on purpose. The desk sees the holder's
 * name and decides; the scan itself never consumes the ticket.
 */

interface PartnerSummary {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  brandColor: string;
  myRole: string;
  stats: { perks: number; issued: number; redeemed: number; outstanding: number; expired: number };
}

interface AwardRow {
  id: string;
  code: string;
  recipientName: string;
  sourceEvent: string | null;
  issuedAt: string;
  expiresAt: string;
  status: string;
  redeemedAt: string | null;
  perkTitle: string;
}

export default function PartnerPortalPage() {
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [active, setActive] = useState<PartnerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerApi
      .myPartners()
      .then((list) => {
        setPartners(list);
        setActive(list[0] ?? null);
      })
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedContent blurRadius={12} message="Login to open the partner desk">
      <div className="min-h-screen bg-[#0a0a0a] pb-24 pt-28">
        <div className="mx-auto max-w-3xl px-6">
          {loading ? (
            <p className="text-sm text-[#6b6b6b]">Loading…</p>
          ) : partners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <Ticket className="mx-auto mb-3 h-8 w-8 text-[#3d3d3d]" />
              <h1 className="text-white" style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}>
                No partner desk on this account
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b6b6b]">
                This page is for DevUp partners redeeming member tickets. Ask DevUp to add your
                account to your organisation.
              </p>
            </div>
          ) : (
            active && <Desk key={active.id} partner={active} partners={partners} onSwitch={setActive} />
          )}
        </div>
      </div>
    </ProtectedContent>
  );
}

function Desk({
  partner,
  partners,
  onSwitch,
}: {
  partner: PartnerSummary;
  partners: PartnerSummary[];
  onSwitch: (p: PartnerSummary) => void;
}) {
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [stats, setStats] = useState(partner.stats);

  const load = useCallback(() => {
    partnerApi.partnerAwards(partner.id).then(setAwards).catch(() => setAwards([]));
    partnerApi.myPartners().then((list) => {
      const fresh = list.find((p: PartnerSummary) => p.id === partner.id);
      if (fresh) setStats(fresh.stats);
    });
  }, [partner.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center gap-3">
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
        ) : (
          <span className="h-10 w-10 rounded-lg" style={{ background: partner.brandColor }} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl text-white" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
            {partner.name}
          </h1>
          <p className="text-[12px] text-[#6b6b6b]">Partner desk · {partner.myRole.toLowerCase()}</p>
        </div>

        {partners.length > 1 && (
          <select
            value={partner.id}
            onChange={(e) => onSwitch(partners.find((p) => p.id === e.target.value)!)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#111]">{p.name}</option>
            ))}
          </select>
        )}
      </header>

      <Scanner partnerId={partner.id} accent={partner.brandColor} onRedeemed={load} />

      <div className="my-6 grid grid-cols-3 gap-3">
        <Stat label="Issued" value={stats.issued} />
        <Stat label="Redeemed" value={stats.redeemed} accent={partner.brandColor} />
        <Stat label="Outstanding" value={stats.outstanding} />
      </div>

      <h2 className="mb-2 text-[11px] uppercase tracking-wider text-[#6b6b6b]">Recent tickets</h2>
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        {awards.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#6b6b6b]">No tickets issued for you yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {awards.slice(0, 30).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="font-mono text-[11px]" style={{ color: partner.brandColor }}>{a.code}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-[#e4e4e4]">{a.recipientName}</div>
                  <div className="truncate text-[10.5px] text-[#5a5a5a]">
                    {a.perkTitle}
                    {a.sourceEvent ? ` · ${a.sourceEvent}` : ""}
                  </div>
                </div>
                <span className="text-[10.5px] text-[#6b6b6b]">
                  {a.status === "REDEEMED" && a.redeemedAt
                    ? `used ${fmt(a.redeemedAt)}`
                    : a.status === "ISSUED"
                      ? `valid to ${fmt(a.expiresAt)}`
                      : a.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Scanner({
  partnerId,
  accent,
  onRedeemed,
}: {
  partnerId: string;
  accent: string;
  onRedeemed: () => void;
}) {
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setChecked(await partnerApi.verify(code.trim()));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await partnerApi.redeem(partnerId, code.trim());
      setChecked({ ...checked, status: "REDEEMED", valid: false, redeemedAt: r.redeemedAt });
      onRedeemed();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setCode("");
    setChecked(null);
    setError(null);
  };

  const tone =
    checked?.found === false
      ? "#f87171"
      : checked?.valid
        ? "#c8f135"
        : checked
          ? "#facc15"
          : "#6b6b6b";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5">
      <label className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#6b6b6b]">
        <ScanLine className="h-3.5 w-3.5" /> Enter or scan a ticket code
      </label>

      <div className="flex gap-2">
        <input
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setChecked(null);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="DVP-XXXX-XXXXXX"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-3 font-mono text-base tracking-[1.5px] text-white outline-none focus:border-white/25"
        />
        <button
          onClick={checked ? reset : check}
          disabled={busy || (!code && !checked)}
          className="rounded-lg px-4 text-sm font-semibold disabled:opacity-40"
          style={{ background: `${accent}22`, color: accent }}
        >
          {busy ? "…" : checked ? "Clear" : "Check"}
        </button>
      </div>

      {error && <p className="mt-3 text-[12.5px] text-[#f87171]">{error}</p>}

      {checked && (
        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: `${tone}44`, background: `${tone}0d` }}>
          {checked.found === false ? (
            <p className="text-sm" style={{ color: tone }}>No ticket with that code.</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {checked.status === "ISSUED" ? (
                  <CheckCircle2 className="h-5 w-5" style={{ color: tone }} />
                ) : checked.status === "EXPIRED" ? (
                  <Clock className="h-5 w-5" style={{ color: tone }} />
                ) : checked.status === "REVOKED" ? (
                  <Ban className="h-5 w-5" style={{ color: tone }} />
                ) : (
                  <XCircle className="h-5 w-5" style={{ color: tone }} />
                )}
                <span className="text-base font-bold text-white">{checked.recipientName}</span>
              </div>

              <p className="mt-1 text-[12.5px] text-[#a1a1a1]">
                {checked.perkTitle}
                {checked.sourceEvent ? ` · awarded at ${checked.sourceEvent}` : ""}
              </p>
              <p className="mt-0.5 text-[11.5px]" style={{ color: tone }}>
                {checked.status === "ISSUED"
                  ? `Valid until ${fmt(checked.expiresAt)}`
                  : checked.status === "REDEEMED"
                    ? `Already used${checked.redeemedAt ? ` on ${fmt(checked.redeemedAt)}` : ""}`
                    : checked.status === "EXPIRED"
                      ? `Expired ${fmt(checked.expiresAt)}`
                      : checked.revokeReason || "Revoked"}
              </p>

              {/* Check the name against ID before consuming it. */}
              {checked.status === "ISSUED" && (
                <button
                  onClick={redeem}
                  disabled={busy}
                  className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
                  style={{ background: accent, color: "#0a0a0a" }}
                >
                  {busy ? "…" : "Confirm and mark used"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111111] p-4">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-[#6b6b6b]">{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: accent ?? "#fff" }}>{value}</div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
