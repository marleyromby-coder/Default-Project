import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { currencyOf } from '@/lib/business-text';
import { showDialog } from '@/lib/dialog';
import { currencySymbol } from '@/lib/format';
import { parseHours, WEEKDAYS } from '@/lib/opening-hours';
import type { Business, PriceUnit } from '@/lib/types';
import { t } from '@/i18n';
import { useBusiness } from '@/state/app-state';
import { changedFields, type ChangeRequest, requestChanges, useManagedBusiness } from '@/state/business-account';

/** "12.500" or "12500 kr." → 12500. Empty → undefined. */
function amount(text: string): number | undefined {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}

const hoursText = (slot: [string, string] | null) => (slot ? `${slot[0]}–${slot[1]}` : '');

export default function EditBusinessScreen() {
  const managed = useManagedBusiness();
  const business = useBusiness(managed?.businessId);
  if (!managed || !business) {
    return (
      <EmptyState
        icon="store"
        title={t('Du er ikke logget ind som virksomhed')}
        message={t('Log ind med koden fra FixMatch for at rette jeres oplysninger.')}
        action={<Button title={t('Tilbage')} onPress={() => router.back()} />}
      />
    );
  }
  return <EditForm business={business} />;
}

function EditForm({ business }: { business: Business }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const managed = useManagedBusiness();
  const currency = currencySymbol(currencyOf(business));
  const jobs = business.categories.flatMap((id) => getCategory(id)?.jobs ?? []);
  const [hourlyMin, setHourlyMin] = useState(String(business.pricing.hourlyMin));
  const [hourlyMax, setHourlyMax] = useState(String(business.pricing.hourlyMax));
  const [callout, setCallout] = useState(business.pricing.calloutFee ? String(business.pricing.calloutFee) : '');
  const [emergency, setEmergency] = useState(business.emergency);
  const [hours, setHours] = useState(business.hours.map(hoursText));
  const [description, setDescription] = useState(business.description);
  const [examples, setExamples] = useState(
    jobs.map((job) => {
      const old = business.pricing.examples.find((e) => e.job === job.id);
      return {
        job: job.id,
        name: job.name,
        unit: job.unit,
        min: old ? String(old.min) : '',
        max: old ? String(old.max) : '',
      };
    }),
  );
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const min = amount(hourlyMin);
  const max = amount(hourlyMax);
  const parsedHours = hours.map(parseHours);
  const badHours = parsedHours.map((h) => h === 'invalid');
  const badExamples = examples.map((e) => {
    const a = amount(e.min);
    const b = amount(e.max);
    return (a === undefined) !== (b === undefined) || (a !== undefined && b !== undefined && a > b);
  });
  const hourlyError =
    min && max && min > max ? t('Den højeste timepris skal være mindst lige så høj som den laveste.') : undefined;
  const valid = !!min && !!max && !hourlyError && !badHours.some(Boolean) && !badExamples.some(Boolean);

  const unitLabel = (unit: PriceUnit) =>
    unit === 'm2' ? t('pr. m²') : unit === 'stk' ? t('pr. stk.') : t('pr. opgave');

  const send = async () => {
    if (!managed || !valid) return;
    const wanted: ChangeRequest = {
      hourlyMin: min,
      hourlyMax: max,
      calloutFee: amount(callout) ?? null,
      emergency,
      hours: parsedHours.map((h) => (h === 'invalid' ? null : h)),
      description,
      examples: examples
        .filter((e) => amount(e.min) !== undefined && amount(e.max) !== undefined)
        .map((e) => ({ job: e.job, min: amount(e.min)!, max: amount(e.max)!, unit: e.unit })),
      note,
    };
    const changes = changedFields(business, wanted);
    if (Object.keys(changes).length === 0) {
      showDialog(t('Intet er ændret'), t('Ret et felt, eller skriv en besked til os nederst.'));
      return;
    }
    setBusy(true);
    try {
      await requestChanges(managed, changes);
      router.back();
      showDialog(
        t('Tak, det er sendt'),
        managed.demo
          ? t('I den rigtige app tjekker FixMatch ændringerne og lægger dem ind inden for 2 hverdage.')
          : t('Vi tjekker ændringerne og lægger dem ind inden for 2 hverdage.'),
      );
    } catch {
      showDialog(t('Det lykkedes ikke'), t('Ændringerne blev ikke sendt. Tjek internettet, og prøv igen.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('Ret oplysninger') }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <AppText variant="callout" tone="textSecondary">
          {t('Ret det, der skal ændres. Alle priser er inklusive moms. FixMatch tjekker ændringerne, før de vises.')}
        </AppText>

        <Card>
          <CardTitle title={t('Timepris')} icon="tag" />
          <View style={[styles.pair, styles.spaced]}>
            <View style={styles.flex}>
              <TextField
                label={t('Fra ({currency})', { currency })}
                keyboardType="number-pad"
                value={hourlyMin}
                onChangeText={setHourlyMin}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label={t('Til ({currency})', { currency })}
                keyboardType="number-pad"
                value={hourlyMax}
                onChangeText={setHourlyMax}
                error={hourlyError}
              />
            </View>
          </View>
          <TextField
            label={t('Kørsel eller opstart ({currency}, valgfrit)', { currency })}
            keyboardType="number-pad"
            value={callout}
            onChangeText={setCallout}
          />
        </Card>

        <Card>
          <CardTitle title={t('Priser på opgaver')} icon="receipt" />
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {t('Typisk pris fra–til. Lad felterne stå tomme, hvis I ikke laver opgaven.')}
          </AppText>
          {examples.map((example, index) => (
            <View key={example.job} style={styles.spaced}>
              <AppText variant="subhead" weight="600">
                {example.name}{' '}
                <AppText variant="footnote" tone="textSecondary">
                  {unitLabel(example.unit)}
                </AppText>
              </AppText>
              <View style={styles.pair}>
                {(['min', 'max'] as const).map((field) => (
                  <View key={field} style={styles.flex}>
                    <TextField
                      label={field === 'min' ? t('Fra') : t('Til')}
                      keyboardType="number-pad"
                      value={example[field]}
                      onChangeText={(value) =>
                        setExamples((list) => list.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
                      }
                      error={
                        field === 'max' && badExamples[index]
                          ? t('Udfyld fra og til, og fra skal være lavest.')
                          : undefined
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <CardTitle title={t('Åbningstider')} icon="clock" />
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {t('Skriv fx 7-16 eller 07.30-15.30. Tomt betyder lukket.')}
          </AppText>
          {WEEKDAYS.map((day, index) => (
            <View key={day} style={styles.hoursRow}>
              <AppText variant="subhead" style={styles.day}>
                {day}
              </AppText>
              <View style={styles.flex}>
                <TextField
                  label=""
                  accessibilityLabel={t('Åbningstid {day}', { day })}
                  value={hours[index]}
                  onChangeText={(value) => setHours((list) => list.map((h, i) => (i === index ? value : h)))}
                  placeholder={t('Lukket')}
                  error={badHours[index] ? t('Skriv fx 7-16') : undefined}
                />
              </View>
            </View>
          ))}
          <View style={[styles.switchRow, styles.spaced]}>
            <View style={styles.flex}>
              <AppText variant="body">{t('Døgnvagt')}</AppText>
              <AppText variant="footnote" tone="textSecondary">
                {t('I tager telefonen uden for åbningstid')}
              </AppText>
            </View>
            <Switch
              value={emergency}
              onValueChange={setEmergency}
              trackColor={{ true: colors.brandStrong }}
              accessibilityLabel={t('Døgnvagt')}
            />
          </View>
        </Card>

        <Card>
          <CardTitle title={t('Om virksomheden')} icon="store" />
          <View style={styles.spaced}>
            <TextField
              label={t('Beskrivelse')}
              multiline
              maxLength={600}
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <View style={styles.spaced}>
            <TextField
              label={t('Andet, vi skal rette (valgfrit)')}
              multiline
              maxLength={500}
              value={note}
              onChangeText={setNote}
              placeholder={t('Fx nyt telefonnummer, ny adresse eller nye billeder')}
            />
          </View>
        </Card>

        <Button title={t('Send ændringerne')} size="large" onPress={send} loading={busy} disabled={!valid} block />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  spaced: { marginTop: Spacing.sm },
  pair: { flexDirection: 'row', gap: Spacing.sm },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  day: { width: 90 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
