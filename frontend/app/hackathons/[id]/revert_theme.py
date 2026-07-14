import re

with open("/Users/syedasif/devup-ecosystem/frontend/app/hackathons/[id]/page.tsx", "r") as f:
    content = f.read()

# 1. Remove Starfield
content = content.replace('import { Starfield } from "./Starfield";\n', '')
content = content.replace('<Starfield />\n        ', '')
content = content.replace('<Starfield />', '')

# 2. Revert Backgrounds
content = content.replace('bg-gradient-to-b from-[#030514] via-[#05081c] to-[#01020a]', 'bg-[#0a0a0a]')
content = content.replace('bg-[#030514]', 'bg-[#0a0a0a]')
content = content.replace('bg-[#0A0F24]/50', 'bg-[#111]')
content = content.replace('bg-[#0A0F24]/60', 'bg-[#111]')
content = content.replace('bg-[#0A0F24]', 'bg-[#111]')
content = content.replace('bg-gradient-to-t from-[#01020a]', 'bg-gradient-to-t from-[#0a0a0a]')
content = content.replace('bg-gradient-to-br from-[#111827] to-[#0A0F24]', 'bg-[#111]')

# 3. Hero Title
content = re.sub(
    r'<h1\s+className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4"\s+style={{ fontFamily: "var\(--font-syne\), sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em" }}\s*>\s*DEVTHON 2026\s*</h1>',
    """<h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-syne), sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              {hackathon.title}
            </h1>""",
    content
)

# 4. Overview Eyebrow
content = re.sub(
    r'<h2 className="text-xs text-\[#c8f135\] uppercase tracking-\[0\.2em\] font-bold mb-2 text-center">\s*Mission Brief\s*</h2>\s*<h2 className="text-3xl font-bold text-white mb-8 text-center" style=\{\{ fontFamily: "var\(--font-syne\), sans-serif" \}\}>\s*Overview\s*</h2>',
    """<h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Overview
        </h2>""",
    content
)
# Revert Overview card style
content = content.replace('className="bg-[#111] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10"', 'className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8"')
content = content.replace('className="text-[#e4e4e4] text-lg leading-relaxed whitespace-pre-line text-center max-w-4xl mx-auto"', 'className="text-[#a1a1a1] leading-relaxed whitespace-pre-line" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}"')
content = content.replace('style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}"', 'style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "14px" }}')

# 5. Two Tracks styling
# We keep the copy but simplify the styling
content = content.replace('border border-white/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden group hover:border-white/20 transition-colors shadow-2xl', 'border border-white/5 rounded-2xl p-6 md:p-8 group hover:border-white/15 transition-colors')
content = content.replace('border border-white/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden group hover:border-[#c8f135]/30 transition-colors shadow-2xl', 'border border-white/5 rounded-2xl p-6 md:p-8 group hover:border-white/15 transition-colors')
content = re.sub(r'<div className="absolute top-0 right-0 w-64 h-64 bg-\[.*?\]/5 rounded-full blur-\[80px\] -mr-20 -mt-20 pointer-events-none" />\s*', '', content)
content = re.sub(r'<div className="absolute inset-0 bg-\[url\(\'/grid\.svg\'\)\] opacity-\[0\.03\] pointer-events-none mix-blend-overlay" />\s*', '', content)

content = re.sub(
    r'<h2 className="text-xs text-\[#c8f135\] uppercase tracking-\[0\.2em\] font-bold mb-2 text-center">\s*The Tracks\s*</h2>\s*<h2 className="text-3xl font-bold text-white text-center" style=\{\{ fontFamily: "var\(--font-syne\), sans-serif" \}\}>\s*Two Ways to Compete\s*</h2>',
    """<h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Two Ways to Compete
        </h2>""",
    content
)


# 6. Remove SVG divider
content = re.sub(r'<div className="w-full flex justify-center opacity-30 my-8">[\s\S]*?</svg>\s*</div>\s*', '', content)

# 7. Domains Eyebrow and Styling
domains_header = """<h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Core Technical Domains
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {domains.map((d, i) => (
            <motion.div
              key={`${d.label}-${i}`}
              whileHover={{ scale: 1.03, y: -2 }}
              className="bg-[#111] border border-white/5 rounded-xl p-4 group hover:border-white/15 transition-all"
            >
              <div
                className="w-2 h-2 rounded-full mb-3"
                style={{ background: d.color || DOMAIN_COLORS[i % DOMAIN_COLORS.length] }}
              />
              <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                {d.label}
              </h3>
              {d.sub && (
                <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  {d.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-6">
            <p className="text-xs text-[#6b6b6b] uppercase tracking-widest">+ 21 MORE DOMAINS ANNOUNCED SOON</p>
        </div>"""
content = re.sub(
    r'<h2 className="text-xs text-\[#c8f135\] uppercase tracking-\[0\.2em\] font-bold mb-2 text-center">\s*The Challenge\s*</h2>[\s\S]*?<div className="mt-8 text-center">\s*<p className="text-xs text-\[#6b6b6b\] uppercase tracking-widest">\+ 21 MORE DOMAINS ANNOUNCED SOON</p>\s*</div>',
    domains_header,
    content
)

# 8. Timeline Eyebrow and Styling
timeline_header = """<h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
          Event Timeline
        </h2>
        <div className="space-y-12">
          {timeline.map((day: TimelineDay) => (
            <div key={day.label}>
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="px-3 py-1 bg-[rgba(200,241,53,0.1)] border border-[rgba(200,241,53,0.25)] text-[#c8f135] rounded-full text-xs font-bold"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  {day.label}
                </span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  {day.subtitle}
                </span>
                <span className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                  — {day.date}
                </span>
              </div>

              <div className="relative pl-8 border-l border-white/10 space-y-0">
                {day.slots.map((slot, i) => (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="relative pb-6 group"
                  >
                    {/* Dot */}
                    <div className="absolute -left-[13px] top-1 w-[10px] h-[10px] rounded-full bg-[#0a0a0a] border-2 border-[#c8f135]/50 group-hover:border-[#c8f135] transition-colors" />

                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors ml-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{slot.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                              {slot.title}
                            </h4>
                            <span className="text-xs text-[#c8f135] font-mono flex-shrink-0 ml-3">{slot.time}</span>
                          </div>
                          <p className="text-xs text-[#6b6b6b]" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                            {slot.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>"""
content = re.sub(
    r'<h2 className="text-xs text-\[#c8f135\] uppercase tracking-\[0\.2em\] font-bold mb-2 text-center">\s*Mission Log\s*</h2>[\s\S]*?<div className="space-y-16 max-w-4xl mx-auto relative before:absolute[\s\S]*?</motion\.div>\s*\)\)\}\s*</div>\s*</div>\s*\)\)\}\s*</div>',
    timeline_header,
    content
)


with open("/Users/syedasif/devup-ecosystem/frontend/app/hackathons/[id]/page.tsx", "w") as f:
    f.write(content)
