const R = 6371008.8 // Earth radius in metres
const rad = (d: number) => (d * Math.PI) / 180

/**
 * Calculates great-circle distance between two coordinates in metres using Haversine formula.
 */
export function haversineDistance(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Area-weighted centroid for closed polygon rings.
 * Keeps labels inside irregularly shaped buildings instead of bounding box center.
 */
export function calculateCentroid(coordinates: number[][]): [number, number] {
  if (!coordinates || coordinates.length === 0) {
    return [74.823, 31.638]
  }

  if (coordinates.length < 3) {
    const latSum = coordinates.reduce((s, p) => s + p[1], 0)
    const lonSum = coordinates.reduce((s, p) => s + p[0], 0)
    return [lonSum / coordinates.length, latSum / coordinates.length]
  }

  let area = 0
  let cx = 0
  let cy = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]
    const cross = p1[0] * p2[1] - p2[0] * p1[1]
    area += cross
    cx += (p1[0] + p2[0]) * cross
    cy += (p1[1] + p2[1]) * cross
  }

  if (Math.abs(area) < 1e-12) {
    const latSum = coordinates.reduce((s, p) => s + p[1], 0)
    const lonSum = coordinates.reduce((s, p) => s + p[0], 0)
    return [lonSum / coordinates.length, latSum / coordinates.length]
  }

  area *= 0.5
  return [cx / (6 * area), cy / (6 * area)]
}

export function formatDistance(metres: number): string {
  if (metres < 950) {
    return `${Math.round(metres / 10) * 10} m`
  }
  return `${(metres / 1000).toFixed(1)} km`
}

export function formatEta(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 1) return '< 1 min'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`
}
