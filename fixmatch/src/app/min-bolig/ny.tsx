import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Tappable } from '@/components/ui/tappable';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { showDialog } from '@/lib/dialog';
import { currencySymbol } from '@/lib/format';
import { defaultDeduction, type DeductionKind, hasInspections } from '@/lib/home-log';
import type { CategoryId } from '@/lib/types';
import { useContacts } from '@/state/account';
import { useApp, useMarket } from '@/state/app-state';
import { addHomeJob, keepPhoto, removeHomeJob, updateHomeJob, useHomeJobs } from '@/state/home';
import { t } from '@/i18n';

const MAX_PHOTOS = 6;

function amount(text: string): number | undefined {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}

/** "7/11/2026", "7.11.2026" or "2026-11-07" → "2026-11-07"; anything else → undefined. */
export function parseDay(text: string): string | undefined {
  const value = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.isNaN(Date.parse(value)) ? undefined : value;
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return undefined;
  const [, d, m, y] = match;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

/** "2026-11-07" → "07.11.2026" for the field. */
function dayText(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Adds or edits a job in "Min bolig". Opened empty, with a job to edit (?id=), or filled in
 * from "Del, hvad du betalte" (?virksomhed=&opgave=&pris=&loen=&dato=).
 */
export default function HomeJobScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { market } = useMarket();
  const contacts = useContacts();
  const params = useLocalSearchParams<{
    id?: string;
    virksomhed?: string;
    opgave?: string;
    pris?: string;
    loen?: string;
    dato?: string;
  }>();
  const existing = useHomeJobs().find((j) => j.id === params.id);
  const prefill = state.businesses.find((b) => b.id === params.virksomhed);

  const [businessId, setBusinessId] = useState<string | undefined>(existing?.businessId ?? prefill?.id);
  const [businessName, setBusinessName] = useState(existing?.businessName ?? prefill?.name ?? '');
  const [category, setCategory] = useState<CategoryId | undefined>(
    existing?.category ?? prefill?.categories[0] ?? undefined,
  );
  const [jobId, setJobId] = useState<string | undefined>(existing?.job ?? params.opgave);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [dateText, setDateText] = useState(dayText(existing?.date ?? (params.dato || localDay(new Date()))));
  const [totalText, setTotalText] = useState(existing ? String(existing.total) : (params.pris ?? ''));
  const [labourText, setLabourText] = useState(existing?.labour ? String(existing.labour) : (params.loen ?? ''));
  const [deduction, setDeduction] = useState<DeductionKind | undefined>(existing?.deduction);
  const [guarantee, setGuarantee] = useState(existing?.guaranteeYears ? String(existing.guaranteeYears) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [pickBusiness, setPickBusiness] = useState(!businessName);

  const cat = category ? getCategory(category) : undefined;
  const job = cat?.jobs.find((j) => j.id === jobId);
  const date = parseDay(dateText);
  const total = amount(totalText);
  const labour = amount(labourText);
  const effectiveDeduction = deduction ?? (category ? defaultDeduction(category, jobId) : 'none');
  const effectiveTitle = title.trim() || job?.name || '';
  const valid =
    !!category &&
    !!businessName.trim() &&
    !!date &&
    !!total &&
    !!effectiveTitle &&
    (labour === undefined || labour <= total);

  // Businesses the user has contacted come first; then any in the app.
  const recent = contacts
    .map((c) => state.businesses.find((b) => b.id === c.businessId))
    .filter((b, i, list): b is NonNullable<typeof b> => !!b && list.indexOf(b) === i)
    .slice(0, 6);

  const addPhotos = async (camera: boolean) => {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, exif: false })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          exif: false,
          allowsMultipleSelection: true,
          selectionLimit: MAX_PHOTOS - photos.length,
        });
    if (result.canceled) return;
    setPhotos((list) => [...list, ...result.assets.map((a) => keepPhoto(a.uri))].slice(0, MAX_PHOTOS));
  };

  const save = () => {
    if (!valid || !category || !date || !total) return;
    const entry = {
      businessId,
      businessName: businessName.trim(),
      category,
      job: jobId,
      title: effectiveTitle,
      date,
      total,
      labour,
      photos,
      deduction: effectiveDeduction,
      guaranteeYears: amount(guarantee),
      notes: notes.trim() || undefined,
    };
    if (existing) updateHomeJob(existing.id, entry);
    else addHomeJob(entry);
    router.back();
  };

  const confirmRemove = () =>
    showDialog(t('Slet opgaven?'), t('Opgaven og dens billeder slettes fra telefonen.'), [
      { text: t('Annuller'), style: 'cancel' },
      {
        text: t('Slet'),
        style: 'destructive',
        onPress: () => {
          if (existing) removeHomeJob(existing.id);
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? t('Ret opgave') : t('Ny opgave') }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Hvem lavede det?')}
          </AppText>
          {pickBusiness && recent.length > 0 ? (
            <View style={styles.wrap}>
              {recent.map((b) => (
                <Chip
                  key={b.id}
                  label={b.name}
                  selected={businessId === b.id}
                  onPress={() => {
                    setBusinessId(b.id);
                    setBusinessName(b.name);
                    if (!category) setCategory(b.categories[0]);
                    setPickBusiness(false);
                  }}
                />
              ))}
            </View>
          ) : null}
          <TextField
            label={t('Virksomhed')}
            value={businessName}
            onChangeText={(value) => {
              setBusinessName(value);
              setBusinessId(undefined);
            }}
            placeholder={t('Navn på virksomheden')}
            autoCorrect={false}
          />
        </View>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Fag')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                icon={c.id}
                selected={c.id === category}
                onPress={() => {
                  setCategory(c.id);
                  setJobId(undefined);
                  setDeduction(undefined);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {cat ? (
          <View style={styles.block}>
            <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
              {t('Opgave')}
            </AppText>
            <View style={styles.wrap}>
              {cat.jobs.map((j) => (
                <Chip
                  key={j.id}
                  label={j.name}
                  selected={j.id === jobId}
                  onPress={() => {
                    setJobId(j.id === jobId ? undefined : j.id);
                    setDeduction(undefined);
                  }}
                />
              ))}
            </View>
            <TextField
              label={t('Eller skriv selv (valgfrit)')}
              value={title}
              onChangeText={setTitle}
              placeholder={job?.name ?? t('Fx nyt badeværelse')}
            />
          </View>
        ) : null}

        <TextField
          label={t('Dato')}
          value={dateText}
          onChangeText={setDateText}
          keyboardType="numbers-and-punctuation"
          error={dateText && !date ? t('Skriv datoen som dd.mm.åååå') : undefined}
        />
        <View style={styles.pair}>
          <View style={styles.flex}>
            <TextField
              label={t('Pris i alt ({currency})', { currency: currencySymbol(market.currency) })}
              keyboardType="number-pad"
              value={totalText}
              onChangeText={setTotalText}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label={t('Heraf arbejdsløn')}
              keyboardType="number-pad"
              value={labourText}
              onChangeText={setLabourText}
              error={labour !== undefined && total !== undefined && labour > total ? t('Mere end prisen') : undefined}
            />
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Fradrag')}
          </AppText>
          <Segmented
            options={[
              { value: 'none', label: t('Intet') },
              { value: 'green', label: t('Håndværker') },
              { value: 'service', label: t('Service') },
            ]}
            value={effectiveDeduction}
            onChange={setDeduction}
            accessibilityLabel={t('Fradrag')}
          />
          <AppText variant="caption" tone="textSecondary">
            {t(
              'Håndværkerfradraget gælder grøn istandsættelse, fx vinduer, isolering og varmepumpe. Servicefradraget gælder rengøring, vinduespudsning og havearbejde. Tjek på skat.dk.',
            )}
          </AppText>
        </View>

        <TextField
          label={t('Garanti i år (valgfrit)')}
          keyboardType="number-pad"
          value={guarantee}
          onChangeText={setGuarantee}
          hint={
            category && hasInspections(category)
              ? t('Ved byggearbejde over 5.000 kr. minder vi også om 1- og 5-års gennemgang.')
              : undefined
          }
        />

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Faktura og billeder')}
          </AppText>
          {photos.length > 0 ? (
            <View style={styles.wrap}>
              {photos.map((uri, index) => (
                <View key={uri}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
                    contentFit="cover"
                  />
                  <Tappable
                    onPress={() => setPhotos((list) => list.filter((p) => p !== uri))}
                    accessibilityLabel={t('Fjern billede {number}', { number: index + 1 })}
                    hitSlop={8}
                    style={[styles.remove, { backgroundColor: colors.ink }]}>
                    <Icon name="close" size={11} color={colors.onInk} weight="bold" />
                  </Tappable>
                </View>
              ))}
            </View>
          ) : null}
          {photos.length < MAX_PHOTOS ? (
            <View style={styles.wrap}>
              {Platform.OS !== 'web' ? (
                <Button
                  title={t('Tag billede')}
                  icon="camera"
                  variant="secondary"
                  size="small"
                  onPress={() => addPhotos(true).catch(() => undefined)}
                />
              ) : null}
              <Button
                title={t('Vælg fra billeder')}
                icon="photo"
                variant="secondary"
                size="small"
                onPress={() => addPhotos(false).catch(() => undefined)}
              />
            </View>
          ) : null}
        </View>

        <TextField label={t('Noter (valgfrit)')} multiline maxLength={500} value={notes} onChangeText={setNotes} />

        <Button
          title={existing ? t('Gem ændringer') : t('Gem i Min bolig')}
          size="large"
          disabled={!valid}
          onPress={save}
          block
        />
        {existing ? <Button title={t('Slet opgaven')} variant="plain" onPress={confirmRemove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  block: { gap: Spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chips: { gap: Spacing.sm, paddingRight: Spacing.md },
  pair: { flexDirection: 'row', gap: Spacing.sm },
  thumb: { width: 84, height: 84, borderRadius: Radius.md },
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
});
