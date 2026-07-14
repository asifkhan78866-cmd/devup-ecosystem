import re

with open("/Users/syedasif/devup-ecosystem/frontend/app/hackathons/[id]/page.tsx", "r") as f:
    content = f.read()

# 1. Imports
if "import { Starfield }" not in content:
    content = content.replace('import StatusModal from "./StatusModal";', 'import StatusModal from "./StatusModal";\nimport { Starfield } from "./Starfield";')

# 2. DEFAULT_OVERVIEW
new_overview = """DEVTHON 2026 is Asia's Largest Open Innovation Hackathon, designed to bridge academia, industry, and the startup ecosystem.

This 36-hour non-stop marathon challenges you to push the boundaries of technology across 26+ critical domains. Whether you choose to solve one of our curated problem statements or bring your own disruptive idea, DEVTHON provides a world-class platform to validate your vision. 

Top performers not only walk away with a share of the ₹1,50,000+ prize pool but will also be fast-tracked for incubation support and seed funding up to ₹4 Cr."""
content = re.sub(
    r'const DEFAULT_OVERVIEW\s*=\s*".*?";',
    f'const DEFAULT_OVERVIEW = `{new_overview}`;',
    content,
    flags=re.DOTALL
)

# 3. Background updates
content = content.replace('bg-[#0a0a0a]', 'bg-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]')
# Fix specific single #0a0a0a that were inner containers
content = content.replace('group bg-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]', 'group bg-transparent')
content = content.replace('h-[clamp(46px,15vw,60px)] bg-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]', 'h-[clamp(46px,15vw,60px)] bg-[#030514]')
content = content.replace('rounded-full bg-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]', 'rounded-full bg-[#030514]')
content = content.replace('bg-gradient-to-t from-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]', 'bg-gradient-to-t from-[#01020a]')

# 4. Hero Title
content = re.sub(
    r'<h1[^>]*>[\s\S]*?\{hackathon\.title\}[\s\S]*?</h1>',
    """<h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4"
              style={{ fontFamily: "var(--font-syne), sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              DEVTHON 2026
            </h1>""",
    content
)

# Subtitle
content = re.sub(
    r'<p className="text-base md:text-lg text-\[#a1a1a1\] mb-8 max-w-2xl".*?\{subtitle\}[\s\S]*?</p>',
    """<p className="text-base md:text-lg text-[#a1a1a1] mb-8 max-w-2xl" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              Asia's Largest Open Innovation Hackathon. Solve our curated problem statements, or bring your own disruptive idea.
            </p>""",
    content
)

# 5. Core Domains Styling Update
domains_replacement = """        <h2 className="text-xs text-[#c8f135] uppercase tracking-[0.2em] font-bold mb-2 text-center">
          The Challenge
        </h2>
        <h2 className="text-3xl font-bold text-white mb-10 text-center" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Core Technical Domains
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {domains.map((d, i) => (
            <motion.div
              key={`${d.label}-${i}`}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden bg-[#0A0F24]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 group hover:border-[#c8f135]/50 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${d.color || DOMAIN_COLORS[i % DOMAIN_COLORS.length]}, transparent)` }}
              />
              <div
                className="w-10 h-10 rounded-full mb-4 flex items-center justify-center bg-white/5 border border-white/10"
              >
                <div className="w-3 h-3 rounded-full shadow-[0_0_12px_currentColor]" style={{ background: d.color || DOMAIN_COLORS[i % DOMAIN_COLORS.length], color: d.color || DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                {d.label}
              </h3>
              {d.sub && (
                <p className="text-xs text-[#888] leading-relaxed" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  {d.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center">
            <p className="text-xs text-[#6b6b6b] uppercase tracking-widest">+ 21 MORE DOMAINS ANNOUNCED SOON</p>
        </div>"""
content = re.sub(
    r'<h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var\(--font-syne\), sans-serif" }}>\s*Core Technical Domains\s*</h2>\s*<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">[\s\S]*?</motion\.div>\s*\)\)\}\s*</div>',
    domains_replacement,
    content
)


# 6. Timeline styling
timeline_replacement = """        <h2 className="text-xs text-[#c8f135] uppercase tracking-[0.2em] font-bold mb-2 text-center">
          Mission Log
        </h2>
        <h2 className="text-3xl font-bold text-white mb-12 text-center" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Event Timeline
        </h2>
        <div className="space-y-16 max-w-4xl mx-auto relative before:absolute before:inset-0 before:ml-[28px] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-[#c8f135]/30 before:to-transparent">
          {timeline.map((day: TimelineDay, dayIndex: number) => (
            <div key={day.label} className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-10 text-center">
                <div className="w-full md:w-1/2 flex justify-end md:pr-12">
                   <span className="px-4 py-1.5 bg-[#111827] border border-[#374151] text-white rounded-full text-sm font-bold tracking-[0.1em] shadow-[0_0_15px_rgba(200,241,53,0.1)]">
                     {day.label} — {day.date}
                   </span>
                </div>
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#c8f135] shadow-[0_0_15px_#c8f135]" />
                <div className="w-full md:w-1/2 flex justify-start md:pl-12">
                   <span className="text-lg text-[#a1a1a1]" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                     {day.subtitle}
                   </span>
                </div>
              </div>

              <div className="space-y-6">
                {day.slots.map((slot, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex flex-col md:flex-row items-center justify-between group ${isLeft ? "md:flex-row-reverse" : ""}`}
                  >
                    <div className="w-full md:w-5/12 hidden md:block" />
                    
                    {/* Constellation Node */}
                    <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 w-[11px] h-[11px] rounded-full bg-[#030514] border-2 border-[#c8f135]/50 group-hover:border-[#c8f135] group-hover:scale-150 transition-all z-10 shadow-[0_0_10px_rgba(200,241,53,0.3)]" />
                    
                    {/* Horizontal Connector Line on Desktop */}
                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-[8%] h-[1px] bg-dashed border-t border-white/20 ${isLeft ? 'right-[50%] mr-3' : 'left-[50%] ml-3'}`} />

                    <div className={`w-full md:w-5/12 pl-16 md:pl-0 ${isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                      <div className="bg-[#0A0F24]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-[#c8f135]/40 transition-colors shadow-lg">
                        <div className={`flex items-start gap-4 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                            {slot.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-white mb-1 tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                              {slot.title}
                            </h4>
                            <div className={`text-xs text-[#c8f135] font-mono mb-2 ${isLeft ? 'md:justify-end' : ''} flex`}>{slot.time}</div>
                            <p className="text-sm text-[#888] leading-relaxed" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                              {slot.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            </div>
          ))}
        </div>"""
