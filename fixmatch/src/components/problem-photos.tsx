import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { t } from '@/i18n';
import { addProblemPhotos, MAX_PHOTOS, type ProblemPhoto, removeProblemPhoto, useProblem } from '@/state/problem';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Small enough for a text message, sharp enough to see a leak or a crack.
  quality: 0.6,
  exif: false,
};

function toPhotos(result: ImagePicker.ImagePickerResult): ProblemPhoto[] {
  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? undefined,
  }));
}

async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    showDialog(t('FixMatch må ikke bruge kameraet'), t('Slå kameraet til for FixMatch i Indstillinger.'), [
      { text: t('Annuller'), style: 'cancel' },
      { text: t('Åbn Indstillinger'), onPress: () => Linking.openSettings().catch(() => undefined) },
    ]);
    return;
  }
  addProblemPhotos(toPhotos(await ImagePicker.launchCameraAsync(PICKER_OPTIONS)));
}

async function choosePhotos(remaining: number) {
  // The system photo picker needs no permission: the user picks, and only those are shared.
  const result = await ImagePicker.launchImageLibraryAsync({
    ...PICKER_OPTIONS,
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
  });
  addProblemPhotos(toPhotos(result));
}

/** Thumbnails of the problem's pictures, with a remove button when `editable`. */
export function PhotoStrip({ editable = false, size = 84 }: { editable?: boolean; size?: number }) {
  const colors = useTheme();
  const { photos } = useProblem();
  if (photos.length === 0) return null;
  return (
    <View style={styles.strip}>
      {photos.map((photo, index) => (
        <View key={photo.uri} style={{ width: size, height: size }}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.thumb, { width: size, height: size, borderColor: colors.border }]}
            contentFit="cover"
            accessibilityLabel={t('Billede {number} af problemet', { number: index + 1 })}
          />
          {editable ? (
            <Tappable
              onPress={() => removeProblemPhoto(photo.uri)}
              accessibilityLabel={t('Fjern billede {number}', { number: index + 1 })}
              hitSlop={10}
              style={[styles.remove, { backgroundColor: colors.ink }]}>
              <Icon name="close" size={11} color={colors.onInk} weight="bold" />
            </Tappable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * "Foto af problemet" in Beskriv dit problem: take or choose up to three pictures. They stay
 * on the phone until the user sends them to a business.
 */
export function ProblemPhotos() {
  const colors = useTheme();
  const { photos } = useProblem();
  const remaining = MAX_PHOTOS - photos.length;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
          <Icon name="camera" size={17} color={colors.brand} weight="semibold" />
        </View>
        <View style={styles.flex}>
          <AppText variant="headline">{t('Billeder af problemet')}</AppText>
          <AppText variant="footnote" tone="textSecondary">
            {t('Et billede siger mere end ord. Send det til håndværkeren, når du kontakter dem.')}
          </AppText>
        </View>
      </View>
      <PhotoStrip editable />
      {remaining > 0 ? (
        <View style={styles.buttons}>
          {Platform.OS !== 'web' ? (
            <Button
              title={t('Tag billede')}
              icon="camera"
              variant="secondary"
              size="small"
              onPress={() => takePhoto().catch(() => undefined)}
            />
          ) : null}
          <Button
            title={photos.length > 0 ? t('Tilføj flere') : t('Vælg fra billeder')}
            icon="photo"
            variant="secondary"
            size="small"
            onPress={() => choosePhotos(remaining).catch(() => undefined)}
          />
        </View>
      ) : (
        <AppText variant="caption" tone="textSecondary">
          {t('Højst {count} billeder.', { count: MAX_PHOTOS })}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  thumb: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
