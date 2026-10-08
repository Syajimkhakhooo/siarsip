import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// Shared UI Components for SIARSIP - BMU Digital Archive
// Clean, monochrome design system

// ============================================
// BUTTON
// ============================================
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-900',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 focus-visible:ring-gray-300',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    outline: 'border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus-visible:ring-gray-900',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md h-7',
    md: 'px-4 py-2 text-sm rounded-lg h-9',
    lg: 'px-5 py-2.5 text-sm rounded-lg h-10',
    icon: 'w-8 h-8 rounded-lg p-0',
    'icon-sm': 'w-7 h-7 rounded-md p-0',
    'icon-lg': 'w-10 h-10 rounded-lg p-0',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}

// ============================================
// INPUT
// ============================================
export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`
            w-full h-9 rounded-lg border border-gray-200 bg-white text-sm text-gray-900
            placeholder:text-gray-400 transition-colors duration-150
            hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-9' : 'pl-3'}
            ${rightIcon ? 'pr-9' : 'pr-3'}
            ${error ? 'border-red-400 focus:ring-red-500' : ''}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// ============================================
// TEXTAREA
// ============================================
export function Textarea({ label, error, hint, id, className = '', rows = 3, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`
          w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900
          placeholder:text-gray-400 transition-colors duration-150 resize-none
          hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400 focus:ring-red-500' : ''}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// ============================================
