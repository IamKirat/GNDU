import type * as GeoJSON from 'geojson'
import type { CategoryInfo, CategoryKey, Graph, Poi } from '../types'
import { calculateCentroid, haversineDistance } from '../utils/geo'

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  hostel: {
    label: 'Halls',
    color: '#d699ff',
    icon: '🏠',
    pin: true,
  },
  academic: {
    label: 'Depts & labs',
    color: '#4a9eff',
    icon: '🏛️',
    pin: true,
  },
  auditorium: {
    label: 'Lecture halls',
    color: '#f59e0b',
    icon: '🎭',
    pin: true,
  },
  canteen: {
    label: 'Canteens',
    color: '#4ade80',
    icon: '☕',
    pin: true,
  },
  sports: {
    label: 'Sports',
    color: '#22c55e',
    icon: '⚽',
    pin: true,
  },
  lights: {
    label: 'Street lights',
    color: '#eab308',
    icon: '💡',
    pin: false,
  },
  shops: {
    label: 'Shops',
    color: '#38bdf8',
    icon: '🛍️',
    pin: true,
  },
  administration: {
    label: 'Admin & help',
    color: '#e2e8f0',
    icon: '🏢',
    pin: true,
  },
  messes: {
    label: 'Messes',
    color: '#84cc16',
    icon: '🍽️',
    pin: true,
  },
  toilets: {
    label: 'Toilets',
    color: '#94a3b8',
    icon: '🚻',
    pin: false,
  },
  banks: {
    label: 'ATMs & banks',
    color: '#facc15',
    icon: '💳',
    pin: true,
  },
  cycle: {
    label: 'Cycle parking',
    color: '#06b6d4',
    icon: '🚲',
    pin: false,
  },
  laundry: {
    label: 'Laundry',
    color: '#c084fc',
    icon: '🧺',
    pin: false,
  },
  water: {
    label: 'Water coolers',
    color: '#38bdf8',
    icon: '💧',
    pin: false,
  },
  transport: {
    label: 'Transport',
    color: '#f43f5e',
    icon: '🚌',
    pin: true,
  },
  parks: {
    label: 'Parks',
    color: '#10b981',
    icon: '🌳',
    pin: true,
  },
  health: {
    label: 'Health',
    color: '#ef4444',
    icon: '🏥',
    pin: true,
  },
  worship: {
    label: 'Worship',
    color: '#a855f7',
    icon: '🪯',
    pin: true,
  },
  printing: {
    label: 'Printing',
    color: '#f97316',
    icon: '🖨️',
    pin: false,
  },
  library: {
    label: 'Libraries',
    color: '#818cf8',
    icon: '📚',
    pin: true,
  },
  other: {
    label: 'Other',
    color: '#94a3b8',
    icon: '📍',
    pin: false,
  },
}

/**
 * Standard ray-casting point-in-polygon algorithm.
 */
export function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function classifyPlace(name: string, props: Record<string, any>): CategoryKey {
  const n = (name || '').toLowerCase()
  const a = (props.amenity || '').toLowerCase()
  const b = (props.building || '').toLowerCase()

  if (a === 'library' || n.includes('library')) return 'library'
  if (a === 'place_of_worship' || n.includes('gurdwara') || n.includes('temple')) return 'worship'
  if (a === 'conference_centre' || n.includes('auditorium') || n.includes('bhavan') || n.includes('theatre complex') || n.includes('hall')) return 'auditorium'
  if (a === 'bank' || a === 'atm' || n.includes('bank') || n.includes('atm') || n.includes('sbi') || n.includes('pnb')) return 'banks'
  if (a === 'hospital' || a === 'clinic' || a === 'pharmacy' || n.includes('health') || n.includes('dispensary') || n.includes('medical')) return 'health'
  if (n.includes('dean student welfare') || n.includes('vice chancellor') || n.includes('admin') || n.includes('office') || n.includes('registrar') || n.includes('secretariat')) return 'administration'
  if (a === 'canteen' || a === 'cafe' || a === 'restaurant' || n.includes('canteen') || n.includes('cafe') || n.includes('nescafe') || n.includes('verka')) return 'canteen'
  if (n.includes('mess') || n.includes('dining')) return 'messes'
  if (n.includes('sports') || n.includes('stadium') || n.includes('ground') || n.includes('gym') || n.includes('pool') || n.includes('court') || n.includes('velodrome')) return 'sports'
  if (n.includes('hostel') || n.includes('residence') || b === 'dormitory' || n.includes('guest house')) return 'hostel'
  if (a === 'toilets' || n.includes('toilet') || n.includes('restroom') || n.includes('washroom')) return 'toilets'
  if (n.includes('parking') || n.includes('cycle') || n.includes('stand')) return 'cycle'
  if (n.includes('water') || n.includes('cooler') || n.includes('ro point')) return 'water'
  if (n.includes('print') || n.includes('press') || n.includes('photostat')) return 'printing'
  if (n.includes('laundry')) return 'laundry'
  if (n.includes('gate') || n.includes('bus') || n.includes('transport') || n.includes('rickshaw')) return 'transport'
  if (n.includes('garden') || n.includes('park') || n.includes('lawn') || n.includes('nursery')) return 'parks'
  if (n.includes('shop') || n.includes('store') || n.includes('complex') || a === 'shop') return 'shops'
  if (n.includes('light') || n.includes('lamp')) return 'lights'
  if (
    n.includes('department') ||
    n.includes('school') ||
    n.includes('bhawan') ||
    n.includes('physics') ||
    n.includes('mathematics') ||
    n.includes('computer') ||
    n.includes('chemistry') ||
    n.includes('lab') ||
    b === 'university'
  ) {
    return 'academic'
  }
  return 'academic'
}

