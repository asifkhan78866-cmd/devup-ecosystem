"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { SignatureModal } from "@/components/SignatureModal";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      
      if (data.success && data.data?.startups?.[0]) {
        const startupId = data.data.startups[0].id;
        // In a real app, you'd have an endpoint like GET /api/startups/:id/documents
        // For now, let's assume we can fetch them or we just mock it if the endpoint doesn't exist yet
        // The instructions imply we should be able to get them. Let's create a generic fetch for now.
        const docRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startupId}/documents`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(docData.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents/${selectedDoc.id}/sign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ signatureDataUrl })
      });
      if (res.ok) {
        setSelectedDoc(null);
        fetchDocuments(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  if (loading) return <div className="p-8 text-white">Loading documents...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }} className="text-3xl text-white mb-2">Documents</h1>
        <p style={{ fontFamily: "var(--font-inter)" }} className="text-[#a1a1a1]">Review and sign important agreements.</p>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0a0a0a] border-b border-white/5 text-[#6b6b6b] text-sm uppercase" style={{ fontFamily: "var(--font-inter)" }}>
            <tr>
              <th className="px-6 py-4 font-medium">Document</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {documents.map((doc) => (
              <tr key={doc.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#c8f135]" />
                    </div>
                    <div>
                      <div className="text-white font-medium" style={{ fontFamily: "var(--font-inter)" }}>{doc.name}</div>
                      <div className="text-[#6b6b6b] text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                        Sent {new Date(doc.sentToStartupAt || doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs border rounded-full text-blue-400 bg-blue-400/10 border-blue-400/20" style={{ fontFamily: "var(--font-inter)" }}>
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {doc.status === 'SIGNED' || doc.signedByFounder ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-max">
                      <CheckCircle className="w-3.5 h-3.5" /> Signed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full w-max">
                      <Clock className="w-3.5 h-3.5" /> Pending Signature
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
                    >
                      View PDF
                    </a>
                    {doc.status !== 'SIGNED' && !doc.signedByFounder && (
                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="bg-[#c8f135] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#b0d829] transition-colors"
                      >
                        Sign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div className="p-8 text-center text-[#6b6b6b]">No documents require your attention right now.</div>
        )}
      </div>

      {selectedDoc && (
        <SignatureModal 
          documentName={selectedDoc.name}
          onClose={() => setSelectedDoc(null)}
          onSign={handleSign}
        />
      )}
    </div>
  );
}
