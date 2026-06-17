import { Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'

interface StartupAnalysis {
  oneLiner: string
  overview: string
  problem: string
  solution: string
  targetMarket: string
  businessModel: string
  tractionSignals: string[]
  fundingSignals: string[]
  teamHighlights: string[]
  redFlags: string[]
  confidence: 'high' | 'medium' | 'low'
  generatedAt: string
}

export function AiAnalysisSection({ analysis }: { analysis: StartupAnalysis | null }) {
  if (!analysis) return null

  return (
    <div style={{
      marginTop: 48,
      padding: 32,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effect */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(200,241,53,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 12, 
          background: 'rgba(200,241,53,0.1)', 
          border: '1px solid rgba(200,241,53,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles color="#c8f135" size={20} />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 20, color: '#fff', margin: 0 }}>
            AI Research Analysis
          </h3>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 12, color: '#a1a1a1', margin: '4px 0 0 0' }}>
            Generated {new Date(analysis.generatedAt).toLocaleDateString()}
          </p>
        </div>
        
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontFamily: 'var(--font-inter), sans-serif', fontSize: 12,
            padding: '4px 12px', borderRadius: 100,
            background: analysis.confidence === 'high' ? 'rgba(34,197,94,0.1)' 
              : analysis.confidence === 'medium' ? 'rgba(245,158,11,0.1)' 
              : 'rgba(239,68,68,0.1)',
            color: analysis.confidence === 'high' ? '#22c55e' 
              : analysis.confidence === 'medium' ? '#f59e0b' : '#ef4444',
            border: `1px solid ${
              analysis.confidence === 'high' ? 'rgba(34,197,94,0.2)' 
              : analysis.confidence === 'medium' ? 'rgba(245,158,11,0.2)' 
              : 'rgba(239,68,68,0.2)'
            }`
          }}>
            {analysis.confidence.charAt(0).toUpperCase() + analysis.confidence.slice(1)} Confidence
          </span>
        </div>
      </div>

      <div style={{ 
        fontFamily: 'var(--font-inter), sans-serif', fontSize: 16, 
        color: '#e4e4e4', lineHeight: 1.6, marginBottom: 32,
        fontWeight: 500
      }}>
        {analysis.oneLiner}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#0a0a0a', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
          <h4 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, color: '#fff', marginBottom: 12 }}>Problem</h4>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 14, color: '#a1a1a1', lineHeight: 1.6, margin: 0 }}>
            {analysis.problem}
          </p>
        </div>
        <div style={{ background: '#0a0a0a', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
          <h4 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, color: '#fff', marginBottom: 12 }}>Solution</h4>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 14, color: '#a1a1a1', lineHeight: 1.6, margin: 0 }}>
            {analysis.solution}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#c8f135" /> Positive Signals
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...analysis.tractionSignals, ...analysis.fundingSignals, ...analysis.teamHighlights].map((signal, i) => (
              <li key={i} style={{ 
                fontFamily: 'var(--font-inter), sans-serif', fontSize: 14, color: '#a1a1a1',
                display: 'flex', alignItems: 'flex-start', gap: 12
              }}>
                <span style={{ color: '#c8f135', marginTop: 2 }}>•</span> {signal}
              </li>
            ))}
          </ul>
        </div>

        {analysis.redFlags.length > 0 && (
          <div>
            <h4 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#f59e0b" /> Risk Factors
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.redFlags.map((flag, i) => (
                <li key={i} style={{ 
                  fontFamily: 'var(--font-inter), sans-serif', fontSize: 14, color: '#a1a1a1',
                  display: 'flex', alignItems: 'flex-start', gap: 12
                }}>
                  <span style={{ color: '#f59e0b', marginTop: 2 }}>•</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-inter), sans-serif', fontSize: 12, color: '#6b6b6b'
      }}>
        <ShieldAlert size={14} />
        This is an AI-generated synthesis based on public web data and may contain inaccuracies.
      </div>
    </div>
  )
}
