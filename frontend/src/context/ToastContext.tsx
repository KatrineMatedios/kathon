import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, type }])
    window.setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  const value = useMemo<ToastContextValue>(() => ({
    toast,
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'error'),
  }), [toast])

  const styles: Record<ToastType, string> = {
    success: 'border-sage/60 bg-[#f1faf3] text-[#2f6d42]',
    error: 'border-blush/60 bg-[#fff2f0] text-[#a4483f]',
    info: 'border-brown-light bg-[#fffaf2] text-brown',
  }

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles[item.type]}`}
          >
            <span className="mt-0.5">{icons[item.type]}</span>
            <span className="flex-1 leading-snug">{item.message}</span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
