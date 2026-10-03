import React from 'react'
import type { Poi, Profile, Route } from '../types'
import { formatDistance, formatEta } from '../utils/geo'

interface RoutePanelProps {
  isOpen: boolean
  onClose: () => void
  pois: Poi[]
  origin: Poi | null
  destination: Poi | null
  onSelectOrigin: (poi: Poi | null) => void
  onSelectDestination: (poi: Poi | null) => void
  onSwapPoints: () => void
  profile: Profile
  onSelectProfile: (profile: Profile) => void
  route: Route | null
  onClearRoute: () => void
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  isOpen,
  onClose,
  pois,
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwapPoints,
  profile,
  onSelectProfile,
  route,
  onClearRoute,
}) => {
  if (!isOpen) return null

  return (
    <section id="panel" className="route-panel-mode" aria-label="Directions">
      <div className="panel-head">
        <div className="cat-tag">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="2 7 14 1 8 13 7 8 2 7" />
          </svg>
          <span>Directions</span>
        </div>
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close directions">
          &times;
        </button>
      </div>

      <div className="panel-body">
        {/* Profile Switcher */}
        <div className="profile-switch">
          <button
            type="button"
            className={`prof-btn ${profile === 'foot' ? 'active' : ''}`}
            onClick={() => onSelectProfile('foot')}
          >
            🚶 Foot
          </button>
          <button
            type="button"
            className={`prof-btn ${profile === 'bike' ? 'active' : ''}`}
            onClick={() => onSelectProfile('bike')}
          >
            🚲 Cycle
          </button>
        </div>

        {/* Inputs */}
        <div className="route-inputs">
          <div className="route-input-row">
            <span className="dot dot-from" />
            <select
              value={origin?.id || ''}
              onChange={(e) => {
                const found = pois.find((p) => p.id === e.target.value) || null
                onSelectOrigin(found)
              }}
            >
              <option value="">Choose origin…</option>
              {pois.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button className="swap-btn" type="button" onClick={onSwapPoints} title="Swap start & destination">
            ⇅
          </button>

          <div className="route-input-row">
            <span className="dot dot-to" />
            <select
              value={destination?.id || ''}
              onChange={(e) => {
                const found = pois.find((p) => p.id === e.target.value) || null
                onSelectDestination(found)
              }}
            >
              <option value="">Choose destination…</option>
              {pois.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculation Result */}
        {route ? (
          <div className="route-stat-box">
            <div className="route-stat-main">
              <span className="eta">{formatEta(route.seconds)}</span>
              <span className="dist">{formatDistance(route.metres)}</span>
            </div>
            <div className="route-stat-foot">
              <span>{profile === 'foot' ? 'Walking path' : 'Cycling route'}</span>
              {route.steps && <span className="warning">· steps</span>}
            </div>
          </div>
        ) : origin && destination ? (
          <div className="route-prompt">Calculating path…</div>
        ) : (
          <div className="route-prompt">Select an origin and destination to compute the fastest route.</div>
        )}
      </div>

      {route && (
        <div className="panel-foot">
          <button className="btn-secondary full-width" type="button" onClick={onClearRoute}>
            Clear route
          </button>
        </div>
      )}
    </section>
  )
}
