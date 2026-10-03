# gndu.maps

A map of Guru Nanak Dev University (GNDU) with the things students actually look for — departments, lecture halls, hostels, messes, canteens, sports grounds, water coolers, cycle stands, ATMs, health center, Gurdwara Sahib, opening hours — and one fast search over all of it.

```
⌘K            open the palette
LTC           Lecture Theatre Complex
BGL           Bhai Gurdas Library
DSW           Dean Student Welfare
gurdwara      Gurdwara Sahib
water         nearest coolers
tab           route to the highlighted result
```

## The one rule

**Real data or no data.** Every fact in this repo traces to a public source or ground survey. Where no source exists the feature is simply absent, and the palette says so instead of guessing. There is no placeholder timetable, no invented faculty, no plausible-looking bus schedule.

## Sources

| What | Where from | Details |
|---|---|---|
| Campus boundary & buildings | [OpenStreetMap](https://www.openstreetmap.org/relation/11494572) (ODbL) | GNDU campus polygon & building geometries |
| Walking & cycling network | OpenStreetMap paths, footways, service roads, steps | Navigable campus routing graph |
| Places, facilities & amenities | OpenStreetMap + Curated ground survey | 60+ key campus locations across 20 categories |
| Multilingual labels & aliases | GNDU directory & student survey | English, Punjabi (`ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਭਵਨ`, `ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ`), and acronyms (`LTC`, `BGL`, `DSW`, `UBS`) |

## Running it

```bash
npm install
npm run dev
```

`public/data/` contains all GeoJSON datasets and places committed directly, so `npm run dev` works immediately after `npm install` without touching any external API or network service.

To test a production bundle:

```bash
npm run build
npm run preview
```

## How it works

**No tile server, no external request.** The basemap is drawn client-side from local GeoJSON extracts — campus boundary polygon, road and footpath network, and architectural building footprints — using MapLibre GL. There is no API key, no external vector tile hosting, and no third-party tile budget.

**Routing.** A\* over the campus path and road network with CSR adjacency and binary min-heap. Edge costs are calculated per profile (walking at `~1.35 m/s`, cycling at `~4.2 m/s`), so the ETA reflects real walking and riding conditions rather than an arbitrary distance guess. Steps are flagged with pedestrian accessibility warnings.

**Search.** All campus entities, departments, hostels, amenities, and shortcuts are indexed into a flat document list at application start. Ranking evaluates exact-token match, prefix match, subsequence fuzzy match with word-boundary boosts, acronym lookups, and Punjabi Unicode script matching. Typical query time: **under 0.2 ms**.

**Opening hours** are parsed by a strict opening hours evaluator that evaluates real-time "Open Now" / "Closed" status against client time, returning `null` for unknown formats. A wrong "open now" is worse than none.

## Layout

```
public/
  data/
    boundary.geojson   GNDU outer campus boundary polygon
    buildings.geojson  Building footprints and OpenStreetMap attributes
    roads.geojson      Campus road and path segments
    places.json        Curated landmark directory with coordinates and metadata
src/
  components/
    CampusMap.tsx        MapLibre map container and layer coordination
    Header.tsx           Top bar, brand title, search trigger & controls
    CommandPalette.tsx   Instant search spotlight modal (⌘K)
    PlaceDetailPanel.tsx Place details, metadata badges, and actions
    RoutePanel.tsx       Point-to-point routing navigation drawer
    LayerToggle.tsx      Category legend with colored dot chips
  data/
    dataProcessor.ts   POI classifier, dataset normaliser & graph builder
  map/
    style.ts           MapLibre vector style engine (Dark & Light themes)
  route/
    router.ts          A* pathfinding with binary min-heap
  search/
    engine.ts          Sub-millisecond fuzzy search and scoring engine
    hours.ts           Opening hours parser
  utils/
    geo.ts             Haversine distance and polygon centroid calculations
  index.css            Minimalist, dark glassmorphism design system
  types.ts             TypeScript interface definitions
  main.tsx             Application entry point
```

## Contributing

Most of the physical world — academic departments, water coolers, cycle stands, ramps, opening hours, sports facilities — belongs in **OpenStreetMap** rather than here. Map it there and it can be included in the dataset, along with every other OSM consumer.

For anything OSM will not take or campus-specific metadata (such as Punjabi names, local acronyms, office locations), add it to `public/data/places.json` with surveyed `lat`/`lon`. Coordinates must come from actual surveys or verified university publications; nothing invented.

For UI enhancements, routing adjustments, or bug fixes, feel free to submit an issue or pull request.

## Licence

- Code: [MIT](LICENSE)
- Map Data: © OpenStreetMap contributors ([ODbL](https://www.openstreetmap.org/copyright))
- Campus Data: Guru Nanak Dev University, Amritsar
