import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { photoAlt, photoUrl } from '@/data/photos';
import { useTheme } from '@/hooks/use-theme';
import { MAX_WORK_PHOTOS } from '@/lib/data-source';
import { showDialog } from '@/lib/dialog';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import type { ManagedBusiness } from '@/state/business-account';
import { addWorkPhoto, loadWorkPhotos, removeWorkPhoto, useWorkPhotos, type WorkPhoto } from '@/state/work-photos';

const THUMB = { width: 168, height: 126 };

/** The photos of a business's finished work: a strip of thumbnails, tap to see one large. */
export function WorkPhotoStrip({
  business,
  manage,
}: {
  business: Business;
  /** When the owner manages the photos: lets them remove one. */
  manage?: ManagedBusiness;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const photos = useWorkPhotos(business);
  const [open, setOpen] = useState<WorkPhoto>();

  useEffect(() => {
    loadWorkPhotos(business).catch(() => undefined);
  }, [business]);

  if (photos.length === 0) return null;

  const remove = (photo: WorkPhoto) =>
    showDialog(t('Fjern billedet?'), t('Billedet forsvinder fra jeres side.'), [
      { text: t('Annuller'), style: 'cancel' },
      {
        text: t('Fjern'),
        style: 'destructive',
        onPress: () =>
          manage &&
          removeWorkPhoto(manage, business, photo).catch(() =>
            showDialog(t('Det lykkedes ikke'), t('Billedet blev ikke fjernet. Tjek internettet, og prøv igen.')),
          ),
      },
    ]);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {photos.map((photo, index) => (
          <View key={photo.id}>
            <Tappable
              onPress={() => setOpen(photo)}
              accessibilityRole="imagebutton"
              accessibilityLabel={
                photoAlt(photo.url)
                  ? t(photoAlt(photo.url)!)
                  : t('Billede {number} af udført arbejde', { number: index + 1 })
              }
              accessibilityHint={t('Viser billedet stort')}
              pressedOpacity={0.8}>
              <Image
                source={{ uri: photoUrl(photo.url, 600) }}
                style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
                transition={150}
              />
            </Tappable>
            {manage ? (
              <Tappable
                onPress={() => remove(photo)}
                accessibilityLabel={t('Fjern billede {number}', { number: index + 1 })}
                hitSlop={8}
                style={[styles.remove, { backgroundColor: colors.ink }]}>
                <Icon name="close" size={11} color={colors.onInk} weight="bold" />
              </Tappable>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={open !== undefined} transparent animationType="fade" onRequestClose={() => setOpen(undefined)}>
        <Pressable
          style={[styles.lightbox, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.md }]}
          onPress={() => setOpen(undefined)}
          accessibilityLabel={t('Luk')}
          accessibilityRole="button">
          {open ? (
            <Image
              source={{ uri: photoUrl(open.url, 1600) }}
              style={styles.large}
              contentFit="contain"
              accessibilityLabel={photoAlt(open.url) ? t(photoAlt(open.url)!) : t('Billede af udført arbejde')}
            />
          ) : null}
          <View style={styles.lightboxBar}>
            <AppText variant="footnote" style={styles.lightboxText}>
              {business.name}
              {business.demo ? ` · ${t('eksempelbillede')}` : ''}
            </AppText>
            <Icon name="close" size={18} color="#fff" weight="bold" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** The card on the business page. Hidden when there are no photos. */
export function WorkPhotosCard({ business }: { business: Business }) {
  const photos = useWorkPhotos(business);
  if (photos.length === 0) return null;
  return (
    <Card>
      <CardTitle title={t('Udført arbejde')} icon="photo" />
      <View style={styles.spaced}>
        <WorkPhotoStrip business={business} />
      </View>
      <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
        {business.demo
          ? t('Eksempelbilleder. Rigtige virksomheder lægger selv billeder af deres arbejde op.')
          : t('Billederne er lagt op af virksomheden selv.')}
      </AppText>
    </Card>
  );
}

/** The owner's view in "Min virksomhed": the strip, with add and remove. */
export function ManageWorkPhotos({ managed, business }: { managed: ManagedBusiness; business: Business }) {
  const photos = useWorkPhotos(business);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      exif: false,
      allowsMultipleSelection: true,
      selectionLimit: MAX_WORK_PHOTOS - photos.length,
    });
    if (result.canceled) return;
    setBusy(true);
    try {
      for (const asset of result.assets.slice(0, MAX_WORK_PHOTOS - photos.length)) {
        await addWorkPhoto(managed, business, { uri: asset.uri, mimeType: asset.mimeType ?? undefined });
      }
    } catch {
      showDialog(t('Det lykkedes ikke'), t('Billedet blev ikke lagt op. Tjek internettet, og prøv igen.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardTitle title={t('Billeder af jeres arbejde')} icon="photo" />
      <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
        {t(
          'Vis kunderne, hvad I kan: op til {max} billeder af færdige opgaver. Ingen personer eller adresser på billederne.',
          {
            max: MAX_WORK_PHOTOS,
          },
        )}
      </AppText>
      <View style={styles.spaced}>
        <WorkPhotoStrip business={business} manage={managed} />
      </View>
      {photos.length < MAX_WORK_PHOTOS ? (
        <View style={styles.spaced}>
          <Button
            title={photos.length === 0 ? t('Læg billeder op') : t('Tilføj flere')}
            icon="photo"
            variant="secondary"
            size="small"
            loading={busy}
            onPress={() => add().catch(() => undefined)}
          />
        </View>
      ) : null}
      {managed.demo && photos.length > 0 ? (
        <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
          {t('I eksemplet bliver billederne kun på denne telefon.')}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  strip: { gap: Spacing.sm, paddingRight: Spacing.md },
  thumb: { ...THUMB, borderRadius: Radius.md },
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
  spaced: { marginTop: Spacing.sm },
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  large: { flex: 1, width: '100%' },
  lightboxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  lightboxText: { color: '#fff', flexShrink: 1 },
});
