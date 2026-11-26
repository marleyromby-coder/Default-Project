import { router } from 'expo-router';
import { type ReactNode, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityBadge } from '@/components/business/availability-badge';
import { BusinessMark } from '@/components/business/business-mark';
import { MatchBadge } from '@/components/business/match-badge';
import { PriceText } from '@/components/business/price-text';
import { ReviewRating } from '@/components/business/review-rating';
import { TradeTile } from '@/components/category-tile';
import { HeroPanel } from '@/components/hero-panel';
import { Logo } from '@/components/logo';
import { StatusBarScrim } from '@/components/status-bar-scrim';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, Divider } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { ListRow, ListSection } from '@/components/ui/list';
import { Notice } from '@/components/ui/notice';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { IconWell, Radius, ScreenPadding, Spacing, TradeColors } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { DEFAULT_LOCATION } from '@/data/places';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { availableWhen } from '@/lib/availability';
import { DATA_MODE } from '@/lib/data-source';
import { showDialog } from '@/lib/dialog';
import { formatDistance, formatPrice, formatPriceRange, speakablePrice } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { lowestHourlyByTrade, summarizeJobPrice } from '@/lib/prices';
import { reviewCount, reviewValue, scoreBusinesses } from '@/lib/ranking';
import { reviewRatingLabel } from '@/lib/review-label';
import { MIN_REVIEWS_FOR_FILTER } from '@/lib/filters';
import type { Business, CategoryId } from '@/lib/types';
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
  const scheme = useIsDark() ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { state, setLocation, setStartTrade } = useApp();
  const { country, market, supported, open } = useMarket();
  const origin = state.location.coords;
  const radius = state.filters.maxDistanceKm;
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

  // "fra 560 kr." under each trade: the lowest hourly price within the user's distance filter,
  // so the business behind it is in that trade's results.
  const fromPrices = useMemo(() => lowestHourlyByTrade(local, origin, market, radius), [local, origin, market, radius]);

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

  // The trade chosen at the end of the introduction: open its list once, on top of Find.
  const startTrade = state.startTrade;
  useEffect(() => {
    if (!startTrade) return;
    setStartTrade(undefined);
    if (getCategory(startTrade)) router.push({ pathname: '/kategori/[id]', params: { id: startTrade } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTrade]);

  const demo = supported && DATA_MODE === 'demo';
  const demoText = t('Demoversion: virksomhederne er fiktive eksempler, indtil de rigtige har givet samtykke.');
  const where =
    radius === null
      ? t('{place} · hele landet', { place: state.location.label })
      : t('{place} · inden for {distance}', { place: state.location.label, distance: formatDistance(radius) });

  return (
    <View style={styles.flex}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        contentInsetAdjustmentBehavior="never">
        <View>
          {/* Panel colour above the panel, so pulling the page down shows no gap under the status bar. */}
          <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: colors.panel }]} />
          <HeroPanel contentStyle={styles.panel}>
            <View style={styles.topBar}>
              <Logo onPanel />
              {demo ? (
                <Tappable
                  onPress={() => showDialog(t('Demoversion'), demoText)}
                  accessibilityLabel={demoText}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
                  <Badge label={t('Demoversion')} tone="panel" icon="info" accessibilityLabel={demoText} />
                </Tappable>
              ) : null}
            </View>

            <AppText variant="largeTitle" tone="onPanel" style={styles.title}>
              {t('Se prisen, før du ringer')}
              <Text style={{ color: colors.accent }}>.</Text>
            </AppText>

            <Card elevation="raised" padded={false} style={styles.search}>
              <SearchRow
                icon="search"
                label={t('Hvad skal laves?')}
                value={t('Fx stoppet afløb')}
                placeholder
                onPress={() => router.push('/soeg')}
                accessibilityLabel={t('Søg efter opgave, fag eller virksomhed')}
              />
              <Divider inset={Spacing.md + IconWell.card.size + Spacing.md} />
              <SearchRow
                icon="pin"
                label={t('Hvor?')}
                value={where}
                onPress={() => router.push('/placering')}
                accessibilityLabel={t('Placering: {label}. Skift placering', { label: state.location.label })}
              />
            </Card>

            <Button
              title={t('Sammenlign priser')}
              variant="sun"
              size="large"
              trailingIcon="arrowRight"
              block
              onPress={() => router.push('/soeg')}
              accessibilityHint={t('Søg efter opgave, fag eller virksomhed')}
            />
          </HeroPanel>
        </View>

        {state.location.abroad || !supported ? (
          <View style={[styles.notices, column]}>
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
                    : {
                        label: t('Vælg by'),
                        accessibilityLabel: t('Vælg en by'),
                        onPress: () => router.push('/placering'),
                      }
                }
              />
            ) : null}
          </View>
        ) : null}

        <Section
          title={t('Vælg fag')}
          trailing={
            <AppText variant="footnote" tone="textSecondary">
              {t('Timepris {tax}', { tax: taxNote(market) })}
            </AppText>
          }>
          <View style={[styles.grid, column]}>
            {chunk(CATEGORIES, 4).map((row) => (
              <View key={row[0].id} style={styles.gridRow}>
                {row.map((category) => (
                  <TradeTile
                    key={category.id}
                    category={category}
                    fromPrice={fromPrices[category.id]}
                    nearby={nearbyCount.get(category.id) ?? 0}
                  />
                ))}
              </View>
            ))}
          </View>
        </Section>

        <View style={column}>
          <Tappable
            onPress={() => router.push('/beskriv')}
            accessibilityLabel={t('Beskriv dit problem og dit budget, så matcher vi dig med virksomheder')}
            style={[styles.describe, { backgroundColor: colors.accentSoft }]}>
            <View style={[styles.describeIcon, { backgroundColor: colors.accent }]}>
              <Icon name="chat" size={20} color={colors.onAccent} weight="semibold" />
            </View>
            <View style={styles.flex}>
              <AppText variant="headline" display>
                {t('Beskriv dit problem')}
              </AppText>
              <AppText variant="footnote" tone="accentText">
                {t('Skriv hvad der er galt og dit budget – vi finder dem, der passer.')}
              </AppText>
            </View>
            <Icon name="chevronRight" size={16} color={colors.accentText} weight="semibold" />
          </Tappable>
        </View>

        {freeSoon.length > 0 ? (
          <Section title={t('Hvem har tid i dag?')} subtitle={t('Virksomheder nær dig, der selv har meldt ledig tid')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {freeSoon.map(({ business, km, when }) => (
                <PersonCard
                  key={business.id}
                  business={business}
                  km={km}
                  accessibilityLabel={t('{name}, {trade}, {when}, {distance} væk', {
                    name: business.name,
                    trade: getCategory(business.categories[0])?.name ?? '',
                    when: when === 'today' ? t('ledig i dag') : t('ledig i morgen'),
                    distance: formatDistance(km),
                  })}>
                  <AvailabilityBadge business={business} />
                </PersonCard>
              ))}
            </ScrollView>
          </Section>
        ) : null}

        <Section
          title={t('Hvad koster det typisk?')}
          subtitle={t('Prisintervaller {tax} fra virksomhederne i appen', { tax: taxNote(market) })}
          trailing={
            <Tappable
              onPress={() => router.push('/prisguide')}
              accessibilityRole="link"
              accessibilityLabel={t('Se hele prisguiden')}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <AppText variant="subhead" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
                {t('Se alle')}
              </AppText>
            </Tappable>
          }>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {POPULAR_JOBS.map(([categoryId, jobId]) => {
              const category = getCategory(categoryId);
              const job = category?.jobs.find((j) => j.id === jobId);
              if (!category || !job) return null;
              const price = summarizeJobPrice(job, local, market);
              const trade = TradeColors[scheme][categoryId];
              return (
                <Tappable
                  key={jobId}
                  onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: categoryId, job: jobId } })}
                  accessibilityLabel={t('{name}, typisk {priceRange}. Vis {plural}', {
                    name: job.name,
                    priceRange: formatPriceRange(price.min, price.max, price.unit, price.currency),
                    plural: category.plural,
                  })}
                  style={styles.cardTap}>
                  <Card style={styles.jobCard}>
                    <View style={[styles.jobIcon, { backgroundColor: trade.soft }]}>
                      <Icon name={categoryId} size={17} color={trade.onSoft} weight="semibold" />
                    </View>
                    <AppText variant="subhead" weight="600" numberOfLines={2} style={styles.jobName}>
                      {job.name}
                    </AppText>
                    {/* Two lines, so the unit ("pr. m²", "pr. stk.") is never the part that is cut. */}
                    <AppText variant="headline" display weight="800" numberOfLines={2} maxFontSizeMultiplier={1.3}>
                      {formatPriceRange(price.min, price.max, price.unit, price.currency)}
                    </AppText>
                    <AppText variant="caption" tone="textSecondary" numberOfLines={1}>
                      {category.name}
                    </AppText>
                  </Card>
                </Tappable>
              );
            })}
          </ScrollView>
        </Section>

        <Section title={t('Værktøjer')}>
          <View style={[styles.tools, column]}>
            <ListSection>
              <ListRow
                icon="siren"
                title={t('Akut hjælp – døgnvagt')}
                tint={{ background: colors.coralSoft, color: colors.coralText }}
                onPress={() => router.push('/akut')}
              />
              <ListRow icon="receipt" title={t('Tilbudstjek')} onPress={() => router.push('/tilbudstjek')} />
              <ListRow icon="leaf" title={t('Grøn guide')} onPress={() => router.push('/groen-guide')} />
              <ListRow
                icon="warning"
                title={t('Advarselslampe i bilen')}
                tint={{ background: TradeColors[scheme].mekaniker.soft, color: TradeColors[scheme].mekaniker.onSoft }}
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
                  accessibilityLabel={[
                    t('Annonce: {name}, {distance} væk', { name: business.name, distance: formatDistance(km) }),
                    t('fra {price} i timen', {
                      price: speakablePrice(formatPrice(business.pricing.hourlyMin, currencyOf(business))),
                    }),
                    reviewRatingLabel(business.reviewSummary),
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  style={styles.cardTap}>
                  <Card style={styles.featured}>
                    <View style={styles.rowBetween}>
                      <BusinessMark business={business} size={44} />
                      <View style={styles.flex}>
                        <AppText variant="headline" display numberOfLines={1}>
                          {business.name}
                        </AppText>
                        <Badge label={t('Annonce')} tone="neutral" />
                      </View>
                      <MatchBadge score={score} />
                    </View>
                    <ReviewRating summary={business.reviewSummary} />
                    <View style={styles.hourly}>
                      <AppText variant="footnote" tone="textSecondary" maxFontSizeMultiplier={1.3}>
                        {t('fra')}
                      </AppText>
                      <PriceText
                        value={business.pricing.hourlyMin}
                        currency={currencyOf(business)}
                        variant="headline"
                        style={styles.flexShrink}
                      />
                      <AppText variant="footnote" tone="textSecondary" numberOfLines={1} maxFontSizeMultiplier={1.3}>
                        {t('pr. time')} · {formatDistance(km)}
                      </AppText>
                    </View>
                  </Card>
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
                <PersonCard
                  key={business.id}
                  business={business}
                  km={km}
                  accessibilityLabel={[
                    t('{name}, {name2}, {distance} væk', {
                      name: business.name,
                      name2: getCategory(business.categories[0])?.name,
                      distance: formatDistance(km),
                    }),
                    reviewRatingLabel(business.reviewSummary),
                  ]
                    .filter(Boolean)
                    .join(', ')}>
                  <ReviewRating summary={business.reviewSummary} />
                </PersonCard>
              ))}
            </ScrollView>
          </Section>
        ) : null}

        <Section title={t('Sådan virker FixMatch')}>
          <View style={column}>
            <Card style={styles.steps}>
              <Step
                number={1}
                title={t('Vælg fag eller opgave')}
                text={t('VVS, el, tømrer, murer, mekaniker og flere.')}
              />
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
            </Card>
          </View>
        </Section>
      </ScrollView>
      <StatusBarScrim color={colors.panel} />
    </View>
  );
}

