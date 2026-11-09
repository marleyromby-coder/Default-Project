import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { DEFAULT_LOCATION } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { showDialog } from '@/lib/dialog';
import type { CategoryId } from '@/lib/types';
import { msg, t } from '@/i18n';
import { useAccount } from '@/state/account';
import { useApp, useMarket } from '@/state/app-state';
import { createGroup, GROUP_JOB_IDEAS, GroupError } from '@/state/groups';

const WHEN = [
  { id: 'soon', label: msg('Inden for 2 uger'), from: 2, to: 14 },
  { id: 'month', label: msg('Inden for en måned'), from: 7, to: 30 },
  { id: 'quarter', label: msg('De næste 3 måneder'), from: 14, to: 90 },
] as const;

function plusDays(today: string, days: number): string {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Starts a group: the job, the street, when it suits, and a note to the neighbours. */
export default function NewGroupScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { market } = useMarket();
  const account = useAccount();
  const [category, setCategory] = useState<CategoryId>();
  const [jobId, setJobId] = useState<string>();
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState(state.location.postalCode ?? DEFAULT_LOCATION.postalCode ?? '');
  const [when, setWhen] = useState<(typeof WHEN)[number]['id']>('month');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const cat = category ? getCategory(category) : undefined;
  const valid = !!category && !!jobId && area.trim().length >= 2 && /^\d{3,5}$/.test(postalCode.trim());

  const start = async () => {
    if (!category || !jobId || !valid) return;
    const period = WHEN.find((w) => w.id === when) ?? WHEN[1];
    const today = localDay(new Date());
    setBusy(true);
    try {
      const group = await createGroup(
        {
          country: market.country,
          postalCode: postalCode.trim(),
          area: area.trim(),
          category,
          job: jobId,
          note: note.trim() || undefined,
          wantedFrom: plusDays(today, period.from),
          wantedTo: plusDays(today, period.to),
        },
        account.status === 'signedIn' ? account.userId : undefined,
      );
      router.replace({ pathname: '/faelles/[id]', params: { id: group.id, ny: '1' } });
    } catch (error) {
      const reason = error instanceof GroupError ? error.reason : 'network';
      showDialog(
        reason === 'signed-out' ? t('Log ind først') : t('Det lykkedes ikke'),
        reason === 'signed-out'
          ? t('Opret en bruger eller log ind, så naboerne ved, at gruppen er ægte.')
          : t('Gruppen blev ikke oprettet. Tjek internettet, og prøv igen.'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('Start en gruppe') }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <AppText variant="callout" tone="textSecondary">
          {t('Vælg opgaven, og skriv jeres gade. Så får du en kode, du kan sende til naboerne.')}
        </AppText>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Opgaver, der egner sig')}
          </AppText>
          <View style={styles.wrap}>
            {GROUP_JOB_IDEAS.map((idea) => {
              const job = getCategory(idea.category)?.jobs.find((j) => j.id === idea.job);
              if (!job) return null;
              return (
                <Chip
                  key={idea.job}
                  label={job.name}
                  icon={idea.category}
                  selected={jobId === idea.job && category === idea.category}
                  onPress={() => {
                    setCategory(idea.category);
                    setJobId(idea.job);
                  }}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Eller vælg et andet fag')}
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
                }}
              />
            ))}
          </ScrollView>
          {cat ? (
            <View style={styles.wrap}>
              {cat.jobs.map((j) => (
                <Chip key={j.id} label={j.name} selected={j.id === jobId} onPress={() => setJobId(j.id)} />
              ))}
            </View>
          ) : null}
        </View>

        <TextField
          label={t('Jeres gade eller område')}
          value={area}
          onChangeText={setArea}
          placeholder={t('Fx Stefansgade')}
          maxLength={60}
          hint={t('Naboerne skal kunne kende det. Skriv ikke husnumre.')}
        />
        <TextField
          label={t('Postnummer')}
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="number-pad"
          maxLength={5}
        />

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Hvornår passer det?')}
          </AppText>
          <View style={styles.wrap}>
            {WHEN.map((option) => (
              <Chip
                key={option.id}
                label={t(option.label)}
                selected={when === option.id}
                onPress={() => setWhen(option.id)}
              />
            ))}
          </View>
        </View>

        <TextField
          label={t('Besked til naboerne (valgfrit)')}
          multiline
          maxLength={300}
          value={note}
          onChangeText={setNote}
          placeholder={t('Fx: Vi er to huse, der gerne vil have det ordnet inden vinter.')}
        />

        <Button title={t('Opret gruppen')} size="large" disabled={!valid} loading={busy} onPress={start} block />
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
});
