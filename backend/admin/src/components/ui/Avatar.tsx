export function Avatar({
  src,
  fallback,
  size = 'md',
  className = '',
}: {
  src?: string | null
  fallback: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={fallback}
        className={`${sizes[size]} rounded-full object-cover bg-white/5 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white ${className}`}
    >
      {fallback.charAt(0).toUpperCase()}
    </div>
  )
}
