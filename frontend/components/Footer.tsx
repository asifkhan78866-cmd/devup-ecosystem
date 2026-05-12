import Link from "next/link";
import { MessageCircle, Globe, Briefcase, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xl">
                D
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                DevUp
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              The premier ecosystem for the next generation of visionary founders
              and industry-defining startups.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                <Briefcase className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Ecosystem</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/ecosystem" className="text-white/60 hover:text-white text-sm transition-colors">
                  Directory
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-white/60 hover:text-white text-sm transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-white/60 hover:text-white text-sm transition-colors">
                  Events & Hackathons
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-white/60 hover:text-white text-sm transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/60 hover:text-white text-sm transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-white/60 hover:text-white text-sm transition-colors">
                  Startup Guides
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-white text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Stay Updated</h4>
            <p className="text-white/60 text-sm mb-4">
              Get the latest news and updates from the DevUp Ecosystem.
            </p>
            <form className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white text-black rounded-md hover:scale-105 transition-transform"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} DevUp Ecosystem. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-white/40 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-white/40 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
