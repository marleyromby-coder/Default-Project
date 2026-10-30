import { getLocales } from 'expo-localization';

import { distanceKm } from '@/lib/geo';
import { countryName, getMarket, isCountryCode } from '@/lib/markets';
import { loose } from '@/lib/text';
import type { Coords, UserLocation } from '@/lib/types';

import placesJson from './places.json';
import worldJson from './world-cities.json';

export interface Place {
  /** Danish postal code: the lowest one of the town, e.g. "1000" for København K. */
  code?: string;
  /** Highest postal code when a Danish town spans a range, e.g. "1473". */
  to?: string;
  name: string;
  /** Danish municipality. */
  kommune?: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  lat: number;
  lon: number;
  population?: number;
  /** True when the coordinates are the municipality's main town. */
  approx?: boolean;
}

type DanishRow = Omit<Place, 'country'>;
type WorldRow = [name: string, country: string, lat: number, lon: number, population: number];

/** Danish postal towns, then the world's cities (GeoNames, CC BY 4.0), biggest first. */
export const DANISH_PLACES: Place[] = (placesJson as DanishRow[]).map((p) => ({ ...p, country: 'DK' }));
export const WORLD_PLACES: Place[] = (worldJson as WorldRow[]).map(([name, country, lat, lon, population]) => ({
  name,
  country,
  lat,
  lon,
  population,
}));
export const PLACES: Place[] = [...DANISH_PLACES, ...WORLD_PLACES];

const CAPITALS: Record<string, string> = {
  DK: 'København K',
  SE: 'Stockholm',
  NO: 'Oslo',
  DE: 'Berlin',
  GB: 'London',
};

function findPlace(country: string, name: string): Place | undefined {
  return PLACES.find((p) => p.country === country && p.name === name);
}

export function placeLabel(place: Place): string {
  return place.code ? `${place.code} ${place.name}` : `${place.name}, ${countryName(place.country)}`;
}

export function placeToLocation(place: Place, source: UserLocation['source'] = 'manual'): UserLocation {
  return {
    source,
    coords: { lat: place.lat, lon: place.lon },
    label: place.name,
    postalCode: place.code,
    country: place.country,
  };
}

/** The phone's region decides where to start when there is no GPS position: London for a UK phone. */
function defaultPlace(): Place {
  let region: string | null | undefined;
  try {
    region = getLocales()[0]?.regionCode;
  } catch {
    region = undefined;
  }
  const country = isCountryCode(region) ? region : 'DK';
  return (
    findPlace(country, CAPITALS[country]) ?? DANISH_PLACES.find((p) => p.name === 'København K') ?? DANISH_PLACES[0]
  );
}

export const DEFAULT_PLACE: Place = defaultPlace();
export const DEFAULT_LOCATION: UserLocation = placeToLocation(DEFAULT_PLACE, 'default');

export function findPlaceByPostalCode(code: string): Place | undefined {
  const value = Number(code);
  if (!Number.isFinite(value)) return undefined;
  return DANISH_PLACES.find((p) => {
    const from = Number(p.code);
    const to = Number(p.to ?? p.code);
    return value >= from && value <= to;
  });
}

/** Danish postal code, or a town or city name anywhere. Danish towns and big cities come first. */
export function searchPlaces(query: string, limit = 30): Place[] {
  const q = query.trim();
  if (!q) return [];
  if (/^\d{1,4}$/.test(q)) {
    if (q.length === 4) {
      const exact = findPlaceByPostalCode(q);
      if (exact) return [exact];
    }
    return DANISH_PLACES.filter((p) => p.code?.startsWith(q)).slice(0, limit);
  }
  const needle = loose(q);
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of PLACES) {
    const name = loose(place.name);
    if (name.startsWith(needle)) starts.push(place);
    else if (name.includes(needle) || (place.kommune && loose(place.kommune).startsWith(needle))) contains.push(place);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Nearest town or city; used to name a GPS position. */
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

/** Quick picks in Denmark, shown before the user types anything. */
export const POPULAR_PLACES: Place[] = [
  'København K',
  'Frederiksberg',
  'Aarhus C',
  'Odense C',
  'Aalborg',
  'Esbjerg',
  'Kolding',
  'Vejle',
]
  .map((name) => DANISH_PLACES.find((p) => p.name === name))
  .filter((p): p is Place => p !== undefined);

/** One city per country outside Denmark where FixMatch has businesses. */
export const INTERNATIONAL_PLACES: Place[] = (['SE', 'NO', 'DE', 'GB'] as const)
  .map((country) => findPlace(country, CAPITALS[country]))
  .filter((p): p is Place => p !== undefined)
  .sort(
    (a, b) =>
      getMarket(isCountryCode(a.country) ? a.country : undefined).phase -
      getMarket(isCountryCode(b.country) ? b.country : undefined).phase,
  );
