import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { MatchBadge } from '@/components/business/match-badge';
import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { CategoryTile } from '@/components/category-tile';
import { LocationPill } from '@/components/location-pill';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { tradeTone } from '@/constants/trade-colors';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useGps, GPS_MESSAGES } from '@/hooks/use-gps';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { DATA_MODE } from '@/lib/data-source';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { showDialog } from '@/lib/dialog';
import { formatDistance, formatHourly, formatPriceRange } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { summarizeJobPrice } from '@/lib/prices';
import { reviewValue, scoreBusinesses } from '@/lib/ranking';
import type { CategoryId } from '@/lib/types';
import { t } from '@/i18n';
import { countryOf, currencyOf } from '@/lib/business-text';
import { countryName, taxNote } from '@/lib/markets';
import { useApp, useMarket } from '@/state/app-state';

const POPULAR_JOBS: [CategoryId, string][] = [
  ['vvs', 'stoppet-afloeb'],
  ['elektriker', 'ladestander'],
  ['mekaniker', 'stort-service'],
  ['murer', 'fliser'],
  ['toemrer', 'vindue'],
  ['laasesmed', 'doeroplukning'],
  ['tagdaekker', 'tagrender'],
  ['maler', 'vaerelse'],
];

const URGENT: { label: string; category: CategoryId; icon: IconName }[] = [
  { label: t('Vandskade'), category: 'vvs', icon: 'vvs' },
  { label: t('Låst ude'), category: 'laasesmed', icon: 'laasesmed' },
  { label: t('Strømsvigt'), category: 'elektriker', icon: 'elektriker' },
];

const NEARBY_KM = 25;

