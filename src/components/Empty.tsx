import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyProps {
  children?: ReactNode
  className?: string
}

export default function Empty({ children, className }: EmptyProps) {
  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      {children ?? 'Empty'}
    </div>
  )
}