/**
 * Filters roads GeoJSON to strictly include road segments inside or touching the campus boundary.
 */
export function filterRoadsToCampus(
  roadsData: GeoJSON.FeatureCollection,
  boundaryData: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
  if (!boundaryData.features.length) return roadsData
  const boundaryPoly = boundaryData.features[0].geometry as GeoJSON.Polygon
  const ring = boundaryPoly.coordinates[0]

  const campusFeatures = roadsData.features.filter((f) => {
    if (f.geometry.type !== 'LineString') return false
    const coords = (f.geometry as GeoJSON.LineString).coordinates
    // Keep road if at least one coordinate is inside the campus boundary
    return coords.some((c) => pointInRing(c[0], c[1], ring))
  })

  return {
    type: 'FeatureCollection',
    features: campusFeatures,
  }
}

/**
 * Extracts and unifies POIs from buildings GeoJSON and curated places.json.
 */
export function extractPois(
  buildingsData: GeoJSON.FeatureCollection,
  curatedPlaces: Array<{ id: string; name: string; category: string }>
): Poi[] {
  const pois: Poi[] = []
  const seenIds = new Set<string>()

  // 1. Process Building Polygons
  for (const feat of buildingsData.features) {
    const props = feat.properties || {}
    const name = props.name
    if (!name) continue

    const id = props['@id'] ? props['@id'].replace(/[^a-zA-Z0-9_-]/g, '_') : name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (seenIds.has(id)) continue
    seenIds.add(id)

    let centroid = [74.823, 31.638]
    if (feat.geometry.type === 'Polygon') {
      centroid = calculateCentroid((feat.geometry as GeoJSON.Polygon).coordinates[0])
    } else if (feat.geometry.type === 'MultiPolygon') {
      centroid = calculateCentroid((feat.geometry as GeoJSON.MultiPolygon).coordinates[0][0])
    }

    const cat = classifyPlace(name, props)
    const aliases: string[] = []

    if (name.includes('Bhai Gurdas Library')) aliases.push('BGL', 'Central Library', 'Main Library')
    if (name.includes('Lecture Theatre Complex')) aliases.push('LTC', 'Lecture Halls', 'Classes')
    if (name.includes('Dean Student Welfare')) aliases.push('DSW', 'Student Center')
    if (name.includes('Vice Chancellor Office')) aliases.push('VC Office', 'VC', 'Vice Chancellor')
    if (name.includes('Admin Block')) aliases.push('Administrative Block', 'Registrar Office', 'Main Office')
    if (name.includes('University Business School')) aliases.push('UBS', 'Management', 'MBA')
    if (name.includes('University School of Financial Studies')) aliases.push('USFS', 'Finance', 'Commerce')
    if (name.includes('Sri Guru Granth Sahib Bhawan')) aliases.push('SGGS Bhawan', 'Religious Studies', 'Centre on SGGS')
    if (name.includes('Gurdwara Sahib')) aliases.push('Campus Gurdwara', 'Gurudwara', 'Gurdwara')
    if (name.includes('Dashmesh Auditorium')) aliases.push('Dashmesh Hall', 'Main Auditorium')
    if (name.includes('Maharaja Ranjit Singh Bhawan')) aliases.push('MRSB', 'Ranjit Singh Bhawan')
    if (name.includes('Physics Department')) aliases.push('Physics Lab', 'Physics Dept')
    if (name.includes('Mathematics Department')) aliases.push('Maths Dept', 'Math Dept')

    pois.push({
      id,
      name,
      namePa: props['name:pa'],
      cat,
      lat: centroid[1],
      lon: centroid[0],
      osmId: props['@id'],
      buildingType: props.building,
      amenity: props.amenity,
      hours: props.opening_hours,
      wheelchair: props.wheelchair,
      website: props.website,
      internet: props.internet_access,
      aliases,
      address: props['addr:city'] ? `${props['addr:city']}, ${props['addr:postcode'] || ''}` : 'GNDU Campus, Amritsar',
      description: props.description || `Key landmark at Guru Nanak Dev University campus.`,
    })
  }

  // 2. Cross-reference with curated places if any missing
  for (const cp of curatedPlaces as any[]) {
    const existing = pois.find((p) => p.name.toLowerCase() === cp.name.toLowerCase() || p.id === cp.id)
    if (!existing) {
      pois.push({
        id: cp.id,
        name: cp.name,
        namePa: cp.namePa,
        cat: (cp.category as CategoryKey) || 'academic',
        lat: typeof cp.lat === 'number' ? cp.lat : 31.6375,
        lon: typeof cp.lon === 'number' ? cp.lon : 74.824,
        hours: cp.hours,
        aliases: cp.aliases || [],
        address: cp.address || 'GNDU Campus, Amritsar',
        description: cp.description || `Key landmark at Guru Nanak Dev University campus.`,
      })
    }
  }

  return pois
}

