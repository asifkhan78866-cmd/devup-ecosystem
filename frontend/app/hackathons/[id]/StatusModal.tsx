import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { getLeadToken, leadFetch, requestLeadAccessLink } from "@/lib/hackathonLead";

export default function StatusModal({
  isOpen,
  onClose,
  hackathonId,
}: {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
}) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  /**
   * A team's status is read with its private token — kept in this browser at
   * registration or arriving in the emailed link. A phone number alone no
   * longer opens a registration: it only asks for the link to be emailed to
   * the address on file.
   */
  const loadStatus = async () => {
    if (!getLeadToken(hackathonId)) return;
    setLoading(true);
    try {
      const res = await leadFetch(hackathonId);
      const data = await res.json();
      if (res.ok) setStatus(data.data);
    } catch {
      /* fall back to the "email my link" form */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setPhone("");
      setStatus(null);
      setError("");
      setFile(null);
      setLinkSent(false);
      loadStatus();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const requestLink = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await requestLeadAccessLink(hackathonId, phone);
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Too many attempts. Please wait and try again.");
      }
      // Same screen whatever the answer: the server never says whether a phone is registered.
      setLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be smaller than 10MB");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await leadFetch(hackathonId, "/submission", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Upload failed");

      // Refresh status
      await loadStatus();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[300] overflow-y-auto pointer-events-none"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl p-6 pointer-events-auto my-8">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Check Phase 1 Status
              </h2>
              <p className="text-sm text-[#6b6b6b] mb-6" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                {status
                  ? "Your team's registration."
                  : linkSent
                    ? "Check your inbox."
                    : "Enter the phone number you registered with and we'll email your team's private link to the address on file."}
              </p>

              {!status && linkSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#bbb]">
                    If that number is registered with an email address, a private link to your team&apos;s
                    registration is on its way there. Open it on this device to check your status or submit.
                  </p>
                  <p className="text-xs text-[#666]">
                    Registered without an email? Contact the organisers to update your registration.
                  </p>
                  <button onClick={onClose} className="w-full px-4 py-3 rounded-xl border border-white/10 text-[#888] text-sm font-medium hover:bg-white/5 transition-colors">
                    Close
                  </button>
                </div>
              ) : !status ? (
                <div className="space-y-4">
                  <div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#c8f135]/50 transition-colors placeholder:text-[#4a4a4a]"
                      placeholder="10-digit Indian phone number"
                      inputMode="numeric"
                    />
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[#888] text-sm font-medium hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={requestLink}
                      disabled={loading}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Email my link →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10 mb-2">
                    {status.submission?.status === "SELECTED" ? (
                      <span className="text-4xl">🏆</span>
                    ) : status.submission?.status === "REJECTED" ? (
                      <span className="text-4xl">❌</span>
                    ) : status.submission?.status === "PENDING" ? (
                      <span className="text-4xl">⏳</span>
                    ) : (
                      <span className="text-4xl">📄</span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white">Hi, {status.name}!</h3>
                  
                  {!status.submission ? (
                    <div className="mt-4 text-left">
                      <p className="text-sm text-[#888] mb-4 text-center">You haven't submitted your Phase 1 Pitch Deck yet.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.ppt,.pptx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#c8f135] file:text-black hover:file:bg-[#b0d829] transition-all cursor-pointer"
                          />
                          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                        </div>
                        
                        <button
                          onClick={handleUploadSubmit}
                          disabled={loading || !file}
                          className="w-full px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors disabled:opacity-50"
                        >
                          {loading ? "Uploading..." : "Submit Pitch Deck"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#888] mb-2">Your Phase 1 Status is:</p>
                      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                        status.submission.status === 'SELECTED' ? 'bg-[#c8f135]/20 text-[#c8f135] border border-[#c8f135]/50' :
                        status.submission.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      }`}>
                        {status.submission.status}
                      </span>
                    </div>
                  )}

                  {status.submission?.status === "SELECTED" && (
                    <div className="mt-6">
                      <a href={`/hackathons/${hackathonId}/phase2`} className="block w-full px-4 py-3 rounded-xl bg-[#c8f135] text-black text-sm font-bold hover:bg-[#b0d829] transition-colors">
                        Enter Phase 2 🚀
                      </a>
                    </div>
                  )}

                  <button onClick={onClose} className="mt-4 text-xs text-[#888] hover:text-white transition-colors">
                    Close
                  </button>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
