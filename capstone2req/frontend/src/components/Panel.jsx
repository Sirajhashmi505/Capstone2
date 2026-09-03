import React from 'react'

/** Flat bordered panel — square corners, no shadow, no gradient. */
export function Panel({ children, className = '', title, action }) {
  return (
    <section className={`bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 ${className}`}>
      {title && (
        <div className="panel-header">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Compact stat readout — numeric, no icon badge, border-left accent tick. */
export function StatTile({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-l-slate-400 dark:border-l-slate-600',
    accent: 'border-l-accent-500',
    good: 'border-l-emerald-600',
    warn: 'border-l-amber-500',
    bad: 'border-l-rose-600',
  }
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 border-l-4 ${toneClasses[tone]} px-4 py-3`}>
      <p className="label-caps mb-1">{label}</p>
      <p className="mono text-2xl font-semibold text-slate-900 dark:text-white leading-none">{value}</p>
    </div>
  )
}

/** Square-cornered tag / status chip. */
export function Tag({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-stone-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    good: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
    warn: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800',
    bad: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-800',
    accent: 'bg-accent-50 dark:bg-accent-950/40 text-accent-800 dark:text-accent-300 border-accent-300 dark:border-accent-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[11px] font-medium mono ${tones[tone]}`}>
      {children}
    </span>
  )
}

/** Square, border-driven button. Primary = solid accent, no shadow/lift/gradient. */
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false, className = '', type = 'button' }) {
  const variants = {
    primary: 'bg-accent-700 hover:bg-accent-800 text-white border border-accent-700 disabled:bg-accent-700/40',
    secondary: 'bg-transparent hover:bg-stone-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-400 dark:border-slate-600',
    ghost: 'bg-transparent hover:bg-stone-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-700',
  }
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`font-medium tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

/** Bare data grid — striped rows, uppercase headers, no card wrapper. */
export function DataTable({ columns, rows, rowKey, emptyLabel = 'No data' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300 dark:border-slate-700">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-2 px-3 label-caps">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-slate-200 dark:border-slate-800 ${i % 2 === 1 ? 'bg-stone-50 dark:bg-slate-900/60' : ''} hover:bg-accent-50 dark:hover:bg-slate-800/60`}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-3 align-top">
                  {col.render ? col.render(row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
