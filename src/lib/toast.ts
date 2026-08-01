import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

let toastId = 0
let timeoutMap: Record<string, ReturnType<typeof setTimeout>> = {}

function notificationsEnabled(): boolean {
  try {
    return localStorage.getItem('quantos.settings.notifications') !== 'false'
  } catch {
    return true
  }
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    if (!notificationsEnabled()) return ''
    const id = `toast-${++toastId}`
    const duration = toast.duration ?? 3000

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }))

    timeoutMap[id] = setTimeout(() => {
      get().removeToast(id)
    }, duration)

    return id
  },
  removeToast: (id) => {
    if (timeoutMap[id]) {
      clearTimeout(timeoutMap[id])
      delete timeoutMap[id]
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  clearToasts: () => {
    Object.values(timeoutMap).forEach((t) => clearTimeout(t))
    timeoutMap = {}
    set({ toasts: [] })
  },
}))

export function toastSuccess(title: string, message?: string, duration: number = 3000) {
  return useToastStore.getState().addToast({ type: 'success', title, message, duration })
}

export function toastError(title: string, message?: string, duration: number = 5000) {
  return useToastStore.getState().addToast({ type: 'error', title, message, duration })
}

export function toastInfo(title: string, message?: string, duration: number = 3000) {
  return useToastStore.getState().addToast({ type: 'info', title, message, duration })
}

export function toastWarning(title: string, message?: string, duration: number = 4000) {
  return useToastStore.getState().addToast({ type: 'warning', title, message, duration })
}