interface SearchRowProps {
  icon: IconName;
  label: string;
  value: string;
  /** The value is an example, not something chosen (lighter text). */
  placeholder?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/** A row in the search card: "Hvad skal laves?" or "Hvor?", with what is chosen below. */
function SearchRow({ icon, label, value, placeholder, onPress, accessibilityLabel }: SearchRowProps) {
  const colors = useTheme();
  return (
    <Tappable onPress={onPress} accessibilityLabel={accessibilityLabel} pressedOpacity={0.7} style={styles.searchRow}>
      <View style={[styles.searchIcon, { backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} size={18} color={colors.brand} weight="semibold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="body" tone={placeholder ? 'textTertiary' : 'text'} weight="500" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </Tappable>
  );
}

interface PersonCardProps {
  business: Business;
  km: number;
  accessibilityLabel: string;
  children?: ReactNode;
}

/** A business in a carousel on Find: mark, name, trade and distance, and one line of extra. */
function PersonCard({ business, km, accessibilityLabel, children }: PersonCardProps) {
  return (
    <Tappable
      onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
      accessibilityLabel={accessibilityLabel}
      style={styles.cardTap}>
      <Card style={styles.person}>
        <View style={styles.rowBetween}>
          <BusinessMark business={business} size={44} />
          <View style={styles.flex}>
            <AppText variant="headline" display numberOfLines={1}>
              {business.name}
            </AppText>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
              {getCategory(business.categories[0])?.name} · {formatDistance(km)}
            </AppText>
          </View>
        </View>
        {children}
      </Card>
    </Tappable>
  );
}

function Section({
  title,
  subtitle,
  trailing,
  children,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const { column } = useLayout();
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, column]}>
        <View style={styles.sectionTitle}>
          <AppText variant="title2" accessibilityRole="header" style={styles.flexShrink}>
            {title}
          </AppText>
          {trailing}
        </View>
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
      <View style={[styles.stepNumber, { backgroundColor: colors.brandSoft }]}>
        <AppText variant="headline" display weight="800" tone="brandText" accessibilityRole="none">
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

function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.xxl },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  overscroll: { position: 'absolute', left: 0, right: 0, top: -600, height: 600 },
  panel: { gap: Spacing.md },
  // One line on a 390 pt iPhone, like the reference; it wraps on smaller screens and larger text.
  title: { fontSize: 30, lineHeight: 34 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: 44,
  },
  search: { borderRadius: Radius.card },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 64,
  },
  searchIcon: {
    width: IconWell.card.size,
    height: IconWell.card.size,
    borderRadius: IconWell.card.radius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notices: { paddingHorizontal: ScreenPadding, gap: Spacing.md },
  describe: {
    marginHorizontal: ScreenPadding,
    borderRadius: Radius.card,
    borderCurve: 'continuous',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  describeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.md },
  sectionHeader: { paddingHorizontal: ScreenPadding, gap: 2 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  grid: { paddingHorizontal: ScreenPadding, gap: Spacing.lg },
  gridRow: { flexDirection: 'row', gap: Spacing.md },
  // Room for the cards' shadows above and below.
  carousel: { paddingHorizontal: ScreenPadding, paddingVertical: Spacing.xs, gap: Spacing.md },
  cardTap: { borderRadius: Radius.card },
  jobCard: { width: 164, borderRadius: Radius.card, gap: Spacing.xs, padding: Spacing.md },
  jobIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  // Room for two lines, so the prices line up across the cards.
  jobName: { minHeight: 40 },
  tools: { paddingHorizontal: ScreenPadding },
  featured: { width: 290, borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.xs },
  person: { width: 240, borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  hourly: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  steps: { marginHorizontal: ScreenPadding, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.lg },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
