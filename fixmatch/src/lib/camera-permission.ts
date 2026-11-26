import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';

import { showDialog } from '@/lib/dialog';
import { t } from '@/i18n';

/**
 * Asks for the camera. When it is refused, says so and offers Indstillinger, instead of the
 * "Tag billede" button silently doing nothing.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.granted) return true;
  showDialog(t('FixMatch må ikke bruge kameraet'), t('Slå kameraet til for FixMatch i Indstillinger.'), [
    { text: t('Annuller'), style: 'cancel' },
    { text: t('Åbn Indstillinger'), onPress: () => Linking.openSettings().catch(() => undefined) },
  ]);
  return false;
}
