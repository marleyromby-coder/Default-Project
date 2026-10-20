import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useReducer } from 'react';

import { DEFAULT_LOCATION } from '@/data/places';
import { bundledBusinesses, parseBusinesses, REMOTE_DATA_URL } from '@/lib/data-source';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { DEFAULT_PRIORITIES } from '@/lib/ranking';
import type { Business, Filters, Priorities, UserLocation } from '@/lib/types';

const STORAGE_KEY = 'fixmatch:state:v1';
const REMOTE_CACHE_KEY = 'fixmatch:remote-businesses:v1';
export const MAX_COMPARE = 3;

/** Everything stored on the device. Nothing here ever leaves the phone. */
interface Persisted {
  onboarded: boolean;
  location: UserLocation;
  priorities: Priorities;
  favorites: string[];
  compare: string[];
}

interface State extends Persisted {
  ready: boolean;
  businesses: Business[];
  filters: Filters;
}

type Action =
  | { type: 'hydrate'; persisted: Partial<Persisted> }
  | { type: 'businesses'; businesses: Business[] }
  | { type: 'onboarded'; value: boolean }
  | { type: 'location'; location: UserLocation }
  | { type: 'priorities'; priorities: Priorities }
  | { type: 'favorite'; id: string }
  | { type: 'compare'; id: string }
  | { type: 'compare-clear' }
  | { type: 'filters'; filters: Filters }
  | { type: 'reset' };

const INITIAL_PERSISTED: Persisted = {
  onboarded: false,
  location: DEFAULT_LOCATION,
  priorities: DEFAULT_PRIORITIES,
  favorites: [],
  compare: [],
};

function initialState(): State {
  return { ...INITIAL_PERSISTED, ready: false, businesses: bundledBusinesses(), filters: DEFAULT_FILTERS };
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.persisted, ready: true };
    case 'businesses': {
      const ids = new Set(action.businesses.map((b) => b.id));
      return {
        ...state,
        businesses: action.businesses,
        favorites: state.favorites.filter((id) => ids.has(id)),
        compare: state.compare.filter((id) => ids.has(id)),
      };
    }
    case 'onboarded':
      return { ...state, onboarded: action.value };
    case 'location':
      return { ...state, location: action.location };
    case 'priorities':
      return { ...state, priorities: action.priorities };
    case 'favorite':
      return { ...state, favorites: toggle(state.favorites, action.id) };
    case 'compare': {
      if (state.compare.includes(action.id)) return { ...state, compare: state.compare.filter((x) => x !== action.id) };
      // Only businesses in the same trade are compared; picking another trade starts over.
      const trade = state.businesses.find((b) => b.id === action.id)?.categories[0];
      const sameTrade = state.compare.filter((id) => state.businesses.find((b) => b.id === id)?.categories[0] === trade);
      if (sameTrade.length >= MAX_COMPARE) return state;
      return { ...state, compare: [...sameTrade, action.id] };
    }
    case 'compare-clear':
      return { ...state, compare: [] };
    case 'filters':
      return { ...state, filters: action.filters };
    case 'reset':
      return { ...initialState(), businesses: state.businesses, ready: true };
    default:
      return state;
  }
}

function sanitize(raw: unknown): Partial<Persisted> {
  if (typeof raw !== 'object' || raw === null) return {};
  const value = raw as Partial<Persisted>;
  const out: Partial<Persisted> = {};
  if (typeof value.onboarded === 'boolean') out.onboarded = value.onboarded;
  if (value.location && typeof value.location.coords?.lat === 'number') out.location = value.location;
  if (value.priorities && typeof value.priorities.price === 'number') out.priorities = value.priorities;
  if (Array.isArray(value.favorites)) out.favorites = value.favorites.filter((x) => typeof x === 'string');
  if (Array.isArray(value.compare)) out.compare = value.compare.filter((x) => typeof x === 'string').slice(0, MAX_COMPARE);
  return out;
}

async function fetchRemoteBusinesses(url: string): Promise<Business[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const businesses = parseBusinesses(await response.json());
    return businesses.length > 0 ? businesses : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface AppContextValue {
  state: State;
  setOnboarded: (value: boolean) => void;
  setLocation: (location: UserLocation) => void;
  setPriorities: (priorities: Priorities) => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => boolean;
  clearCompare: () => void;
  setFilters: (filters: Filters) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let persisted: Partial<Persisted> = {};
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) persisted = sanitize(JSON.parse(raw));
      } catch {
        // Corrupt or unavailable storage: start fresh.
      }
      if (!cancelled) dispatch({ type: 'hydrate', persisted });

      if (!REMOTE_DATA_URL) return;
      try {
        const cached = await AsyncStorage.getItem(REMOTE_CACHE_KEY);
        const businesses = cached ? parseBusinesses(JSON.parse(cached)) : [];
        if (!cancelled && businesses.length > 0) dispatch({ type: 'businesses', businesses });
      } catch {
        // Ignore a broken cache.
      }
      const fresh = await fetchRemoteBusinesses(REMOTE_DATA_URL);
      if (!cancelled && fresh) {
        dispatch({ type: 'businesses', businesses: fresh });
        AsyncStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(fresh)).catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    const persisted: Persisted = {
      onboarded: state.onboarded,
      location: state.location,
      priorities: state.priorities,
      favorites: state.favorites,
      compare: state.compare,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => undefined);
  }, [state.ready, state.onboarded, state.location, state.priorities, state.favorites, state.compare]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setOnboarded: (v) => dispatch({ type: 'onboarded', value: v }),
      setLocation: (location) => dispatch({ type: 'location', location }),
      setPriorities: (priorities) => dispatch({ type: 'priorities', priorities }),
      toggleFavorite: (id) => dispatch({ type: 'favorite', id }),
      toggleCompare: (id) => {
        const trade = state.businesses.find((b) => b.id === id)?.categories[0];
        const sameTrade = state.compare.filter((x) => state.businesses.find((b) => b.id === x)?.categories[0] === trade);
        if (!state.compare.includes(id) && sameTrade.length >= MAX_COMPARE) return false;
        dispatch({ type: 'compare', id });
        return true;
      },
      clearCompare: () => dispatch({ type: 'compare-clear' }),
      setFilters: (filters) => dispatch({ type: 'filters', filters }),
      resetAll: () => {
        AsyncStorage.multiRemove([STORAGE_KEY, REMOTE_CACHE_KEY]).catch(() => undefined);
        dispatch({ type: 'reset' });
      },
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppStateProvider');
  return value;
}

export function useBusiness(id: string | undefined): Business | undefined {
  const { state } = useApp();
  return useMemo(() => state.businesses.find((b) => b.id === id), [state.businesses, id]);
}
