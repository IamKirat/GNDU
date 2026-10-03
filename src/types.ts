import type * as GeoJSON from 'geojson'

export type CategoryKey =
  | 'hostel'
  | 'academic'
  | 'auditorium'
  | 'canteen'
  | 'sports'
  | 'lights'
  | 'shops'
  | 'administration'
  | 'messes'
  | 'toilets'
  | 'banks'
  | 'cycle'
  | 'laundry'
  | 'water'
  | 'transport'
  | 'parks'
  | 'health'
  | 'worship'
  | 'printing'
  | 'library'
  | 'other'

export interface CategoryInfo {
  label: string
  color: string
  icon: string
  pin: boolean
}

export interface Poi {
  id: string
  name: string
  namePa?: string
  cat: CategoryKey
  lat: number
  lon: number
  osmId?: string
  buildingType?: string
  amenity?: string
  hours?: string
  wheelchair?: string
  website?: string
  internet?: string
  aliases?: string[]
  description?: string
  address?: string
}

export interface CampusMeta {
  name: string
  subtitle: string
  center: [number, number]
  bounds: [[number, number], [number, number]]
  attribution: string
  stats: {
    buildings: number
    roads: number
    pois: number
    roadLengthKm: number
  }
}

export interface Graph {
  lat: number[]
  lon: number[]
  /** [fromNodeIndex, toNodeIndex, metres, footSeconds, bikeSeconds, flags] */
  edges: [number, number, number, number, number, number][]
}

export type Profile = 'foot' | 'bike'

export interface Route {
  coords: [number, number][]
  seconds: number
  metres: number
  steps: boolean
  indoor: boolean
  unpaved: boolean
}

export interface GeoDatasets {
  boundary: GeoJSON.FeatureCollection
  buildings: GeoJSON.FeatureCollection
  roads: GeoJSON.FeatureCollection
}
