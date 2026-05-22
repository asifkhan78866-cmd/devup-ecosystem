import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Briefcase,
  Trophy,
  Shield,
  Handshake,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: FileText, label: 'Applications' },
  { to: '/startups', icon: Building2, label: 'Startups' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/hackathons', icon: Trophy, label: 'Hackathons' },
  { to: '/documents', icon: Shield, label: 'Documents' },
  { to: '/cofounders', icon: Handshake, label: 'Co-Founders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-60 h-screen bg-[#080808] border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2">
        <span className="text-xl font-bold text-white tracking-tight">DevUp</span>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email || 'admin'}</p>
            <p className="text-[10px] text-gray-500">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
