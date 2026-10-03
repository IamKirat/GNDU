import type { StyleSpecification } from 'maplibre-gl'
import type { GeoDatasets } from '../types'

export const PALETTE = {
  dark: {
    bg: '#06080c',
    campus: '#0d121a',
    boundary: '#1c2636',
    road: '#1c2534',
    roadCase: '#0a0d13',
    path: '#161e2b',
    building: '#151d28',
    buildingEdge: '#222e40',
    named: '#1b2535',
    label: '#d1d9e2',
    labelHalo: '#06080c',
    dotStroke: '#06080c',
    route: '#38bdf8',
    routeHalo: '#06080c',
    focus: '#4ade80',
  },
  light: {
    bg: '#d7dade',
    campus: '#eeece7',
    boundary: '#a8a294',
    road: '#ffffff',
    roadCase: '#c8c3b7',
    path: '#ffffff',
    building: '#dedbd3',
    buildingEdge: '#c4bfb3',
    named: '#d5d0c5',
    label: '#2f343b',
    labelHalo: '#ffffff',
    dotStroke: '#ffffff',
    route: '#1a5fb4',
    routeHalo: '#ffffff',
    focus: '#1d7a41',
  },
} as const

export function buildMapStyle(
  geo: GeoDatasets,
  poisGeoJSON: GeoJSON.FeatureCollection,
  theme: 'dark' | 'light' = 'dark'
): StyleSpecification {
  const C = PALETTE[theme]

  return {
    version: 8,
    sources: {
      'gndu-boundary': {
        type: 'geojson',
        data: geo.boundary,
      },
      'gndu-roads': {
        type: 'geojson',
        data: geo.roads,
      },
      'gndu-buildings': {
        type: 'geojson',
        data: geo.buildings,
      },
      'gndu-pois': {
        type: 'geojson',
        data: poisGeoJSON,
      },
      'gndu-route': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
      'gndu-focus': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
    },
    layers: [
      // 1. Map Canvas Background (Quiet, minimal)
      {
        id: 'bg',
        type: 'background',
        paint: {
          'background-color': C.bg,
        },
      },

      // 2. Campus Polygon Ground Fill
      {
        id: 'gndu-campus',
        type: 'fill',
        source: 'gndu-boundary',
        paint: {
          'fill-color': C.campus,
        },
      },

      // Campus Boundary Outline (Clean dashed edge)
      {
        id: 'gndu-campus-edge',
        type: 'line',
        source: 'gndu-boundary',
        paint: {
          'line-color': C.boundary,
          'line-width': 1.4,
          'line-dasharray': [3, 2],
        },
      },

      // 3. Road Casings (Subtle edge depth)
      {
        id: 'gndu-roads-casing',
        type: 'line',
        source: 'gndu-roads',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': C.roadCase,
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            13, 1.8,
            16, 4.5,
            19, 12,
          ],
        },
      },

      // 4. Road Core (Thin, high-contrast, uncluttered lines)
      {
        id: 'gndu-roads-core',
        type: 'line',
        source: 'gndu-roads',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'highway'],
            'footway', C.path,
            'path', C.path,
            'service', C.road,
            C.road,
          ],
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            13, 0.9,
            16, 3.2,
            19, 8,
          ],
        },
      },

      // 5. Buildings Fill (Named vs Unnamed building hierarchy)
      {
        id: 'gndu-buildings-fill',
        type: 'fill',
        source: 'gndu-buildings',
        paint: {
          'fill-color': [
            'case',
            ['has', 'name'],
            C.named,
            C.building,
          ],
          'fill-outline-color': C.buildingEdge,
        },
      },

      // Buildings Stroke (Crisp architectural contours)
      {
        id: 'gndu-buildings-stroke',
        type: 'line',
        source: 'gndu-buildings',
        minzoom: 14.5,
        paint: {
          'line-color': C.buildingEdge,
          'line-width': 0.8,
        },
      },

      // 6. Navigation Route Line
      {
        id: 'gndu-route-halo',
        type: 'line',
        source: 'gndu-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': C.routeHalo,
          'line-width': 8,
          'line-opacity': 0.8,
        },
      },
      {
        id: 'gndu-route-line',
        type: 'line',
        source: 'gndu-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': C.route,
          'line-width': 3.5,
        },
      },

      // 7. POI Vector Dots (Clean, restrained pin markers)
      {
        id: 'gndu-poi-dots',
        type: 'circle',
        source: 'gndu-pois',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 3,
            15, 4.5,
            17, 6,
            19, 7.5,
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': C.dotStroke,
          'circle-stroke-width': 1.2,
        },
      },

      // 8. Focus Ring for active selection
      {
        id: 'gndu-focus-ring',
        type: 'circle',
        source: 'gndu-focus',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 9,
            16, 14,
            19, 20,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': C.focus,
          'circle-stroke-width': 1.8,
        },
      },

      // 9. Vector Labels (Collision-managed, crisp text)
      {
        id: 'gndu-poi-labels',
        type: 'symbol',
        source: 'gndu-pois',
        minzoom: 14.2,
        filter: ['==', ['get', 'pin'], true],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14.2, 10,
            16, 11.5,
            18, 13,
          ],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-max-width': 9,
          'text-optional': true,
          'text-padding': 3,
          'symbol-sort-key': ['case', ['==', ['get', 'cat'], 'library'], 0, ['==', ['get', 'cat'], 'auditorium'], 1, ['==', ['get', 'cat'], 'academic'], 2, 3],
        },
        paint: {
          'text-color': C.label,
          'text-halo-color': C.labelHalo,
          'text-halo-width': 1.8,
        },
      },
    ],
  }
}
