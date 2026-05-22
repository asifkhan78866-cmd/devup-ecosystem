import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  )
}
