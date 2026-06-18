"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Check } from "lucide-react";

interface SignatureModalProps {
  documentName: string;
  onClose: () => void;
  onSign: (signatureDataUrl: string) => Promise<void>;
}

export function SignatureModal({ documentName, onClose, onSign }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSign = async () => {
    if (sigCanvas.current?.isEmpty()) {
      setError("Please provide a signature.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
      if (dataUrl) {
        await onSign(dataUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl text-white font-bold" style={{ fontFamily: "var(--font-syne)" }}>E-Sign Document</h2>
            <p className="text-[#a1a1a1] text-sm mt-1" style={{ fontFamily: "var(--font-inter)" }}>{documentName}</p>
          </div>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white transition-colors" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl overflow-hidden border border-white/20 mb-4">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: "w-full h-48 cursor-crosshair" }}
          />
        </div>

        <div className="flex justify-between items-center">
          <button 
            onClick={handleClear}
            className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
            disabled={loading}
          >
            Clear Canvas
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSign}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#c8f135] text-black rounded-lg hover:bg-[#b0d829] transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Signing..." : <><Check className="w-4 h-4" /> Sign Document</>}
            </button>
          </div>
        </div>
        
        <p className="text-xs text-[#6b6b6b] mt-6 text-center" style={{ fontFamily: "var(--font-inter)" }}>
          By clicking "Sign Document", you agree that this signature is legally binding and equivalent to your handwritten signature.
        </p>
      </div>
    </div>
  );
}
