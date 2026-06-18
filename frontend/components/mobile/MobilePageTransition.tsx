'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

export default function MobilePageTransition({ 
  children 
}: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  if (!isMobile) return <>{children}</>

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.16, 1, 0.3, 1] 
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
