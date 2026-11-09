import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { localDay } from '@/lib/availability';
import { formatDate, formatPrice } from '@/lib/format';
import {
  categoryName,
  REMINDER_TEXT,
  reminders,
  SERVICE_DEDUCTION_MAX,
  totalSpent,
  yearDeduction,
} from '@/lib/home-log';
import { GREEN_DEDUCTION_MAX } from '@/lib/quote-check';
import { useMarket } from '@/state/app-state';
import { useHomeJobs, useHomeReady } from '@/state/home';
import { t } from '@/i18n';

/**
 * "Min bolig": everything done on the home in one place. What this year's deduction gives,
 * what is coming up (inspections, guarantees) and every job with its invoice.
 */
export default function MyHomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { market } = useMarket();
  const jobs = useHomeJobs();
  const ready = useHomeReady();
  const today = localDay(new Date());
  const thisYear = Number(today.slice(0, 4));
  const [adults, setAdults] = useState<'1' | '2'>('1');
  const deduction = yearDeduction(jobs, thisYear, Number(adults));
  const upcoming = reminders(jobs, today).slice(0, 4);

  if (ready && jobs.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: t('Min bolig') }} />
        <EmptyState
          icon="home"
          title={t('Alt om dit hjem ét sted')}
          message={t(
            'Gem faktura og billeder, hver gang du får lavet noget. Så ved du, hvem der lavede hvad, hvornår garantien udløber, og hvad fradraget giver i år. Det bliver på din telefon.',
          )}
          action={<Button title={t('Tilføj en opgave')} icon="plus" onPress={() => router.push('/min-bolig/ny')} />}
        />
      </>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Min bolig') }} />

      <Card>
        <CardTitle title={t('Fradrag {year}', { year: thisYear })} icon="receipt" />
        <View style={[styles.deduction, styles.spaced]}>
          <View style={styles.flex}>
            <AppText variant="title1" rounded>
              {formatPrice(deduction.saving, market.currency)}
            </AppText>
            <AppText variant="footnote" tone="textSecondary">
              {t('cirka tilbage i skat for arbejdsløn på {amount}', {
                amount: formatPrice(deduction.deduction, market.currency),
              })}
            </AppText>
          </View>
        </View>
        <View style={styles.spaced}>
          <Segmented
            options={[
              { value: '1', label: t('1 voksen') },
              { value: '2', label: t('2 voksne') },
            ]}
            value={adults}
            onChange={setAdults}
            accessibilityLabel={t('Voksne i husstanden')}
          />
        </View>
        <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
          {deduction.capped
            ? t(
                'Loftet er nået. Bor I flere voksne, kan hver trække op til {green} fra for grøn istandsættelse og {service} for service.',
                {
                  green: formatPrice(GREEN_DEDUCTION_MAX, market.currency),
                  service: formatPrice(SERVICE_DEDUCTION_MAX, market.currency),
                },
              )
            : t(
                'Kun arbejdsløn tæller, ikke materialer. Grøn istandsættelse op til {green} og service op til {service} pr. voksen. Indberet selv på skat.dk.',
                {
                  green: formatPrice(GREEN_DEDUCTION_MAX, market.currency),
                  service: formatPrice(SERVICE_DEDUCTION_MAX, market.currency),
                },
              )}
        </AppText>
        <Divider />
        <View style={styles.rowBetween}>
          <AppText variant="subhead" tone="textSecondary">
            {t('Brugt på boligen i {year}', { year: thisYear })}
          </AppText>
          <AppText variant="subhead" weight="600" tabular>
            {formatPrice(totalSpent(jobs, thisYear), market.currency)}
          </AppText>
        </View>
      </Card>

      {upcoming.length > 0 ? (
        <Card>
          <CardTitle title={t('Husk')} icon="calendar" />
          {upcoming.map((reminder, index) => (
            <View key={`${reminder.job.id}-${reminder.kind}`}>
              {index > 0 ? <Divider /> : null}
              <Tappable
                onPress={() => router.push({ pathname: '/min-bolig/ny', params: { id: reminder.job.id } })}
                accessibilityLabel={`${t(REMINDER_TEXT[reminder.kind])}, ${reminder.job.title}, ${formatDate(reminder.due)}`}
                style={styles.reminder}>
                <View style={styles.flex}>
                  <AppText variant="body">{t(REMINDER_TEXT[reminder.kind])}</AppText>
                  <AppText variant="footnote" tone="textSecondary">
                    {reminder.job.title} · {reminder.job.businessName}
                  </AppText>
                </View>
                <AppText variant="subhead" weight="600" tabular>
                  {formatDate(reminder.due)}
                </AppText>
              </Tappable>
            </View>
          ))}
          <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
            {t(
              'Ved større byggearbejde har du ret til en gennemgang efter 1 og 5 år. Skriv til virksomheden i god tid.',
            )}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.sectionHead}>
        <AppText variant="title3" accessibilityRole="header">
          {t('Opgaver')}
        </AppText>
        <Button title={t('Tilføj')} icon="plus" size="small" onPress={() => router.push('/min-bolig/ny')} />
      </View>
      {jobs.map((job) => (
        <Tappable
          key={job.id}
          onPress={() => router.push({ pathname: '/min-bolig/ny', params: { id: job.id } })}
          accessibilityLabel={t('{title} hos {name}, {date}, {price}', {
            title: job.title,
            name: job.businessName,
            date: formatDate(job.date),
            price: formatPrice(job.total, market.currency),
          })}
          style={[styles.job, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {job.photos[0] ? (
            <Image
              source={{ uri: job.photos[0] }}
              style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: colors.brandSoft }]}>
              <Icon name={job.category} size={20} color={colors.brand} weight="semibold" />
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="headline" numberOfLines={1}>
              {job.title}
            </AppText>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
              {job.businessName} · {categoryName(job.category)} · {formatDate(job.date)}
            </AppText>
            <View style={styles.badges}>
              {job.deduction !== 'none' ? (
                <Badge
                  label={job.deduction === 'green' ? t('Håndværkerfradrag') : t('Servicefradrag')}
                  tone="success"
                />
              ) : null}
              {job.guaranteeYears ? (
                <Badge label={t('{years} års garanti', { years: job.guaranteeYears })} tone="info" />
              ) : null}
              {job.photos.length > 0 ? (
                <Badge label={t('{count} billeder', { count: job.photos.length })} tone="neutral" icon="photo" />
              ) : null}
            </View>
          </View>
          <AppText variant="subhead" weight="600" tabular>
            {formatPrice(job.total, market.currency)}
          </AppText>
        </Tappable>
      ))}

      <AppText variant="caption" tone="textSecondary" align="center">
        {t('Alt i Min bolig bliver på din telefon og sendes ikke til FixMatch.')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md },
  spaced: { marginTop: Spacing.sm },
  deduction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, minHeight: 52 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  job: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
});
