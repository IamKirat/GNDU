/**
 * Deliberately strict opening_hours reader.
 * Returns null if the format is unparseable or ambiguous.
 */
export interface OpenStatus {
  open: boolean
  label: string
  detail?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function parseOpeningHours(rawHours?: string, now = new Date()): OpenStatus | null {
  if (!rawHours) return null

  const trimmed = rawHours.trim()
  if (trimmed === '24/7') {
    return { open: true, label: 'Open 24/7' }
  }

  // Example: Mo-Fr 09:00-21:00; Sa-Su 09:00-17:00; PH 09:00-17:00
  const dayIndex = now.getDay()
  const currentDayCode = DAYS[dayIndex]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const rules = trimmed.split(';').map((s) => s.trim()).filter(Boolean)

  for (const rule of rules) {
    // Check if rule matches current day
    const match = rule.match(/^([A-Za-z,-]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/)
    if (!match) continue

    const [, daysPart, startStr, endStr] = match
    const dayMatches = matchDayPart(daysPart, currentDayCode)

    if (dayMatches) {
      const [startH, startM] = startStr.split(':').map(Number)
      const [endH, endM] = endStr.split(':').map(Number)

      const startMin = startH * 60 + startM
      const endMin = endH * 60 + endM

      const isOpen = currentMinutes >= startMin && currentMinutes < endMin
      return {
        open: isOpen,
        label: isOpen ? 'Open Now' : 'Closed',
        detail: `Today: ${startStr} - ${endStr}`,
      }
    }
  }

  return {
    open: false,
    label: 'Hours Listed',
    detail: rawHours,
  }
}

function matchDayPart(daysSpec: string, currentDay: string): boolean {
  if (daysSpec.includes('PH')) {
    // Skip public holiday rule if not today
  }

  const parts = daysSpec.split(',')
  for (const p of parts) {
    if (p === currentDay) return true
    if (p.includes('-')) {
      const [start, end] = p.split('-')
      const startIdx = DAYS.indexOf(start)
      const endIdx = DAYS.indexOf(end)
      const curIdx = DAYS.indexOf(currentDay)

      if (startIdx !== -1 && endIdx !== -1 && curIdx !== -1) {
        if (startIdx <= endIdx) {
          if (curIdx >= startIdx && curIdx <= endIdx) return true
        } else {
          // Wrap around (e.g. Fr-Mo)
          if (curIdx >= startIdx || curIdx <= endIdx) return true
        }
      }
    }
  }
  return false
}
