import React from 'react'
import { NavLink } from 'react-router-dom'
import { Terminal, Moon, Sun } from 'lucide-react'

const tabs = [
  { path: '/', label: 'Overview' },
  { path: '/tagging', label: 'Tag' },
  { path: '/review', label: 'Review' },
  { path: '/search', label: 'Search' },
  { path: '/personas', label: 'Personas' },
  { path: '/metrics', label: 'Metrics' },
]

function TopNav({ darkMode, setDarkMode }) {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-300 dark:border-slate-700">
      <div className="max-w-[1400px] mx-auto flex items-center gap-6 px-4 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <Terminal className="w-4 h-4 text-accent-600 dark:text-accent-400" />
          <span className="font-semibold text-sm tracking-wide text-slate-900 dark:text-white">INSIGHT&nbsp;CONSOLE</span>
        </div>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.path === '/'}
              className={({ isActive }) =>
                `px-3 h-14 flex items-center text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {darkMode ? 'LIGHT' : 'DARK'}
        </button>
      </div>
    </header>
  )
}

export default TopNav
