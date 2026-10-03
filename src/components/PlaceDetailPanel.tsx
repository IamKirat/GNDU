import React from 'react'
import type { Poi } from '../types'
import { CATEGORIES } from '../data/dataProcessor'
import { parseOpeningHours } from '../search/hours'

interface PlaceDetailPanelProps {
  poi: Poi | null
  onClose: () => void
  onDirectionsTo: (poi: Poi) => void
  onDirectionsFrom: (poi: Poi) => void
  onCenterMap: (poi: Poi) => void
}

export const PlaceDetailPanel: React.FC<PlaceDetailPanelProps> = ({
  poi,
  onClose,
  onDirectionsTo,
  onDirectionsFrom,
  onCenterMap,
}) => {
  if (!poi) return null

  const catInfo = CATEGORIES[poi.cat] || CATEGORIES.other
  const openStatus = parseOpeningHours(poi.hours)

  return (
    <section id="panel" aria-label="Place details">
      {/* Header bar */}
      <div className="panel-head">
        <div className="cat-tag" style={{ color: catInfo.color }}>
          <span>{catInfo.icon}</span>
          <span>{catInfo.label}</span>
        </div>
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close details">
          &times;
        </button>
      </div>

      {/* Main Content Scroll */}
      <div className="panel-body">
        <div className="place-title-section">
          <h2 className="place-title">{poi.name}</h2>
          {poi.namePa && <div className="place-pa">{poi.namePa}</div>}
        </div>

        {/* Status badges */}
        <div className="place-badges">
          {openStatus && (
            <span className={`badge ${openStatus.open ? 'badge-open' : 'badge-closed'}`}>
              <span className="dot" />
              <span>{openStatus.label}</span>
            </span>
          )}

          {poi.wheelchair && (
            <span className="badge badge-subtle">
              ♿ Wheelchair Accessible
            </span>
          )}

          {poi.internet && (
            <span className="badge badge-subtle">
              📶 {poi.internet}
            </span>
          )}
        </div>

        {/* Metadata Details */}
        <div className="place-meta-list">
          {poi.aliases && poi.aliases.length > 0 && (
            <div className="meta-row">
              <span className="k">Aliases</span>
              <span className="v">{poi.aliases.join(', ')}</span>
            </div>
          )}

          {poi.hours && (
            <div className="meta-row">
              <span className="k">Hours</span>
              <span className="v mono">{poi.hours}</span>
            </div>
          )}

          {poi.address && (
            <div className="meta-row">
              <span className="k">Location</span>
              <span className="v">{poi.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="panel-foot">
        <button className="btn-primary" type="button" onClick={() => onDirectionsTo(poi)}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="2 7 14 1 8 13 7 8 2 7" />
          </svg>
          <span>Route here</span>
        </button>

        <button className="btn-secondary" type="button" onClick={() => onDirectionsFrom(poi)}>
          <span>Route from</span>
        </button>

        <button className="btn-subtle" type="button" onClick={() => onCenterMap(poi)} title="Center map">
          <span>Center</span>
        </button>

        {poi.website && (
          <a href={poi.website} target="_blank" rel="noopener noreferrer" className="btn-subtle link" title="Open website">
            <span>Web ↗</span>
          </a>
        )}
      </div>
    </section>
  )
}
