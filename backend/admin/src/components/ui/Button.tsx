import { ReactNode } from 'react'

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  outline: 'bg-transparent border border-white/10 hover:bg-white/5 text-white',
  ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  onClick,
  type = 'button',
}: {
  children: ReactNode
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  )
}
