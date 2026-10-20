import * as Location from 'expo-location';
import { useState } from 'react';

import { nearestPlace } from '@/data/places';
import { isInDenmark } from '@/lib/geo';
import type { UserLocation } from '@/lib/types';
import { useApp } from '@/state/app-state';

export type GpsResult = 'ok' | 'denied' | 'outside' | 'error';

/**
 * Asks for "while using the app" location once, on a button press. The position
 * is only used on the device to calculate distances and is never sent anywhere.
 */
export function useGps() {
  const { setLocation } = useApp();
  const [busy, setBusy] = useState(false);

  async function locate(): Promise<GpsResult> {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return 'denied';
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
      if (!isInDenmark(coords)) return 'outside';
      const place = nearestPlace(coords);
      const location: UserLocation = { source: 'gps', coords, label: place.name, postalCode: place.code };
      setLocation(location);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setBusy(false);
    }
  }

  return { locate, busy };
}

export const GPS_MESSAGES: Record<Exclude<GpsResult, 'ok'>, { title: string; message: string }> = {
  denied: {
    title: 'Placering er slået fra',
    message: 'Du kan give FixMatch adgang i Indstillinger, eller vælge din by manuelt.',
  },
  outside: {
    title: 'Du er uden for Danmark',
    message: 'FixMatch viser foreløbig kun danske virksomheder. Vælg en dansk by for at se resultater.',
  },
  error: {
    title: 'Placeringen kunne ikke findes',
    message: 'Prøv igen om lidt, eller vælg din by manuelt.',
  },
};