/**
 * Builds routing graph from campus-filtered roads GeoJSON.
 */
export function buildGraphFromRoads(roadsData: GeoJSON.FeatureCollection): Graph {
  const coordMap = new Map<string, number>()
  const lat: number[] = []
  const lon: number[] = []

  const getNodeIndex = (cLon: number, cLat: number): number => {
    const key = `${cLon.toFixed(6)},${cLat.toFixed(6)}`
    let idx = coordMap.get(key)
    if (idx === undefined) {
      idx = lat.length
      coordMap.set(key, idx)
      lat.push(cLat)
      lon.push(cLon)
    }
    return idx
  }

  const edges: Graph['edges'] = []
  const edgeSet = new Set<string>()

  for (const feat of roadsData.features) {
    if (feat.geometry.type !== 'LineString') continue
    const coords = (feat.geometry as GeoJSON.LineString).coordinates
    const hw = feat.properties?.highway || 'unclassified'

    const isSteps = hw === 'steps' ? 1 : 0
    const isFootway = hw === 'footway' || hw === 'path' || hw === 'steps'

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i]
      const p2 = coords[i + 1]

      const u = getNodeIndex(p1[0], p1[1])
      const v = getNodeIndex(p2[0], p2[1])

      if (u === v) continue

      const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`
      if (edgeSet.has(edgeKey)) continue
      edgeSet.add(edgeKey)

      const dist = haversineDistance(lat[u], lon[u], lat[v], lon[v])
      const footSeconds = Math.max(1, dist / 1.35)
      const bikeSeconds = isSteps ? -1 : Math.max(1, dist / (isFootway ? 2.5 : 4.2))
      const flags = isSteps ? 1 : 0

      edges.push([u, v, dist, footSeconds, bikeSeconds, flags])
    }
  }

  return {
    lat,
    lon,
    edges,
  }
}

/**
 * Converts POIs list into a clean GeoJSON FeatureCollection for MapLibre vector rendering.
 */
export function poisToGeoJSON(pois: Poi[], activeCategory: CategoryKey | 'all'): GeoJSON.FeatureCollection {
  const filtered = activeCategory === 'all' ? pois : pois.filter((p) => p.cat === activeCategory)
  return {
    type: 'FeatureCollection',
    features: filtered.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lon, p.lat],
      },
      properties: {
        id: p.id,
        name: p.name,
        namePa: p.namePa || '',
        cat: p.cat,
        color: CATEGORIES[p.cat]?.color || '#9ea7b3',
        icon: CATEGORIES[p.cat]?.icon || '📍',
        pin: CATEGORIES[p.cat]?.pin ?? true,
      },
    })),
  }
}