export default function HomeScreen() {
  const colors = useTheme();
  const scheme = useIsDark() ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { country, market, supported, open } = useMarket();
  const { locate, busy } = useGps();
  const origin = state.location.coords;
  // Only this country's businesses: prices are never compared across currencies.
  const local = useMemo(() => state.businesses.filter((b) => countryOf(b) === country), [state.businesses, country]);

  const nearbyCount = useMemo(() => {
    const counts = new Map<CategoryId, number>();
    for (const b of local) {
      if (distanceKm(origin, b.coords) > NEARBY_KM) continue;
      for (const c of b.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return counts;
  }, [local, origin]);

  const topRated = useMemo(
    () =>
      local
        .map((b) => ({ business: b, km: distanceKm(origin, b.coords) }))
        .filter((x) => x.km <= 10 && x.business.trustpilot)
        .sort((a, b) => reviewValue(b.business) - reviewValue(a.business))
        .slice(0, 6),
    [local, origin],
  );

  const promoted = useMemo(() => {
    const ads = local.filter((b) => b.promoted && distanceKm(origin, b.coords) <= NEARBY_KM);
    if (ads.length === 0) return [];
    return ads.map((b) => {
      const peers = local.filter((p) => p.categories.includes(b.categories[0]));
      const scored = scoreBusinesses(peers, origin, state.priorities).find((s) => s.business.id === b.id);
      return { business: b, score: scored?.score ?? 0, km: distanceKm(origin, b.coords) };
    });
  }, [local, origin, state.priorities]);

  async function useMyLocation() {
    const result = await locate();
    if (result !== 'ok') showDialog(GPS_MESSAGES[result].title, GPS_MESSAGES[result].message);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 96 },
      ]}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.topBar}>
        <Logo />
        <LocationPill />
      </View>

      <View style={styles.hero}>
        <AppText variant="title1">{t('Find den rette håndværker')}</AppText>
        <AppText variant="callout" tone="textSecondary">
          {TRUSTPILOT_ENABLED
            ? t('Sammenlign pris, afstand og Trustpilot-anmeldelser hos lokale virksomheder – og ring direkte.')
            : t('Sammenlign pris og afstand hos lokale virksomheder – og ring direkte.')}
        </AppText>
      </View>

      <Tappable
        onPress={() => router.push('/soeg')}
        accessibilityRole="search"
        accessibilityLabel={t('Søg efter opgave, fag eller virksomhed')}
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="search" size={18} color={colors.textSecondary} weight="semibold" />
        <AppText variant="body" tone="textTertiary" numberOfLines={1}>
          {t('Hvad skal laves? Fx “stoppet afløb”')}
        </AppText>
      </Tappable>

      <Tappable
        onPress={() => router.push('/beskriv')}
        accessibilityLabel={t('Beskriv dit problem og dit budget, så matcher vi dig med virksomheder')}
        style={[styles.describe, { backgroundColor: colors.ink }]}>
        <View style={[styles.describeIcon, { backgroundColor: colors.brand }]}>
          <Icon name="wand" size={20} color={colors.onBrand} weight="semibold" />
        </View>
        <View style={styles.flex}>
          <AppText variant="headline" style={{ color: colors.onInk }}>
            {t('Beskriv dit problem')}
          </AppText>
          <AppText variant="footnote" style={{ color: colors.onInkSoft }}>
            {t('Skriv hvad der er galt og dit budget – vi finder dem, der passer.')}
          </AppText>
        </View>
        <Icon name="chevronRight" size={16} color={colors.onInkSoft} weight="semibold" />
      </Tappable>

      {state.location.source === 'default' ? (
        <View style={[styles.notice, { backgroundColor: colors.infoSoft }]}>
          <Icon name="info" size={16} color={colors.info} weight="semibold" />
          <AppText variant="footnote" style={[styles.flex, { color: colors.text }]}>
            {t('Afstande regnes fra {label}. Brug din placering for at se de nærmeste.', {
              label: state.location.label,
            })}
          </AppText>
          <Tappable
            onPress={useMyLocation}
            disabled={busy}
            accessibilityLabel={t('Brug min placering')}
            style={styles.noticeAction}>
            <AppText variant="footnote" weight="700" style={{ color: colors.info }}>
              {busy ? t('Finder…') : t('Brug placering')}
            </AppText>
          </Tappable>
        </View>
      ) : null}

      {!supported ? (
        <View style={[styles.notice, { backgroundColor: colors.brandSoft }]}>
          <Icon name="globe" size={16} color={colors.brandText} weight="semibold" />
          <AppText variant="footnote" style={[styles.flex, { color: colors.text }]}>
            {t('FixMatch er endnu ikke i {country}. Vi er i {countries}.', {
              country: countryName(state.location.country ?? ''),
              countries: open.map(countryName).join(', '),
            })}
          </AppText>
          <Tappable
            onPress={() => router.push('/placering')}
            accessibilityLabel={t('Vælg en by')}
            style={styles.noticeAction}>
            <AppText variant="footnote" weight="700" tone="brandText">
              {t('Vælg by')}
            </AppText>
          </Tappable>
        </View>
      ) : null}

      {DATA_MODE === 'demo' ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <Icon name="info" size={16} color={colors.warning} weight="semibold" />
          <AppText variant="footnote" style={[styles.flex, { color: colors.text }]}>
            {t('Demoversion: virksomhederne er fiktive eksempler, indtil de rigtige har givet samtykke.')}
          </AppText>
        </View>
      ) : null}

      <Section title={t('Vælg fag')}>
        <View style={styles.grid}>
          {chunk(CATEGORIES, 2).map((row) => (
            <View key={row[0].id} style={styles.gridRow}>
              {row.map((category) => (
                <CategoryTile key={category.id} category={category} nearby={nearbyCount.get(category.id) ?? 0} />
              ))}
            </View>
          ))}
        </View>
      </Section>

      <Section
        title={t('Akut hjælp – døgnvagt')}
        subtitle={t('Ved fare for liv eller brand: ring {number}.', { number: market.emergencyNumber })}>
        <View style={styles.urgentRow}>
          {URGENT.map((item) => (
            <Tappable
              key={item.label}
              onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: item.category, akut: '1' } })}
              accessibilityLabel={t('{label}: vis virksomheder med døgnvagt', { label: item.label })}
              style={[styles.urgent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.urgentIcon, { backgroundColor: colors.warningSoft }]}>
                <Icon name={item.icon} size={18} color={colors.warning} weight="semibold" />
              </View>
              <AppText variant="subhead" weight="600" numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {item.label}
              </AppText>
            </Tappable>
          ))}
        </View>
      </Section>

      <Section
        title={t('Hvad koster det typisk?')}
        subtitle={t('Prisintervaller {tax} fra virksomhederne i appen', { tax: taxNote(market) })}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {POPULAR_JOBS.map(([categoryId, jobId]) => {
            const category = getCategory(categoryId);
            const job = category?.jobs.find((j) => j.id === jobId);
            if (!category || !job) return null;
            const price = summarizeJobPrice(job, local, market);
            return (
              <Tappable
                key={jobId}
                onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: categoryId, job: jobId } })}
                accessibilityLabel={t('{name}, typisk {priceRange}. Vis {plural}', {
                  name: job.name,
                  priceRange: formatPriceRange(price.min, price.max, price.unit, price.currency),
                  plural: category.plural,
                })}
                style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.jobIcon, { backgroundColor: tradeTone(categoryId, scheme).soft }]}>
                  <Icon name={categoryId} size={16} color={tradeTone(categoryId, scheme).onSoft} weight="semibold" />
                </View>
                <AppText variant="subhead" weight="600" numberOfLines={2}>
                  {job.name}
                </AppText>
                <AppText variant="footnote" weight="700" tabular numberOfLines={1}>
                  {formatPriceRange(price.min, price.max, price.unit, price.currency)}
                </AppText>
                <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
                  {category.name}
                </AppText>
              </Tappable>
            );
          })}
        </ScrollView>
      </Section>

      {promoted.length > 0 ? (
        <Section title={t('Fremhævet')} subtitle={t('Betalt annonce – påvirker ikke rækkefølgen i søgeresultater')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {promoted.map(({ business, score, km }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={t('Annonce: {name}, {distance} væk', {
                  name: business.name,
                  distance: formatDistance(km),
                })}
                style={[styles.featured, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.featuredBody}>
                  <View style={styles.rowBetween}>
                    <BusinessMark business={business} size={44} />
                    <View style={styles.flex}>
                      <AppText variant="headline" numberOfLines={1}>
                        {business.name}
                      </AppText>
                      <Badge label={t('Annonce')} tone="neutral" />
                    </View>
                    <MatchBadge score={score} />
                  </View>
                  <TrustpilotRating trustpilot={business.trustpilot} />
                  <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                    {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business))} ·{' '}
                    {formatDistance(km)}
                  </AppText>
                </View>
              </Tappable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {TRUSTPILOT_ENABLED && topRated.length > 0 ? (
        <Section
          title={t('Bedst anmeldt nær dig')}
          subtitle={t('Højeste TrustScore inden for {distance}', { distance: formatDistance(10) })}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {topRated.map(({ business, km }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={t('{name}, {name2}, {distance} væk', {
                  name: business.name,
                  name2: getCategory(business.categories[0])?.name,
                  distance: formatDistance(km),
                })}
                style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.topBody}>
                  <BusinessMark business={business} size={40} />
                  <AppText variant="caption" tone="textSecondary" weight="600">
                    {getCategory(business.categories[0])?.name}
                  </AppText>
                  <AppText variant="subhead" weight="600" numberOfLines={1}>
                    {business.name}
                  </AppText>
                  <TrustpilotRating trustpilot={business.trustpilot} />
                  <AppText variant="caption" tone="textSecondary">
                    {formatDistance(km)}
                  </AppText>
                </View>
              </Tappable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      <Section title={t('Sådan virker FixMatch')}>
        <View style={[styles.steps, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Step number={1} title={t('Vælg fag eller opgave')} text={t('VVS, el, tømrer, murer, mekaniker og flere.')} />
          <Step
            number={2}
            title={t('Sammenlign')}
            text={
              TRUSTPILOT_ENABLED
                ? t('Pris {tax}, afstand og TrustScore – side om side.', { tax: taxNote(market) })
                : t('Pris {tax} og afstand – side om side.', { tax: taxNote(market) })
            }
          />
          <Step
            number={3}
            title={t('Ring direkte')}
            text={t('Ingen mellemled og ingen gebyrer. Du aftaler prisen direkte.')}
          />
        </View>
      </Section>

      <View style={styles.footerLinks}>
        <FooterLink label={t('Sådan rangerer vi')} slug="rangering" />
        <FooterLink label={t('Om priserne')} slug="priser" />
        {TRUSTPILOT_ENABLED ? <FooterLink label={t('Om anmeldelser')} slug="anmeldelser" /> : null}
      </View>
    </ScrollView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="title3" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" tone="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Step({ number, title, text }: { number: number; title: string; text: string }) {
  const colors = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, { backgroundColor: colors.brandStrong }]}>
        <AppText variant="subhead" weight="700" tone="onBrand">
          {number}
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead" tone="textSecondary">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function FooterLink({ label, slug }: { label: string; slug: string }) {
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/info/[slug]', params: { slug } })}
      accessibilityRole="link"
      style={styles.footerLink}>
      <AppText variant="footnote" tone="brandText" weight="600">
        {label}
      </AppText>
    </Tappable>
  );
}

function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ScreenPadding,
    gap: Spacing.md,
  },
  hero: { paddingHorizontal: ScreenPadding, gap: Spacing.xs },
  search: {
    marginHorizontal: ScreenPadding,
    marginTop: -Spacing.sm,
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  describe: {
    marginHorizontal: ScreenPadding,
    marginTop: -Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  describeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    marginHorizontal: ScreenPadding,
    marginTop: -Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noticeAction: { minHeight: 36, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  flex: { flex: 1 },
  section: { gap: Spacing.md },
  sectionHeader: { paddingHorizontal: ScreenPadding, gap: 2 },
  grid: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  gridRow: { flexDirection: 'row', gap: Spacing.md },
  urgentRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: ScreenPadding },
  urgent: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  urgentIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  carousel: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  jobCard: {
    width: 156,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  jobIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  featured: { width: 290, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  featuredBody: { padding: Spacing.md, gap: Spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  topCard: { width: 210, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  topBody: { padding: Spacing.md, gap: 3 },
  steps: {
    marginHorizontal: ScreenPadding,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: ScreenPadding,
  },
  footerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
});
