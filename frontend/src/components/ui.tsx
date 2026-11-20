import { ChevronLeft, ChevronRight, LoaderCircle, SearchX, X } from 'lucide-react'
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import type { ItemStatus, PaginationMeta } from '../types'
import { cn, statusLabel } from '../utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props },
  ref,
) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    ghost: 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-brown transition hover:bg-brown-light/50',
  }
  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: '!px-3 !py-2 !text-xs',
    md: '',
    lg: '!px-6 !py-3.5 !text-base',
  }

  return (
    <button
      ref={ref}
      className={cn(variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  )
})

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('app-card', className)}>{children}</section>
}

export function Field({ label, hint, children, className }: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn('field-input', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field-input min-h-28 resize-y', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn('field-input appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
})

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const positive = ['approved', 'returned', 'resolved'].includes(status)
  const negative = ['rejected'].includes(status)
  const className = positive
    ? 'bg-sage/20 text-[#2f6d42]'
    : negative
      ? 'bg-blush/20 text-[#a4483f]'
      : 'bg-[#f2dfbd] text-[#8a5a1f]'

  return (
    <span className={cn('chip', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', positive ? 'bg-sage' : negative ? 'bg-blush' : 'bg-[#d69b43]')} />
      {statusLabel(status)}
    </span>
  )
}

export function TypeBadge({ type }: { type: 'lost' | 'found' }) {
  return (
    <span className={cn('chip', type === 'lost' ? 'bg-blush/20 text-[#a4483f]' : 'bg-sage/20 text-[#2f6d42]')}>
      {type === 'lost' ? 'Lost' : 'Found'}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('mx-auto animate-spin text-brown', className)} size={28} />
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-sm text-muted">
      <Spinner />
      {label}
    </div>
  )
}

export function EmptyState({ title, description, action }: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#dfcdb6] bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-light/60 text-brown">
        <SearchX size={24} />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, back }: {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-extrabold tracking-tight text-brown">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-extrabold text-ink">{title}</h2>
      {action}
    </div>
  )
}

export function Modal({ open, title, onClose, children }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-brown">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-cream" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Pagination({ meta, onPage }: {
  meta?: PaginationMeta
  onPage: (page: number) => void
}) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
      >
        <ChevronLeft size={15} /> Prev
      </Button>
      <span className="px-2 text-xs font-semibold text-muted">
        {meta.current_page} / {meta.last_page}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        Next <ChevronRight size={15} />
      </Button>
    </div>
  )
}

export function ItemIllustration({ type = 'found', className }: {
  type?: 'lost' | 'found'
  className?: string
}) {
  const accent = type === 'lost' ? '#E99B91' : '#79B68A'
  return (
    <svg viewBox="0 0 200 160" className={cn('h-full w-full', className)} role="img" aria-label={`${type} item illustration`}>
      <rect x="24" y="28" width="120" height="92" rx="18" fill="#F3E6D2" />
      <rect x="38" y="44" width="92" height="60" rx="10" fill="#FFFFFF" />
      <path d="M54 90l22-24 16 16 12-12 18 20z" fill={accent} opacity="0.65" />
      <circle cx="64" cy="61" r="8" fill="#E9D2B2" />
      <circle cx="128" cy="86" r="31" fill="none" stroke="#60351F" strokeWidth="7" />
      <path d="M151 109l22 22" stroke="#60351F" strokeWidth="9" strokeLinecap="round" />
      <path d="M118 86l7 7 14-15" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ItemImage({ src, type, className, alt }: {
  src: string | null | undefined
  type?: 'lost' | 'found'
  className?: string
  alt: string
}) {
  if (!src) {
    return (
      <div className={cn('flex items-center justify-center overflow-hidden bg-[#f7ecdd]', className)}>
        <ItemIllustration type={type} className="h-4/5 w-4/5" />
      </div>
    )
  }

  return <img src={src} alt={alt} className={cn('object-cover', className)} loading="lazy" />
}
