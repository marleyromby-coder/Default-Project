import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { MatchBadge } from '@/components/business/match-badge';
import { ReviewRating } from '@/components/business/review-rating';
import { CategoryTile } from '@/components/category-tile';
import { LocationPill } from '@/components/location-pill';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ListRow, ListSection } from '@/components/ui/list';
import { Notice } from '@/components/ui/notice';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { IconWell, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { DEFAULT_LOCATION } from '@/data/places';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { availableWhen } from '@/lib/availability';
import { DATA_MODE } from '@/lib/data-source';
import { formatDistance, formatHourly, formatPriceRange } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { summarizeJobPrice } from '@/lib/prices';
import { reviewCount, reviewValue, scoreBusinesses } from '@/lib/ranking';
import { MIN_REVIEWS_FOR_FILTER } from '@/lib/filters';
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

const NEARBY_KM = 25;

export default function HomeScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setLocation } = useApp();
  const { country, market, supported, open } = useMarket();
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
        .filter((x) => x.km <= 10 && reviewCount(x.business) >= MIN_REVIEWS_FOR_FILTER)
        .sort((a, b) => reviewValue(b.business) - reviewValue(a.business) || a.km - b.km)
        .slice(0, 6),
    [local, origin],
  );

  // "Hvem har tid i dag?": businesses nearby that marked free time, today first, then nearest.
  const freeSoon = useMemo(() => {
    const now = new Date();
    return local
      .map((b) => ({ business: b, km: distanceKm(origin, b.coords), when: availableWhen(b, now) }))
      .filter((x) => x.when !== undefined && x.km <= NEARBY_KM)
      .sort((a, b) => (a.when === b.when ? a.km - b.km : a.when === 'today' ? -1 : 1))
      .slice(0, 10);
  }, [local, origin]);

  const promoted = useMemo(() => {
    const ads = local.filter((b) => b.promoted && distanceKm(origin, b.coords) <= NEARBY_KM);
    if (ads.length === 0) return [];
    return ads.map((b) => {
      const peers = local.filter((p) => p.categories.includes(b.categories[0]));
      const scored = scoreBusinesses(peers, origin, state.priorities).find((s) => s.business.id === b.id);
      return { business: b, score: scored?.score ?? 0, km: distanceKm(origin, b.coords) };
    });
  }, [local, origin, state.priorities]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        column,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 96 },
      ]}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.top}>
        <View style={styles.topBar}>
          <Logo />
          <LocationPill />
        </View>

        <View style={styles.hero}>
          <AppText variant="title1">
            {t('Den rette håndværker.')}
            {'\n'}
            <Text style={{ color: colors.brandText }}>{t('Til den rette pris.')}</Text>
          </AppText>
          <AppText variant="callout" tone="textSecondary">
            {t('Se prisen, før du ringer.')}
          </AppText>
        </View>

        <Tappable
          onPress={() => router.push('/soeg')}
          accessibilityRole="search"
          accessibilityLabel={t('Søg efter opgave, fag eller virksomhed')}
          style={[styles.search, { backgroundColor: colors.surface }]}>
          <Icon name="search" size={18} color={colors.textSecondary} weight="semibold" />
          <AppText variant="body" tone="textTertiary" numberOfLines={1}>
            {t('Hvad skal laves? Fx “stoppet afløb”')}
          </AppText>
        </Tappable>

        {state.location.abroad ? (
          // The GPS put the user outside FixMatch's countries (e.g. an App Store reviewer in the
          // US): the app shows the default city instead of an empty list, and says so.
          <Notice
            icon="world"
            text={t('Du er i {country}. FixMatch er kun i {countries} endnu, så vi viser virksomheder i {label}.', {
              country: countryName(state.location.abroad),
              countries: open.map(countryName).join(', ') || countryName(state.location.country ?? 'DK'),
              label: state.location.label,
            })}
            action={{
              label: t('Vælg by'),
              accessibilityLabel: t('Vælg en by'),
              onPress: () => router.push('/placering'),
            }}
            style={styles.notice}
          />
        ) : null}

        {!supported ? (
          <Notice
            icon="world"
            text={t('FixMatch er endnu ikke i {country}. Vi er i {countries}.', {
              country: countryName(state.location.country ?? ''),
              countries: open.map(countryName).join(', '),
            })}
            // One tap back to København, unless that is where the app already is.
            action={
              state.location.label !== DEFAULT_LOCATION.label
                ? {
                    label: t('Vis {label}', { label: DEFAULT_LOCATION.label }),
                    onPress: () => setLocation(DEFAULT_LOCATION),
                  }
                : { label: t('Vælg by'), accessibilityLabel: t('Vælg en by'), onPress: () => router.push('/placering') }
            }
            style={styles.notice}
          />
        ) : DATA_MODE === 'demo' ? (
          <Notice
            text={t('Demoversion: virksomhederne er fiktive eksempler, indtil de rigtige har givet samtykke.')}
            style={styles.notice}
          />
        ) : null}
      </View>

      <Section title={t('Vælg fag')}>
        <View style={styles.grid}>
          {chunk(CATEGORIES, 4).map((row) => (
            <View key={row[0].id} style={styles.gridRow}>
              {row.map((category) => (
                <CategoryTile key={category.id} category={category} nearby={nearbyCount.get(category.id) ?? 0} />
              ))}
            </View>
          ))}
        </View>
      </Section>

      <Tappable
        onPress={() => router.push('/beskriv')}
        accessibilityLabel={t('Beskriv dit problem og dit budget, så matcher vi dig med virksomheder')}
        style={[styles.describe, { backgroundColor: colors.ink }]}>
        <View style={[styles.describeIcon, { backgroundColor: colors.accent }]}>
          <Icon name="chat" size={20} color={colors.ink} weight="semibold" />
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

      {freeSoon.length > 0 ? (
        <Section title={t('Hvem har tid i dag?')} subtitle={t('Virksomheder nær dig, der selv har meldt ledig tid')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {freeSoon.map(({ business, km, when }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={t('{name}, {trade}, {when}, {distance} væk', {
                  name: business.name,
                  trade: getCategory(business.categories[0])?.name ?? '',
                  when: when === 'today' ? t('ledig i dag') : t('ledig i morgen'),
                  distance: formatDistance(km),
                })}
                style={[styles.topCard, { backgroundColor: colors.surface }]}>
                <View style={styles.topBody}>
                  <BusinessMark business={business} size={40} />
                  <AppText variant="caption" tone="textSecondary" weight="600">
                    {getCategory(business.categories[0])?.name}
                  </AppText>
                  <AppText variant="subhead" weight="600" numberOfLines={1}>
                    {business.name}
                  </AppText>
                  <AppText variant="caption" weight="600" tone={when === 'today' ? 'success' : 'textSecondary'}>
                    {when === 'today' ? t('Ledig i dag') : t('Ledig i morgen')}
                  </AppText>
                  <AppText variant="caption" tone="textSecondary">
                    {formatDistance(km)}
                  </AppText>
                </View>
              </Tappable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

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
                style={[styles.jobCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.jobIcon, { backgroundColor: colors.brandSoft }]}>
                  <Icon name={categoryId} size={16} color={colors.brand} weight="semibold" />
                </View>
                <AppText variant="subhead" weight="600" numberOfLines={2} style={styles.jobName}>
                  {job.name}
                </AppText>
                <AppText variant="subhead" weight="600" tabular numberOfLines={1}>
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

      <Section title={t('Værktøjer')}>
        <View style={styles.tools}>
          <ListSection>
            <ListRow icon="siren" title={t('Akut hjælp – døgnvagt')} onPress={() => router.push('/akut')} />
            <ListRow icon="receipt" title={t('Tilbudstjek')} onPress={() => router.push('/tilbudstjek')} />
            <ListRow icon="leaf" title={t('Grøn guide')} onPress={() => router.push('/groen-guide')} />
            <ListRow
              icon="warning"
              title={t('Advarselslampe i bilen')}
              onPress={() => router.push('/advarselslamper')}
            />
            <ListRow icon="people" title={t('Naborabat')} onPress={() => router.push('/faelles')} />
          </ListSection>
        </View>
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
                style={[styles.featured, { backgroundColor: colors.surface }]}>
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
                  <ReviewRating summary={business.reviewSummary} />
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

      {topRated.length > 0 ? (
        <Section
          title={t('Bedst anmeldt nær dig')}
          subtitle={t('Flest stjerner fra brugere via FixMatch inden for {distance}', {
            distance: formatDistance(10),
          })}>
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
                style={[styles.topCard, { backgroundColor: colors.surface }]}>
                <View style={styles.topBody}>
                  <BusinessMark business={business} size={40} />
                  <AppText variant="caption" tone="textSecondary" weight="600">
                    {getCategory(business.categories[0])?.name}
                  </AppText>
                  <AppText variant="subhead" weight="600" numberOfLines={1}>
                    {business.name}
                  </AppText>
                  <ReviewRating summary={business.reviewSummary} />
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
        <View style={[styles.steps, { backgroundColor: colors.surface }]}>
          <Step number={1} title={t('Vælg fag eller opgave')} text={t('VVS, el, tømrer, murer, mekaniker og flere.')} />
          <Step
            number={2}
            title={t('Sammenlign')}
            text={t('Pris {tax}, afstand og anmeldelser – side om side.', { tax: taxNote(market) })}
          />
          <Step
            number={3}
            title={t('Ring direkte')}
            text={t('Ingen mellemled og ingen gebyrer. Du aftaler prisen direkte.')}
          />
        </View>
      </Section>
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
      <AppText variant="title1" serif style={[styles.stepNumber, { color: colors.brand }]} accessibilityRole="none">
        {number}
      </AppText>
      <View style={styles.flex}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead" tone="textSecondary">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.xxl },
  top: { gap: Spacing.md },
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
    minHeight: 48,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  describe: {
    marginHorizontal: ScreenPadding,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.lg,
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
  notice: { marginHorizontal: ScreenPadding },
  flex: { flex: 1 },
  section: { gap: Spacing.md },
  sectionHeader: { paddingHorizontal: ScreenPadding, gap: 2 },
  grid: { paddingHorizontal: ScreenPadding, gap: Spacing.sm },
  gridRow: { flexDirection: 'row', gap: Spacing.sm },
  carousel: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  jobCard: {
    width: 156,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  jobIcon: {
    width: IconWell.row.size,
    height: IconWell.row.size,
    borderRadius: IconWell.row.radius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  // Room for two lines, so the prices line up across the cards.
  jobName: { minHeight: 40 },
  tools: { paddingHorizontal: ScreenPadding },
  featured: { width: 290, borderRadius: Radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  featuredBody: { padding: Spacing.md, gap: Spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  topCard: { width: 210, borderRadius: Radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  topBody: { padding: Spacing.md, gap: Spacing.xs },
  steps: {
    marginHorizontal: ScreenPadding,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNumber: { width: 22, textAlign: 'center' },
});