// SELECT
// ============================================
export function Select({ label, error, hint, id, className = '', children, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`
          w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900
          transition-colors duration-150 cursor-pointer appearance-none
          hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400 focus:ring-red-500' : ''}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '32px',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// ============================================
// SEARCHABLE / CUSTOM SELECT
// ============================================
export function SearchableSelect({
  label,
  error,
  hint,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  className = '',
  searchPlaceholder = 'Cari...',
  clearable = false,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedOption = options.find(o => String(o.value) === String(value))

  const filteredOptions = options.filter(o => {
    const s = search.toLowerCase()
    return (
      o.label?.toLowerCase().includes(s) ||
      o.name?.toLowerCase().includes(s) ||
      o.code?.toLowerCase().includes(s) ||
      o.type?.toLowerCase().includes(s)
    )
  })

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch('') }}
        className={`
          w-full h-9 rounded-lg border bg-white px-3 text-sm text-left flex items-center justify-between gap-2
          transition-colors duration-150 cursor-pointer
          ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium truncate' : 'text-gray-400 truncate'}>
          {selectedOption ? (selectedOption.label || selectedOption.name) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && (
            <span
              role="button"
              tabIndex={-1}
              onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Floating Menu */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-scale-in"
        >
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 px-2.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto p-1 divide-y divide-gray-50">
            {/* Placeholder/clear option */}
            {value && (
              <div
                onClick={() => { onChange(''); setOpen(false) }}
                className="px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-2 text-gray-400 hover:bg-gray-50 italic transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                {placeholder}
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                Tidak ada opsi yang cocok
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={`
                      px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors
                      ${isSelected ? 'bg-gray-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.code && (
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {opt.code}
                        </span>
                      )}
                      <span className="truncate">{opt.name || opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {opt.type && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${isSelected ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                          {opt.type}
                        </span>
                      )}
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// ============================================
// BADGE
// ============================================
export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    dark: 'bg-gray-900 text-white',
    outline: 'border border-gray-200 text-gray-700',
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-md whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

// ============================================
// CARD
// ============================================
export function Card({ children, className = '', padding = true, hover = false, onClick, ...props }) {
  return (
    <div
      className={`
        bg-white border border-gray-100 rounded-xl
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:border-gray-200 hover:shadow-sm transition-all duration-150 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// MODAL
// ============================================
export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Modal Card */}
        <div
          className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl animate-scale-in text-left flex flex-col max-h-[calc(100vh-3.5rem)] overflow-hidden z-10`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Tutup modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body with scrolling */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode
}

// ============================================
// CONFIRM DIALOG
// ============================================
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Hapus', variant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  )
}

// ============================================
// TABLE
// ============================================
export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead>
      <tr className="border-b border-gray-100">
        {children}
      </tr>
    </thead>
  )
}

export function Th({ children, className = '', align = 'left' }) {
  return (
    <th className={`py-3 px-4 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>
}

export function Tr({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-100 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className = '', align = 'left' }) {
  return (
    <td className={`py-3 px-4 text-${align} text-gray-900 ${className}`}>
      {children}
    </td>
  )
}

// ============================================
// EMPTY STATE
// ============================================
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ============================================
// LOADING SKELETON
// ============================================
export function Skeleton({ className = '', variant = 'rectangle' }) {
  const base = 'animate-pulse bg-gray-100 rounded'
  const variants = {
    rectangle: '',
    circle: 'rounded-full',
    text: 'h-3',
  }
  return <div className={`${base} ${variants[variant]} ${className}`} />
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-4 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-3 ${j === 0 ? 'w-40' : j === cols - 1 ? 'w-16' : 'w-24'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// PROGRESS BAR
// ============================================
export function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className={`w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ============================================
// AVATAR
// ============================================
export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  }

  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gray-900 text-white flex items-center justify-center font-medium flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}

// ============================================
// DIVIDER
// ============================================
export function Divider({ className = '' }) {
  return <div className={`border-t border-gray-100 ${className}`} />
}

// ============================================
// STAT CARD
// ============================================
export function StatCard({ label, value, icon, trend, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================
// SECTION HEADER
// ============================================
export function SectionHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ============================================
// PAGE HEADER
// ============================================
export function PageHeader({ title, description, action, breadcrumb, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumb && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-gray-700' : 'hover:text-gray-600 cursor-pointer'}>
                {item}
              </span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}

// ============================================
// SEARCH INPUT
// ============================================
export function SearchInput({ value, onChange, placeholder = 'Cari...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  )
}

// ============================================
// TABS
// ============================================
export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 border-b border-gray-100 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px whitespace-nowrap
            ${activeTab === tab.id
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================
// DROPDOWN MENU
// ============================================
export function DropdownMenu({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>
      {open && (
        <div
          className={`
            absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50
            w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-slide-down
          `}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="border-t border-gray-100 my-1" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                disabled={item.disabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// FILTER BAR
// ============================================
export function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}

// ============================================
// EXPIRY STATUS BADGE
// ============================================
export function ExpiryBadge({ validUntil }) {
  if (!validUntil) return <Badge variant="default">Tidak Ada</Badge>

  const days = Math.floor((new Date(validUntil) - new Date()) / 86400000)

  if (days < 0) return <Badge variant="danger">Kedaluwarsa</Badge>
  if (days <= 30) return <Badge variant="danger">{days}h lagi</Badge>
  if (days <= 90) return <Badge variant="warning">{days}h lagi</Badge>
  return <Badge variant="success">Aktif</Badge>
}

// ============================================
// PAGINATION
// ============================================
export function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-gray-100 text-xs text-gray-500">
      <span>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} dari {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const p = page <= 3 ? i + 1 : page + i - 2
          if (p > totalPages) return null
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${p === page ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
            >
              {p}
            </button>
          )
        })}
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ============================================
// DATE PICKER (Custom, non-native)
// ============================================
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export function DatePicker({ label, value, onChange, error, hint, className = '', placeholder = 'Pilih tanggal...' }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef(null)

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const parsed = value ? new Date(value) : null
  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2,'0')} ${MONTHS_ID[parsed.getMonth()]} ${parsed.getFullYear()}`
    : null

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function selectDay(d) {
    const m = String(viewMonth + 1).padStart(2, '0')
    const day = String(d).padStart(2, '0')
    onChange(`${viewYear}-${m}-${day}`)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={ref}>
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full h-9 rounded-lg border bg-white px-3 text-sm text-left flex items-center justify-between gap-2
          transition-colors duration-150 cursor-pointer
          ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900'}
        `}
      >
        <span className={displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                title="Tahun sebelumnya"
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs font-bold transition-colors"
              >
                «
              </button>
              <button
                type="button"
                onClick={prevMonth}
                title="Bulan sebelumnya"
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-sm font-semibold transition-colors"
              >
                ‹
              </button>
            </div>
            <span className="text-xs font-semibold text-gray-900 select-none tracking-tight">
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={nextMonth}
                title="Bulan berikutnya"
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-gray-800 text-sm font-semibold transition-colors"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setViewYear(y => y + 1)}
                title="Tahun berikutnya"
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs font-bold transition-colors"
              >
                »
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />
              const cellStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const isSelected = cellStr === value
              const isToday = cellStr === todayStr
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`
                    w-full aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center
                    ${isSelected ? 'bg-gray-900 text-white' : isToday ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-300' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  {d}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <button
            type="button"
            onClick={() => { onChange(todayStr); setOpen(false) }}
            className="mt-2 w-full text-xs text-gray-500 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Hari ini
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
