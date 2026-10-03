import React from 'react'
import type { CategoryKey } from '../types'
import { CATEGORIES } from '../data/dataProcessor'

interface LayerToggleProps {
  activeCategory: CategoryKey | 'all'
  onSelectCategory: (cat: CategoryKey | 'all') => void
  totalPois: number
}

export const LayerToggle: React.FC<LayerToggleProps> = ({
  activeCategory,
  onSelectCategory,
  totalPois: _totalPois,
}) => {
  return (
    <div id="dock">
      <nav id="layers" aria-label="Campus Layers">
        <div id="layer-chips">
          {Object.entries(CATEGORIES)
            .filter(([key]) => key !== 'other')
            .map(([key, cat]) => {
              const isSelected = activeCategory === key
              return (
                <button
                  key={key}
                  type="button"
                  className={`chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectCategory(isSelected ? 'all' : (key as CategoryKey))}
                  aria-pressed={isSelected}
                  title={`Filter by ${cat.label}`}
                >
                  <span className="dot" style={{ backgroundColor: cat.color }} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
        </div>
      </nav>

      <footer id="foot">
        <a
          href="https://www.youtube.com/watch?v=xvFZjo5PgG0"
          target="_blank"
          rel="noopener noreferrer"
          className="foot-btn"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          <span>github.com</span>
        </a>
        <span className="foot-btn by">btw tokens khatam will fix bugs v0.1</span>
      </footer>
    </div>
  )
}
