'use client'
import { motion } from 'framer-motion'

export default function AiAnalysisSection({ analysis }: { analysis: any }) {
  if (!analysis) return null

  const sections = [
    { label: 'Problem', value: analysis.problem },
    { label: 'Solution', value: analysis.solution },
    { label: 'Target Market', value: analysis.targetMarket },
    { label: 'Business Model', value: analysis.businessModel },
  ]

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'Inter', fontSize: 11, color: '#c8f135',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          ✦ AI Analysis
        </span>
        <span style={{
          fontFamily: 'Inter', fontSize: 10, color: '#3d3d3d',
        }}>
          Generated from public data
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16, marginBottom: 20,
      }}>
        {sections.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: 18,
            }}
          >
            <p style={{
              fontFamily: 'Inter', fontSize: 11, color: '#6b6b6b',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 8,
            }}>
              {s.label}
            </p>
            <p style={{
              fontFamily: 'Inter', fontSize: 14, color: '#e4e4e4',
              lineHeight: 1.6,
            }}>
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {analysis.tractionSignals?.length > 0 && (
        <SignalList title="Traction Signals" items={analysis.tractionSignals} color="#c8f135" />
      )}
      {analysis.fundingSignals?.length > 0 && (
        <SignalList title="Funding Signals" items={analysis.fundingSignals} color="#22c55e" />
      )}
      {analysis.teamHighlights?.length > 0 && (
        <SignalList title="Team Highlights" items={analysis.teamHighlights} color="#6366f1" />
      )}
    </div>
  )
}

function SignalList({ title, items, color }: { 
  title: string, items: string[], color: string 
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{
        fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
        color: '#a1a1a1', marginBottom: 8,
      }}>
        {title}
      </p>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: 8, marginBottom: 6,
        }}>
          <span style={{ color, fontSize: 12, marginTop: 1 }}>●</span>
          <span style={{
            fontFamily: 'Inter', fontSize: 13, color: '#a1a1a1',
            lineHeight: 1.5,
          }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  )
}
