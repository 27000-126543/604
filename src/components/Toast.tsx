import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, toast as toastStore, type ToastType } from '@/store/toast'
import { cn } from '@/lib/utils'

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 shrink-0" />,
  error: <XCircle className="w-5 h-5 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
  info: <Info className="w-5 h-5 shrink-0" />,
}

const toastStyles: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
}

export function useToast() {
  return {
    showToast: (message: string, type: ToastType = 'info', duration?: number) => {
      useToastStore.getState().showToast(type, message, duration)
    },
    success: (message: string, duration?: number) => {
      toastStore.success(message, duration)
    },
    error: (message: string, duration?: number) => {
      toastStore.error(message, duration)
    },
    warning: (message: string, duration?: number) => {
      toastStore.warning(message, duration)
    },
    info: (message: string, duration?: number) => {
      toastStore.info(message, duration)
    },
  }
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn('toast', toastStyles[toast.type])}
          role="alert"
        >
          {toastIcons[toast.type]}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="关闭通知"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
