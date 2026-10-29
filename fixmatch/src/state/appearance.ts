import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

/** Light, dark, or follow the phone (Mere → Udseende). */
export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'fixmatch:appearance';

let preference: AppearancePreference = 'system';
let loaded = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const emit = () => listeners.forEach((listener) => listener());

/**
 * On iOS and Android the override is applied to the whole window, so the tab bar, navigation
 * bars, Apple Maps and system dialogs follow it too. The web demo only uses the preference.
 */
function apply(next: AppearancePreference) {
  if (Platform.OS !== 'web') Appearance.setColorScheme(next === 'system' ? 'auto' : next);
}

// Read once at start-up; the root layout waits for it, so the app never flashes the wrong theme.
AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored === 'light' || stored === 'dark') {
      preference = stored;
      apply(stored);
    }
  })
  .catch(() => undefined)
  .finally(() => {
    loaded = true;
    emit();
  });

export function setAppearance(next: AppearancePreference) {
  preference = next;
  apply(next);
  emit();
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
}

export function useAppearance(): AppearancePreference {
  return useSyncExternalStore(subscribe, () => preference);
}

export function useAppearanceLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded);
}