content = re.sub(
    r'<h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "var\(--font-syne\), sans-serif" }}>\s*Event Timeline\s*</h2>[\s\S]*?<div className="relative pl-8 border-l border-white/10 space-y-0">[\s\S]*?</div>\s*</div>\s*\)\)\}\s*</div>',
    timeline_replacement,
    content
)

# 7. Add Two Ways To Compete right before Overview
overview_index = content.find('{/* ─── OVERVIEW ─── */}')
two_ways_section = """      {/* ─── TWO WAYS TO COMPETE ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 md:px-8 mt-16 relative"
      >
        <Starfield />
        
        <div className="relative z-10 mb-12">
          <h2 className="text-xs text-[#c8f135] uppercase tracking-[0.2em] font-bold mb-2 text-center">
            The Tracks
          </h2>
          <h2 className="text-3xl font-bold text-white text-center" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Two Ways to Compete
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-gradient-to-br from-[#111827] to-[#0A0F24] border border-white/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden group hover:border-white/20 transition-colors shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c8f135]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">
              🎯
            </div>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Track 1: Open Innovation</h3>
            <p className="text-[#a1a1a1] leading-relaxed mb-6" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              Solve high-impact problem statements released by our industry partners at the start of the event. Build targeted solutions for real-world enterprise challenges.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Problems revealed on Day 1</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Judged by industry veterans</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Direct hiring opportunities</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-[#111827] to-[#0A0F24] border border-white/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden group hover:border-[#c8f135]/30 transition-colors shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#38bdf8]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">
              🚀
            </div>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Track 2: Own Problem Statement</h3>
            <p className="text-[#a1a1a1] leading-relaxed mb-6" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              Have a disruptive idea? Pitch your own problem statement during Phase 1. If selected, you get to build your vision and compete for massive funding.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Pre-approval required (Phase 1)</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Pitch to angel investors</li>
              <li className="flex items-center gap-3 text-sm text-[#e4e4e4]"><div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" /> Up to ₹4 Cr seed funding</li>
            </ul>
          </div>
        </div>
      </motion.section>

"""
content = content[:overview_index] + two_ways_section + content[overview_index:]


# 8. Overview styling
content = re.sub(
    r'<h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var\(--font-syne\), sans-serif" }}>\s*Overview\s*</h2>',
    """<h2 className="text-xs text-[#c8f135] uppercase tracking-[0.2em] font-bold mb-2 text-center">
          Mission Brief
        </h2>
        <h2 className="text-3xl font-bold text-white mb-8 text-center" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Overview
        </h2>""",
    content
)

content = content.replace('className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8"', 'className="bg-[#0A0F24]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10"')
content = content.replace('text-[#a1a1a1] leading-relaxed whitespace-pre-line"', 'text-[#e4e4e4] text-lg leading-relaxed whitespace-pre-line text-center max-w-4xl mx-auto"')

# 9. Add subtle starfield to Hero
content = content.replace(
    'className="max-w-7xl mx-auto px-4 md:px-8 mt-6"',
    'className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative z-10"\n      >\n        <Starfield />'
)
# Fix the replace introducing duplicate tags if > is matched
# Wait, I used string replace, so `className="max-w-7xl mx-auto px-4 md:px-8 mt-6"` becomes `className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative z-10"\n      >\n        <Starfield />` which might leave an extra `>` if it was already closed.
# It is better to just replace `className="max-w-7xl mx-auto px-4 md:px-8 mt-6"` with `className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative"` and then add `<Starfield />` right after the opening div.

# Let's fix that.
content = content.replace(
    'className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative z-10"\n      >\n        <Starfield />',
    'className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative"'
)
content = content.replace(
    '<div className="bg-[#111111] border border-white/10 rounded-[24px]',
    '<Starfield />\n        <div className="bg-[#111111] border border-white/10 rounded-[24px]'
)


# Add the SVG rings divider above Core Domains
divider_svg = """      <div className="w-full flex justify-center opacity-30 my-8">
        <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="20" rx="90" ry="10" stroke="#c8f135" strokeWidth="0.5" strokeDasharray="4 4"/>
          <circle cx="100" cy="20" r="4" fill="#c8f135"/>
          <path d="M10 20 L40 20" stroke="#c8f135" strokeWidth="1" strokeOpacity="0.5"/>
          <path d="M160 20 L190 20" stroke="#c8f135" strokeWidth="1" strokeOpacity="0.5"/>
        </svg>
      </div>"""

content = content.replace(
    '{/* ─── DOMAINS ─── */}',
    f'{divider_svg}\n      {{/* ─── DOMAINS ─── */}}'
)

with open("/Users/syedasif/devup-ecosystem/frontend/app/hackathons/[id]/page.tsx", "w") as f:
    f.write(content)

