import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastState {
  toasts: ToastItem[]

  showToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

let toastIdCounter = 0

const generateToastId = () => {
  toastIdCounter += 1
  return `toast-${toastIdCounter}-${Date.now()}`
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (type, message, duration = 3000) => {
    const id = generateToastId()
    const toast: ToastItem = { id, type, message, duration }
    set({ toasts: [...get().toasts, toast] })

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().showToast('success', message, duration),
  error: (message: string, duration?: number) => useToastStore.getState().showToast('error', message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().showToast('warning', message, duration),
  info: (message: string, duration?: number) => useToastStore.getState().showToast('info', message, duration),
}
