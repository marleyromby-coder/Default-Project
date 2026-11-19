import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { ProblemPhotos } from '@/components/problem-photos';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { IconWell, Radius, ScreenPadding, Shadows, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { EMERGENCIES, type Emergency } from '@/data/emergencies';
import { useIsDark, useTheme, useTradeColor } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { countryOf, timeZoneOf } from '@/lib/business-text';
import { callBusiness } from '@/lib/contact';
import { formatDistance } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { isOpenNow } from '@/lib/opening-hours';
import type { Business } from '@/lib/types';
import { useApp, useMarket } from '@/state/app-state';
import { t } from '@/i18n';

/**
 * "Akut hjælp": pick what happened, do the first things right (shut off the water, cut the
 * power), call the nearest døgnvagt with one tap, and take pictures for the insurance.
 */
export default function EmergencyScreen() {
  const colors = useTheme();
  const shadows = Shadows[useIsDark() ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { country, market } = useMarket();
  const params = useLocalSearchParams<{ type?: string }>();
  const [picked, setPicked] = useState<string | undefined>(params.type);
  const emergency = EMERGENCIES.find((e) => e.id === picked);
  const origin = state.location.coords;

  /** Businesses in the trade that answer now: døgnvagt first, then open ones, nearest first. */
  const helpers = (item: Emergency): { business: Business; km: number }[] => {
    const now = new Date();
    return state.businesses
      .filter((b) => countryOf(b) === country && b.categories.includes(item.category))
      .filter((b) => b.emergency || isOpenNow(b.hours, now, timeZoneOf(b)))
      .map((b) => ({ business: b, km: distanceKm(origin, b.coords) }))
      .filter((x) => x.km <= Math.max(x.business.serviceRadiusKm, 15))
      .sort((a, b) => (a.business.emergency === b.business.emergency ? a.km - b.km : a.business.emergency ? -1 : 1))
      .slice(0, 3);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t('Akut hjælp') }} />

      <Tappable
        onPress={() => Linking.openURL(`tel:${market.emergencyNumber}`).catch(() => undefined)}
        accessibilityRole="button"
        accessibilityLabel={t('Ring {number} ved fare for liv eller brand', { number: market.emergencyNumber })}
        style={[styles.danger, { backgroundColor: colors.coralSoft }]}>
        <View style={[styles.dangerIcon, { backgroundColor: colors.coral }]}>
          <Icon name="siren" size={18} color={colors.onCoral} weight="semibold" />
        </View>
        <AppText variant="subhead" weight="700" tone="coralText" style={styles.flex}>
          {t('Fare for liv eller brand? Ring {number}.', { number: market.emergencyNumber })}
        </AppText>
        <Icon name="phone" size={18} color={colors.coralText} weight="semibold" />
      </Tappable>

      {!emergency ? (
        <>
          <AppText variant="title2">{t('Hvad er der sket?')}</AppText>
          <View style={styles.grid}>
            {EMERGENCIES.map((item) => (
              <Tappable
                key={item.id}
                onPress={() => setPicked(item.id)}
                accessibilityLabel={t(item.title)}
                style={[styles.tile, { backgroundColor: colors.surface, boxShadow: shadows.card }]}>
                <EmergencyIcon item={item} />
                <AppText variant="subhead" display weight="700" numberOfLines={2}>
                  {t(item.title)}
                </AppText>
              </Tappable>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.head}>
            <EmergencyIcon item={emergency} />
            <AppText variant="title2" style={styles.flex}>
              {t(emergency.title)}
            </AppText>
            <Button title={t('Skift')} variant="plain" size="small" onPress={() => setPicked(undefined)} />
          </View>

          {emergency.danger ? (
            <View style={[styles.dangerBox, { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}>
              <Icon name="warning" size={18} color={colors.coralText} weight="semibold" />
              <AppText variant="subhead" weight="600" tone="coralText" style={styles.flex}>
                {t(emergency.danger)}
              </AppText>
            </View>
          ) : null}

          <Card>
            <CardTitle title={t('Gør det her først')} />
            {emergency.steps.map((step, index) => (
              <View key={step} style={styles.step}>
                <View style={[styles.number, { backgroundColor: colors.brandSoft }]}>
                  <AppText variant="footnote" display weight="800" style={{ color: colors.brandText }}>
                    {index + 1}
                  </AppText>
                </View>
                <AppText variant="subhead" style={styles.flex}>
                  {t(step)}
                </AppText>
              </View>
            ))}
          </Card>

          <Card>
            <CardTitle title={t('Ring til nærmeste døgnvagt')} />
            {helpers(emergency).length === 0 ? (
              <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
                {t('Ingen i nærheden har døgnvagt eller åbent lige nu. Se alle {plural} i stedet.', {
                  plural: (getCategory(emergency.category)?.plural ?? '').toLowerCase(),
                })}
              </AppText>
            ) : (
              helpers(emergency).map(({ business, km }) => (
                <Tappable
                  key={business.id}
                  onPress={() => callBusiness(business)}
                  accessibilityLabel={t('Ring til {name}, {distance} væk', {
                    name: business.name,
                    distance: formatDistance(km),
                  })}
                  style={styles.helper}>
                  <BusinessMark business={business} size={40} />
                  <View style={styles.flex}>
                    <AppText variant="headline" display numberOfLines={1}>
                      {business.name}
                    </AppText>
                    <AppText variant="footnote" tone="textSecondary">
                      {[business.emergency ? t('Døgnvagt') : t('Åben nu'), formatDistance(km)].join(' · ')}
                    </AppText>
                  </View>
                  <View style={[styles.callButton, { backgroundColor: colors.brandStrong }]}>
                    <Icon name="phone" size={16} color={colors.onBrand} weight="semibold" />
                  </View>
                </Tappable>
              ))
            )}
            <Button
              title={t('Se alle med døgnvagt')}
              variant="plain"
              size="small"
              onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: emergency.category, akut: '1' } })}
            />
            <AppText variant="caption" tone="textSecondary">
              {t('Spørg altid om prisen for akut udkald, før de kører. Den står også på virksomhedens side.')}
            </AppText>
          </Card>

          {emergency.insurance ? (
            <>
              <ProblemPhotos />
              <Notice
                text={t(
                  'Ring til dit forsikringsselskab inden for 24 timer, og send dem billederne. Billederne bliver på din telefon, og du kan sende dem til håndværkeren fra virksomhedens side.',
                )}
              />
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

/** The emergency's icon on a tint of its trade's colour (water on blue, power on yellow …). */
function EmergencyIcon({ item }: { item: Emergency }) {
  const trade = useTradeColor(item.category);
  return (
    <View style={[styles.well, { backgroundColor: trade.soft }]}>
      <Icon name={item.icon} size={20} color={trade.onSoft} weight="semibold" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  dangerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: {
    width: '46%',
    flexGrow: 1,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    borderRadius: Radius.card,
    borderCurve: 'continuous',
    // Icon at the top, label at the bottom, like the trade tiles on Find.
    justifyContent: 'space-between',
    minHeight: 112,
  },
  well: {
    width: IconWell.card.size,
    height: IconWell.card.size,
    borderRadius: IconWell.card.radius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dangerBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  step: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, alignItems: 'flex-start' },
  number: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  spaced: { marginTop: Spacing.sm },
  helper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, minHeight: 56 },
  callButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
