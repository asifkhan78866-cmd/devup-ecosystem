"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Info } from "lucide-react";
import { workspaceApi } from "@/lib/api/workspace";

const input = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#e4e4e4] text-xs outline-none focus:border-[#c8f135]/40";
const label = "block text-[10px] text-[#6b6b6b] mb-1";

export default function SettingsPage() {
  const { code } = useParams<{ code: string }>();
  const [f, setF] = useState<any>({
    legalName: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
    logoUrl: "", signatoryName: "Faizan Sk", signatoryTitle: "Founder & CEO", signatureImageUrl: "",
    signatoryOrg: "DevUp Ecosystem",
    cosignatoryName: "", cosignatoryTitle: "", cosignatoryOrg: "", cosignatureImageUrl: "",
    primaryColor: "#c8f135",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!code) return;
    workspaceApi
      .branding(code)
      .then((b) => b && setF((prev: any) => ({ ...prev, ...b })))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const set = (k: string, v: string) => {
    setF({ ...f, [k]: v });
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await workspaceApi.saveBranding(code, {
        legalName: f.legalName, addressLine1: f.addressLine1, addressLine2: f.addressLine2 || undefined,
        city: f.city, state: f.state, pincode: f.pincode,
        logoUrl: f.logoUrl || undefined, signatoryName: f.signatoryName, signatoryTitle: f.signatoryTitle,
        signatureImageUrl: f.signatureImageUrl || undefined,
        signatoryOrg: f.signatoryOrg || undefined,
        // Sent as "" rather than undefined so clearing a co-signatory sticks.
        cosignatoryName: f.cosignatoryName ?? "",
        cosignatoryTitle: f.cosignatoryTitle ?? "",
        cosignatoryOrg: f.cosignatoryOrg ?? "",
        cosignatureImageUrl: f.cosignatureImageUrl || undefined,
        primaryColor: f.primaryColor,
      });
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const complete = f.legalName && f.addressLine1 && f.city && f.state && f.pincode && f.signatoryName && f.signatoryTitle;

  if (loading) return <div className="p-8 text-[#6b6b6b] text-sm">Loading…</div>;

  return (
    <div className="px-5 py-7 md:px-9 md:py-9 max-w-[760px] mx-auto">
      <header className="mb-6">
        <h1 className="text-white text-[26px] md:text-[30px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Settings</h1>
        <p className="text-[#8b8b8b] text-[13.5px] mt-1.5">Branding applied to every document this startup issues.</p>
      </header>

      <div className="mb-5 p-3 rounded-lg border border-white/10 bg-white/[0.02] flex gap-2.5">
        <Info className="w-4 h-4 text-[#8fb6ff] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#8b8b8b] leading-relaxed">
          Offer letters, certificates, LORs and ID cards all use these details on the shared DevUp template.
          Branding must be complete before any offer can be generated.
        </p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm">{error}</div>}
      {saved && <div className="mb-4 p-3 rounded-lg border text-sm" style={{ borderColor: "rgba(200,241,53,0.2)", background: "rgba(200,241,53,0.06)", color: "#c8f135" }}>Branding saved.</div>}

      <div className="space-y-4">
        <Section title="Legal entity">
          <div><label className={label}>Registered legal name *</label><input className={input} value={f.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
          <div><label className={label}>Address line 1 *</label><input className={input} value={f.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} /></div>
          <div><label className={label}>Address line 2</label><input className={input} value={f.addressLine2 ?? ""} onChange={(e) => set("addressLine2", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={label}>City *</label><input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className={label}>State *</label><input className={input} value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label className={label}>Pincode *</label><input className={input} value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></div>
          </div>
        </Section>

        <Section title="Signatory">
          <p className="text-[10px] text-[#6b6b6b] -mt-1">
            Appears above the signature line on every letter, certificate and offer.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Name *</label><input className={input} value={f.signatoryName} onChange={(e) => set("signatoryName", e.target.value)} /></div>
            <div><label className={label}>Designation *</label><input className={input} placeholder="Founder &amp; CEO" value={f.signatoryTitle} onChange={(e) => set("signatoryTitle", e.target.value)} /></div>
          </div>
          <div><label className={label}>Signs on behalf of</label><input className={input} placeholder="DevUp Ecosystem" value={f.signatoryOrg ?? ""} onChange={(e) => set("signatoryOrg", e.target.value)} /></div>
          <div><label className={label}>Signature image URL</label><input className={input} value={f.signatureImageUrl ?? ""} onChange={(e) => set("signatureImageUrl", e.target.value)} /></div>
        </Section>

        <Section title="Second signatory">
          <p className="text-[10px] text-[#6b6b6b] -mt-1">
            Optional. Ecosystem partners are independent companies, so their own executive
            countersigns alongside DevUp. Leave blank for a single signature.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Name</label><input className={input} placeholder="Avinash Tilekar" value={f.cosignatoryName ?? ""} onChange={(e) => set("cosignatoryName", e.target.value)} /></div>
            <div><label className={label}>Designation</label><input className={input} placeholder="CEO" value={f.cosignatoryTitle ?? ""} onChange={(e) => set("cosignatoryTitle", e.target.value)} /></div>
          </div>
          <div><label className={label}>Signs on behalf of</label><input className={input} placeholder={f.legalName || "Company name"} value={f.cosignatoryOrg ?? ""} onChange={(e) => set("cosignatoryOrg", e.target.value)} /></div>
          <div><label className={label}>Signature image URL</label><input className={input} value={f.cosignatureImageUrl ?? ""} onChange={(e) => set("cosignatureImageUrl", e.target.value)} /></div>
        </Section>

        <Section title="Appearance">
          <div><label className={label}>Logo URL</label><input className={input} value={f.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} /></div>
          <div>
            <label className={label}>Accent colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={f.primaryColor ?? "#c8f135"} onChange={(e) => set("primaryColor", e.target.value)} className="w-10 h-9 rounded bg-transparent border border-white/10 cursor-pointer" />
              <input className={input} value={f.primaryColor ?? ""} onChange={(e) => set("primaryColor", e.target.value)} />
            </div>
          </div>
        </Section>

        <button
          onClick={save}
          disabled={busy || !complete}
          className="px-5 py-2.5 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(200,241,53,0.15)", color: "#c8f135" }}
        >
          {busy ? "Saving…" : "Save branding"}
        </button>
        {!complete && <p className="text-[10px] text-[#6b6b6b]">Fill every required field before saving.</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06] space-y-3">
      <h2 className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{title}</h2>
      {children}
    </section>
  );
}
