import React from 'react'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenSearch: () => void
  onToggleRouting: () => void
  isRoutingOpen: boolean
  onResetView: () => void
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenSearch,
  onToggleRouting,
  isRoutingOpen,
  onResetView,
}) => {
  return (
    <header id="bar">
      {/* Brand Identity */}
      <button id="brand-btn" type="button" onClick={onResetView} title="Reset view to GNDU campus">
        gndu<span>.maps</span>
      </button>

      {/* Main Command Search Input Trigger */}
      <button id="open-search" type="button" onClick={onOpenSearch} aria-label="Search campus (⌘K or /)">
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10.5 10.5 L14.2 14.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="ph">Search places, departments, facilities…</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Actions */}
      <div className="header-actions">
        <button
          id="route-toggle-btn"
          className={isRoutingOpen ? 'active' : ''}
          type="button"
          onClick={onToggleRouting}
          title={isRoutingOpen ? 'Close directions' : 'Get directions'}
          aria-label="Directions"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7">
            <polygon points="2 7 14 1 8 13 7 8 2 7" strokeLinejoin="round" />
          </svg>
          <span className="hide-mobile">Route</span>
        </button>

        <button
          id="theme-btn"
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
