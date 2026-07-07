import Link from "next/link";
import { seoConfig } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[#0a0a0a] py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <h3 className="font-heading text-2xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-syne)" }}>
              Dev<span style={{ color: "var(--accent-primary)" }}>Up</span>
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-4" style={{ fontFamily: "var(--font-inter)" }}>
              The premier ecosystem for student founders. Build, scale, and get funded.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><Link href="/ecosystem" className="hover:text-white transition-colors">Startups</Link></li>
              <li><Link href="/cofounders" className="hover:text-white transition-colors">Find a Co-Founder</Link></li>
              <li><Link href="/hackathons" className="hover:text-white transition-colors">Hackathons</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><Link href="/build-with-devup" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link href="/apply" className="hover:text-white transition-colors">Apply to Cohort</Link></li>
              {/* TODO: Add /blog and /faq routes when available */}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Connect</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href={seoConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href={seoConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href={seoConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              {/* TODO: Add Discord link when available */}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-sm text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} DevUp Ecosystem. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            {/* TODO: Create /privacy and /terms pages */}
            <span className="text-[var(--text-disabled)]">Privacy Policy</span>
            <span className="text-[var(--text-disabled)]">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

