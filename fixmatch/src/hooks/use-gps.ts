import * as Location from 'expo-location';
import { useState } from 'react';

import { locationFromGps } from '@/data/places';
import { t } from '@/i18n';
import { useApp } from '@/state/app-state';

export type GpsResult = 'ok' | 'denied' | 'error';

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
      // Outside FixMatch's countries the app shows the default city and says so.
      setLocation(locationFromGps({ lat: position.coords.latitude, lon: position.coords.longitude }));
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
    title: t('Placering er slået fra'),
    message: t('Du kan give FixMatch adgang i Indstillinger, eller vælge din by manuelt.'),
  },
  error: {
    title: t('Placeringen kunne ikke findes'),
    message: t('Prøv igen om lidt, eller vælg din by manuelt.'),
  },
};
