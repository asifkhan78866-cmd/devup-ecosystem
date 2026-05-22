import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function TopBar({ title }: { title: string }) {
  const { user } = useAuth()

  return (
    <header className="h-14 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-bold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-500 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
            3
          </span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
          {user?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  )
}
