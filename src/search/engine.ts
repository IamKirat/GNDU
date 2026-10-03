import type { CategoryKey, Poi } from '../types'
import { parseOpeningHours } from './hours'

export type DocKind = 'place' | 'category' | 'action' | 'intent'

export interface SearchDoc {
  kind: DocKind
  id: string
  title: string
  sub: string
  hay: string
  keys: string[]
  cat?: CategoryKey
  lat?: number
  lon?: number
  poi?: Poi
  boost: number
  action?: () => void
}

export interface SearchHit extends SearchDoc {
  score: number
  marks: number[]
}

const lower = (s: string) => (s || '').toLowerCase()
const words = (s: string) => lower(s).split(/[^a-z0-9]+/).filter(Boolean)

/**
 * Subsequence fuzzy matcher with word-boundary and contiguity bonuses.
 */
function fuzzyMatch(needle: string, haystack: string): { score: number; at: number[] } | null {
  if (!needle) return { score: 0, at: [] }
  const n = needle.length
  const h = haystack.length
  if (n > h) return null

  const at: number[] = []
  let score = 0
  let hi = 0
  let streak = 0

  for (let ni = 0; ni < n; ni++) {
    const c = needle[ni]
    let found = -1
    while (hi < h) {
      if (haystack[hi] === c) {
        found = hi
        break
      }
      hi++
    }
    if (found === -1) return null

    let bonus = 1
    const prev = found > 0 ? haystack[found - 1] : ' '
    if (found === 0) bonus += 8
    else if (prev === ' ' || prev === '-' || prev === '/') bonus += 6
    else if (prev >= '0' && prev <= '9' && !(c >= '0' && c <= '9')) bonus += 2

    streak = at.length && at[at.length - 1] === found - 1 ? streak + 1 : 0
    bonus += Math.min(streak * 3, 12)

    score += bonus
    at.push(found)
    hi = found + 1
  }

  score -= Math.min(at[0] * 0.4, 12)
  score -= Math.min(h * 0.02, 6)
  return { score, at }
}

function scoreDoc(doc: SearchDoc, q: string, qWords: string[]): SearchHit | null {
  let best = -1
  let marks: number[] = []

  // 1. Exact or prefix match on any key tokens
  for (const k of doc.keys) {
    if (k === q) {
      best = Math.max(best, 1000)
      break
    }
    if (k.startsWith(q)) {
      best = Math.max(best, 700 - (k.length - q.length))
    }
  }

  // 2. Title fuzzy match
  const tMatch = fuzzyMatch(q, lower(doc.title))
  if (tMatch) {
    marks = tMatch.at
    best = Math.max(best, 300 + tMatch.score)
  }

  // 3. Multi-word query matching
  if (best < 0 && qWords.length > 1) {
    let all = true
    let sum = 0
    for (const w of qWords) {
      const idx = doc.hay.indexOf(w)
      if (idx === -1) {
        all = false
        break
      }
      sum += 40 - Math.min(idx * 0.05, 20)
    }
    if (all) best = sum
  }

  // 4. Substring in haystack
  if (best < 0) {
    const idx = doc.hay.indexOf(q)
    if (idx !== -1) {
      best = 30 - Math.min(idx * 0.05, 20)
    }
  }

  if (best < 0) return null
  return { ...doc, score: best + doc.boost, marks }
}

export class SearchEngine {
  readonly docs: SearchDoc[] = []

  constructor(pois: Poi[], categories: Record<string, { label: string }>) {
    // 1. Index POIs
    for (const poi of pois) {
      const keys: string[] = [
        ...words(poi.name),
        ...(poi.aliases ? poi.aliases.flatMap(words) : []),
        poi.id.toLowerCase(),
      ]

      const openStatus = parseOpeningHours(poi.hours)
      const sub = [
        categories[poi.cat]?.label || poi.cat,
        poi.namePa,
        openStatus ? openStatus.label : undefined,
      ]
        .filter(Boolean)
        .join(' · ')

      const hay = [
        poi.name,
        poi.namePa || '',
        ...(poi.aliases || []),
        poi.description || '',
        poi.amenity || '',
        poi.buildingType || '',
        poi.address || '',
        categories[poi.cat]?.label || '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      this.docs.push({
        kind: 'place',
        id: poi.id,
        title: poi.name,
        sub,
        hay,
        keys,
        cat: poi.cat,
        lat: poi.lat,
        lon: poi.lon,
        poi,
        boost: poi.cat === 'library' || poi.cat === 'auditorium' || poi.cat === 'worship' ? 50 : 20,
      })
    }

    // 2. Index Categories for quick filtering
    for (const [k, v] of Object.entries(categories)) {
      this.docs.push({
        kind: 'category',
        id: `cat-${k}`,
        title: `Category: ${v.label}`,
        sub: `Filter all ${v.label.toLowerCase()} on campus`,
        hay: `${v.label} ${k} category filter all`.toLowerCase(),
        keys: words(v.label),
        cat: k as CategoryKey,
        boost: 10,
      })
    }
  }

  search(query: string, limit = 15): SearchHit[] {
    const q = lower(query.trim())
    if (!q) {
      // Default top suggestions
      return this.docs
        .filter((d) => d.kind === 'place')
        .slice(0, limit)
        .map((d) => ({ ...d, score: d.boost, marks: [] }))
    }

    const qWords = words(q)
    const hits: SearchHit[] = []

    for (const doc of this.docs) {
      const hit = scoreDoc(doc, q, qWords)
      if (hit) hits.push(hit)
    }

    hits.sort((a, b) => b.score - a.score)
    return hits.slice(0, limit)
  }
}
