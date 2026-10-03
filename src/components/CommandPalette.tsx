import React, { useEffect, useRef, useState } from 'react'
import type { CategoryKey, Poi } from '../types'
import type { SearchEngine, SearchHit } from '../search/engine'
import { CATEGORIES } from '../data/dataProcessor'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  searchEngine: SearchEngine | null
  onSelectPoi: (poi: Poi) => void
  onRouteToPoi: (poi: Poi) => void
  onSelectCategory: (cat: CategoryKey | 'all') => void
  activeCategory: CategoryKey | 'all'
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  searchEngine,
  onSelectPoi,
  onRouteToPoi,
  onSelectCategory,
  activeCategory,
}) => {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchEngine) return
    let results = searchEngine.search(query)
    if (activeCategory !== 'all') {
      results = results.filter((h) => h.cat === activeCategory)
    }
    setHits(results)
    setSelectedIndex(0)
  }, [query, searchEngine, activeCategory])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault()
          onClose()
        } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault()
          onClose()
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (hits.length > 0 ? (prev + 1) % hits.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (hits.length > 0 ? (prev - 1 + hits.length) % hits.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = hits[selectedIndex]
        if (selected) {
          if (selected.poi) {
            onSelectPoi(selected.poi)
            onClose()
          } else if (selected.cat) {
            onSelectCategory(selected.cat)
            setQuery('')
          }
        }
      } else if (e.key === 'Tab') {
        const selected = hits[selectedIndex]
        if (selected?.poi) {
          e.preventDefault()
          onRouteToPoi(selected.poi)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hits, selectedIndex, onClose, onSelectPoi, onRouteToPoi, onSelectCategory])

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div id="palette" role="dialog" aria-modal="true" aria-label="Search campus" onClick={onClose}>
      <div id="palette-box" onClick={(e) => e.stopPropagation()}>
        {/* Input Row */}
        <div id="palette-input-row">
          <span id="palette-glyph" aria-hidden="true">›</span>
          <input
            ref={inputRef}
            id="palette-input"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="BGL · LTC · DSW · Admin · Library · Gurdwara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button id="palette-close" type="button" onClick={onClose} aria-label="Close search">
            &times;
          </button>
        </div>

        {/* Results List */}
        <div id="palette-results" role="listbox" ref={listRef}>
          {hits.length === 0 ? (
            <div className="palette-empty">No matching places or departments.</div>
          ) : (
            hits.map((hit, idx) => {
              const isSelected = idx === selectedIndex
              const catInfo = hit.cat ? CATEGORIES[hit.cat] : undefined

              return (
                <div
                  key={hit.id}
                  className={`palette-row ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (hit.poi) {
                      onSelectPoi(hit.poi)
                      onClose()
                    } else if (hit.cat) {
                      onSelectCategory(hit.cat)
                      setQuery('')
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-dot" style={{ backgroundColor: catInfo?.color || '#8ab4f8' }} />
                  <div className="palette-main">
                    <div className="palette-title-row">
                      <span className="title">{highlightText(hit.title, hit.marks)}</span>
                      {hit.poi?.namePa && <span className="punjabi-tag">{hit.poi.namePa}</span>}
                    </div>
                    <div className="sub">{hit.sub}</div>
                  </div>
                  {hit.poi && (
                    <kbd className="palette-tab-hint" title="Press Tab to route">tab</kbd>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <footer id="palette-foot">
          <span className="hint"><kbd>↑↓</kbd> move</span>
          <span className="hint"><kbd>↵</kbd> open</span>
          <span className="hint"><kbd>tab</kbd> route</span>
          <span className="hint"><kbd>esc</kbd> close</span>
          <span className="count">{hits.length} items</span>
        </footer>
      </div>
    </div>
  )
}

function highlightText(text: string, marks: number[]): React.ReactNode {
  if (!marks || marks.length === 0) return text
  const markSet = new Set(marks)
  const result: React.ReactNode[] = []
  let buffer = ''
  let isMarked = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const shouldMark = markSet.has(i)

    if (shouldMark !== isMarked) {
      if (buffer) {
        result.push(isMarked ? <mark key={i}>{buffer}</mark> : buffer)
        buffer = ''
      }
      isMarked = shouldMark
    }
    buffer += char
  }

  if (buffer) {
    result.push(isMarked ? <mark key="end">{buffer}</mark> : buffer)
  }

  return result
}
