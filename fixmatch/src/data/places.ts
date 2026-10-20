import { distanceKm } from '@/lib/geo';
import { loose } from '@/lib/text';
import type { Coords, UserLocation } from '@/lib/types';

import placesJson from './places.json';

export interface Place {
  /** Lowest postal code of the town, e.g. "1000" for København K. */
  code: string;
  /** Highest postal code when a town spans a range, e.g. "1473". */
  to?: string;
  name: string;
  kommune: string;
  lat: number;
  lon: number;
  /** True when the coordinates are the municipality's main town. */
  approx?: boolean;
}

export const PLACES = placesJson as Place[];

export const DEFAULT_PLACE: Place = PLACES.find((p) => p.name === 'København K') ?? PLACES[0];

export function placeLabel(place: Place): string {
  return `${place.code} ${place.name}`;
}

export function placeToLocation(place: Place, source: UserLocation['source'] = 'manual'): UserLocation {
  return {
    source,
    coords: { lat: place.lat, lon: place.lon },
    label: place.name,
    postalCode: place.code,
  };
}

export const DEFAULT_LOCATION: UserLocation = placeToLocation(DEFAULT_PLACE, 'default');

export function findPlaceByPostalCode(code: string): Place | undefined {
  const value = Number(code);
  if (!Number.isFinite(value)) return undefined;
  return PLACES.find((p) => {
    const from = Number(p.code);
    const to = Number(p.to ?? p.code);
    return value >= from && value <= to;
  });
}

/** Postal code or town name search, best matches first. */
export function searchPlaces(query: string, limit = 30): Place[] {
  const q = query.trim();
  if (!q) return [];
  if (/^\d{1,4}$/.test(q)) {
    if (q.length === 4) {
      const exact = findPlaceByPostalCode(q);
      if (exact) return [exact];
    }
    return PLACES.filter((p) => p.code.startsWith(q)).slice(0, limit);
  }
  const needle = loose(q);
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of PLACES) {
    const name = loose(place.name);
    if (name.startsWith(needle)) starts.push(place);
    else if (name.includes(needle) || loose(place.kommune).startsWith(needle)) contains.push(place);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Nearest town with its own coordinates; used to name a GPS position. */
export function nearestPlace(coords: Coords): Place {
  let best = DEFAULT_PLACE;
  let bestKm = Infinity;
  for (const place of PLACES) {
    if (place.approx) continue;
    const km = distanceKm(coords, place);
    if (km < bestKm) {
      best = place;
      bestKm = km;
    }
  }
  return best;
}

/** Quick picks shown before the user types anything. */
export const POPULAR_PLACES: Place[] = ['København K', 'Frederiksberg', 'Aarhus C', 'Odense C', 'Aalborg', 'Esbjerg', 'Kolding', 'Vejle']
  .map((name) => PLACES.find((p) => p.name === name))
  .filter((p): p is Place => p !== undefined);
