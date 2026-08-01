import React from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, ToastType } from '../../lib/toast'
import type { Toast as ToastData } from '../../lib/toast'

const typeStyles: Record<ToastType, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertCircle,
    iconColor: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
  },
}

export function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const style = typeStyles[toast.type] || typeStyles.info
  const Icon = style.icon

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${style.bg} border ${style.border} rounded-lg p-4 shadow-lg backdrop-blur-sm animate-slide-up min-w-[300px] max-w-[420px]`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#A9A39A] mt-1 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 text-[#A9A39A] hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  )
}
