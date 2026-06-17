import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: ModalAction[]
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  className?: string
}

const actionVariants: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-light text-primary hover:bg-light/80 border border-accent/30',
  danger: 'bg-danger text-white hover:bg-danger/90',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  closeOnOverlayClick = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col animate-slide-down',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-primary font-serif">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="关闭弹窗"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {actions.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  actionVariants[action.variant || 'primary'],
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
