const variants: Record<string, string> = {
  ADMIN: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  FOUNDER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  STUDENT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INVESTOR: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  REVIEWING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  SIGNED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INACTIVE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  ONLINE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  OFFLINE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  HYBRID: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const semanticVariants: Record<string, string> = {
  primary: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function Badge({
  children,
  label,
  variant,
}: {
  children?: string
  label?: string
  variant?: string
}) {
  const value = label || children || variant || ''
  const style = variants[value] || (variant ? semanticVariants[variant] : '') || semanticVariants.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {value || variant}
    </span>
  )
}
