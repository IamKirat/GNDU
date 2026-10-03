import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { CategoryKey, GeoDatasets, Poi, Profile, Route } from '../types'
import { CATEGORIES, extractPois, buildGraphFromRoads, filterRoadsToCampus, poisToGeoJSON } from '../data/dataProcessor'
import { Router } from '../route/router'
import { SearchEngine } from '../search/engine'
import { buildMapStyle } from '../map/style'
import { Header } from './Header'
import { CommandPalette } from './CommandPalette'
import { PlaceDetailPanel } from './PlaceDetailPanel'
import { RoutePanel } from './RoutePanel'
import { LayerToggle } from './LayerToggle'

// Set worker URL explicitly to resolve ESM worker resolution
maplibregl.setWorkerUrl(maplibreWorkerUrl)

const GNDU_CENTER: [number, number] = [74.823, 31.638]
const GNDU_BOUNDS: [[number, number], [number, number]] = [
  [74.808, 31.628], // Southwest
  [74.832, 31.648], // Northeast
]

export default function CampusMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('gndu_map_theme') as 'dark' | 'light') || 'dark'
  })
  const [mapLoaded, setMapLoaded] = useState(false)

  const [geoData, setGeoData] = useState<GeoDatasets | null>(null)
  const [pois, setPois] = useState<Poi[]>([])
  const [router, setRouter] = useState<Router | null>(null)
  const [searchEngine, setSearchEngine] = useState<SearchEngine | null>(null)

  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null)
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all')

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isRoutingOpen, setIsRoutingOpen] = useState(false)

  const [routeOrigin, setRouteOrigin] = useState<Poi | null>(null)
  const [routeDest, setRouteDest] = useState<Poi | null>(null)
  const [routeProfile, setRouteProfile] = useState<Profile>('foot')
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null)

  // 1. Initial Data Fetching & Road Filtering
  useEffect(() => {
    async function loadData() {
      try {
        const [boundaryRes, roadsRes, buildingsRes, placesRes] = await Promise.all([
          fetch('/data/boundary.geojson'),
          fetch('/data/roads.geojson'),
          fetch('/data/buildings.geojson'),
          fetch('/data/places.json'),
        ])

        const boundary = (await boundaryRes.json()) as GeoJSON.FeatureCollection
        const rawRoads = (await roadsRes.json()) as GeoJSON.FeatureCollection
        const buildings = (await buildingsRes.json()) as GeoJSON.FeatureCollection
        const places = (await placesRes.json()) as Array<{ id: string; name: string; category: string }>

        // Filter roads strictly to GNDU campus boundary
        const roads = filterRoadsToCampus(rawRoads, boundary)

        const geo: GeoDatasets = { boundary, roads, buildings }
        setGeoData(geo)

        const extractedPois = extractPois(buildings, places)
        setPois(extractedPois)

        const graph = buildGraphFromRoads(roads)
        const builtRouter = new Router(graph)
        setRouter(builtRouter)

        const engine = new SearchEngine(extractedPois, CATEGORIES)
        setSearchEngine(engine)
      } catch (err) {
        console.error('Failed to load GNDU datasets:', err)
      }
    }

    loadData()
  }, [])

  // 2. Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainer.current || !geoData || mapInstance.current) return

    try {
      const poisGeoJSON = poisToGeoJSON(pois, activeCategory)
      const initialStyle = buildMapStyle(geoData, poisGeoJSON, theme)

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: initialStyle,
        center: GNDU_CENTER,
        zoom: 15.6,
        minZoom: 13.5,
        maxZoom: 19.5,
        maxBounds: [
          [74.78, 31.60],
          [74.86, 31.67],
        ],
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      })

      mapInstance.current = map

      // Navigation Control positioned neatly at bottom-right
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: true,
        }),
        'bottom-right'
      )

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© GNDU | © OpenStreetMap',
        }),
        'bottom-right'
      )

      map.on('load', () => {
        setMapLoaded(true)
        map.fitBounds(GNDU_BOUNDS, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 800,
        })
      })

      // Vector building click
      map.on('click', 'gndu-buildings-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const name = feature.properties?.name
        if (name) {
          const match = pois.find((p) => p.name === name || p.osmId === feature.properties?.['@id'])
          if (match) {
            setSelectedPoi(match)
            map.flyTo({ center: [match.lon, match.lat], zoom: 17, duration: 800 })
          }
        }
      })

      // Vector POI dot click
      map.on('click', 'gndu-poi-dots', (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const id = feature.properties?.id
        if (id) {
          const match = pois.find((p) => p.id === id)
          if (match) {
            setSelectedPoi(match)
            map.flyTo({ center: [match.lon, match.lat], zoom: 17, duration: 800 })
          }
        }
      })

      // Hover cursor
      map.on('mouseenter', 'gndu-buildings-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'gndu-buildings-fill', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'gndu-poi-dots', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'gndu-poi-dots', () => {
        map.getCanvas().style.cursor = ''
      })
    } catch (e: any) {
      console.error('Error initializing map:', e)
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [geoData])

  // 3. Update style on Theme change
  useEffect(() => {
    if (!mapInstance.current || !geoData || !mapLoaded) return
    const poisGeoJSON = poisToGeoJSON(pois, activeCategory)
    const newStyle = buildMapStyle(geoData, poisGeoJSON, theme)
    mapInstance.current.setStyle(newStyle)
    localStorage.setItem('gndu_map_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme, geoData, mapLoaded])

  // 4. Update POI layer on Category filter change
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return
    const poiSource = mapInstance.current.getSource('gndu-pois') as maplibregl.GeoJSONSource | undefined
    if (poiSource) {
      const poisGeoJSON = poisToGeoJSON(pois, activeCategory)
      poiSource.setData(poisGeoJSON)
    }
  }, [activeCategory, pois, mapLoaded])

  // 5. Update Focus Ring and Route Layer
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return
    const map = mapInstance.current

    // Update focus ring
    const focusSource = map.getSource('gndu-focus') as maplibregl.GeoJSONSource | undefined
    if (focusSource) {
      if (selectedPoi) {
        focusSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [selectedPoi.lon, selectedPoi.lat],
              },
              properties: {},
            },
          ],
        })
      } else {
        focusSource.setData({ type: 'FeatureCollection', features: [] })
      }
    }

    // Update route line
    const routeSource = map.getSource('gndu-route') as maplibregl.GeoJSONSource | undefined
    if (routeSource) {
      if (currentRoute && currentRoute.coords.length > 0) {
        routeSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: currentRoute.coords,
              },
              properties: {},
            },
          ],
        })
      } else {
        routeSource.setData({ type: 'FeatureCollection', features: [] })
      }
    }
  }, [mapLoaded, selectedPoi, currentRoute])

  // 6. Compute route when origin/dest/profile changes
  useEffect(() => {
    if (!router || !routeOrigin || !routeDest || routeOrigin.id === routeDest.id) {
      setCurrentRoute(null)
      return
    }

    const calculated = router.route(
      { lat: routeOrigin.lat, lon: routeOrigin.lon },
      { lat: routeDest.lat, lon: routeDest.lon },
      routeProfile
    )

    setCurrentRoute(calculated)

    if (calculated && mapInstance.current) {
      const lons = calculated.coords.map((c) => c[0])
      const lats = calculated.coords.map((c) => c[1])
      mapInstance.current.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        {
          padding: { top: 80, bottom: 80, left: 80, right: 360 },
          duration: 1000,
        }
      )
    }
  }, [router, routeOrigin, routeDest, routeProfile])

  const flyToLocation = useCallback((lat: number, lon: number) => {
    if (!mapInstance.current) return
    mapInstance.current.flyTo({
      center: [lon, lat],
      zoom: 17,
      duration: 900,
      essential: true,
    })
  }, [])

  const handleResetView = useCallback(() => {
    if (!mapInstance.current) return
    mapInstance.current.fitBounds(GNDU_BOUNDS, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      duration: 800,
    })
    setSelectedPoi(null)
  }, [])

  const handleDirectionsTo = (poi: Poi) => {
    setRouteDest(poi)
    if (!routeOrigin) {
      const defaultStart = pois.find((p) => p.name.includes('Library')) || pois[0]
      if (defaultStart && defaultStart.id !== poi.id) {
        setRouteOrigin(defaultStart)
      }
    }
    setIsRoutingOpen(true)
  }

  const handleDirectionsFrom = (poi: Poi) => {
    setRouteOrigin(poi)
    setIsRoutingOpen(true)
  }

  const handleSwapPoints = () => {
    const temp = routeOrigin
    setRouteOrigin(routeDest)
    setRouteDest(temp)
  }

  const handleClearRoute = () => {
    setRouteOrigin(null)
    setRouteDest(null)
    setCurrentRoute(null)
  }

  return (
    <div className={`map-viewport ${theme}`}>
      {/* Map Canvas */}
      <div ref={mapContainer} className="map-container" />

      {/* Top Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleRouting={() => setIsRoutingOpen((prev) => !prev)}
        isRoutingOpen={isRoutingOpen}
        onResetView={handleResetView}
      />

      {/* Bottom Left Dock: Layer Chips & Attribution */}
      <LayerToggle
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        totalPois={pois.length}
      />

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchEngine={searchEngine}
        onSelectPoi={(poi) => {
          setSelectedPoi(poi)
          flyToLocation(poi.lat, poi.lon)
        }}
        onRouteToPoi={(poi) => handleDirectionsTo(poi)}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        activeCategory={activeCategory}
      />

      {/* Right-Docked Place Details Drawer */}
      {selectedPoi && !isRoutingOpen && (
        <PlaceDetailPanel
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onDirectionsTo={handleDirectionsTo}
          onDirectionsFrom={handleDirectionsFrom}
          onCenterMap={(p) => flyToLocation(p.lat, p.lon)}
        />
      )}

      {/* Right-Docked Route Navigation Drawer */}
      <RoutePanel
        isOpen={isRoutingOpen}
        onClose={() => setIsRoutingOpen(false)}
        pois={pois}
        origin={routeOrigin}
        destination={routeDest}
        onSelectOrigin={setRouteOrigin}
        onSelectDestination={setRouteDest}
        onSwapPoints={handleSwapPoints}
        profile={routeProfile}
        onSelectProfile={setRouteProfile}
        route={currentRoute}
        onClearRoute={handleClearRoute}
      />
    </div>
  )
}