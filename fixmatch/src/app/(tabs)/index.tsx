import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchBadge } from '@/components/business/match-badge';
import { TrustpilotRating } from '@/components/business/trustpilot-rating';
import { CategoryTile } from '@/components/category-tile';
import { LocationPill } from '@/components/location-pill';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES, getCategory } from '@/data/categories';
import { useGps, GPS_MESSAGES } from '@/hooks/use-gps';
import { useTheme } from '@/hooks/use-theme';
import { DATA_MODE } from '@/lib/data-source';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { showDialog } from '@/lib/dialog';
import { formatDistance, formatHourly, formatPriceRange } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { summarizeJobPrice } from '@/lib/prices';
import { reviewValue, scoreBusinesses } from '@/lib/ranking';
import type { CategoryId } from '@/lib/types';
import { useApp } from '@/state/app-state';

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
  { label: 'Vandskade', category: 'vvs', icon: 'vvs' },
  { label: 'Låst ude', category: 'laasesmed', icon: 'laasesmed' },
  { label: 'Strømsvigt', category: 'elektriker', icon: 'elektriker' },
];

const NEARBY_KM = 25;

export default function HomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { locate, busy } = useGps();
  const origin = state.location.coords;

  const nearbyCount = useMemo(() => {
    const counts = new Map<CategoryId, number>();
    for (const b of state.businesses) {
      if (distanceKm(origin, b.coords) > NEARBY_KM) continue;
      for (const c of b.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return counts;
  }, [state.businesses, origin]);

  const topRated = useMemo(
    () =>
      state.businesses
        .map((b) => ({ business: b, km: distanceKm(origin, b.coords) }))
        .filter((x) => x.km <= 10 && x.business.trustpilot)
        .sort((a, b) => reviewValue(b.business) - reviewValue(a.business))
        .slice(0, 6),
    [state.businesses, origin],
  );

  const promoted = useMemo(() => {
    const ads = state.businesses.filter((b) => b.promoted && distanceKm(origin, b.coords) <= NEARBY_KM);
    if (ads.length === 0) return [];
    return ads.map((b) => {
      const peers = state.businesses.filter((p) => p.categories.includes(b.categories[0]));
      const scored = scoreBusinesses(peers, origin, state.priorities).find((s) => s.business.id === b.id);
      return { business: b, score: scored?.score ?? 0, km: distanceKm(origin, b.coords) };
    });
  }, [state.businesses, origin, state.priorities]);

  async function useMyLocation() {
    const result = await locate();
    if (result !== 'ok') showDialog(GPS_MESSAGES[result].title, GPS_MESSAGES[result].message);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 96 }]}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.topBar}>
        <Logo />
        <LocationPill />
      </View>

      <View style={styles.hero}>
        <AppText variant="title1">Find den rette håndværker</AppText>
        <AppText variant="callout" tone="textSecondary">
          Sammenlign pris, afstand og Trustpilot-anmeldelser hos lokale virksomheder – og ring direkte.
        </AppText>
      </View>

      <Tappable
        onPress={() => router.push('/soeg')}
        accessibilityRole="search"
        accessibilityLabel="Søg efter opgave, fag eller virksomhed"
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="search" size={18} color={colors.textSecondary} weight="semibold" />
        <AppText variant="body" tone="textTertiary" numberOfLines={1}>
          Hvad skal laves? Fx “stoppet afløb”
        </AppText>
      </Tappable>

      <Tappable
        onPress={() => router.push('/beskriv')}
        accessibilityLabel="Beskriv dit problem og dit budget, så matcher vi dig med virksomheder"
        style={[styles.describe, { backgroundColor: colors.brandStrong }]}>
        <View style={styles.describeIcon}>
          <Icon name="wand" size={20} color={colors.onBrand} weight="semibold" />
        </View>
        <View style={styles.flex}>
          <AppText variant="headline" tone="onBrand">
            Beskriv dit problem
          </AppText>
          <AppText variant="footnote" tone="onBrand">
            Skriv hvad der er galt og dit budget – vi finder dem, der passer.
          </AppText>
        </View>
        <Icon name="chevronRight" size={16} color={colors.onBrand} weight="semibold" />
      </Tappable>

      {state.location.source === 'default' ? (
        <View style={[styles.notice, { backgroundColor: colors.infoSoft }]}>
          <Icon name="info" size={16} color={colors.info} weight="semibold" />
          <AppText variant="footnote" style={[styles.flex, { color: colors.text }]}>
            Afstande regnes fra {state.location.label}. Brug din placering for at se de nærmeste.
          </AppText>
          <Tappable onPress={useMyLocation} disabled={busy} accessibilityLabel="Brug min placering" style={styles.noticeAction}>
            <AppText variant="footnote" weight="700" style={{ color: colors.info }}>
              {busy ? 'Finder…' : 'Brug placering'}
            </AppText>
          </Tappable>
        </View>
      ) : null}

      {DATA_MODE === 'demo' ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <Icon name="info" size={16} color={colors.warning} weight="semibold" />
          <AppText variant="footnote" style={[styles.flex, { color: colors.text }]}>
            Demoversion: virksomhederne er fiktive eksempler, indtil de rigtige har givet samtykke.
          </AppText>
        </View>
      ) : null}

      <Section title="Vælg fag">
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

      <Section title="Akut hjælp – døgnvagt">
        <View style={styles.urgentRow}>
          {URGENT.map((item) => (
            <Tappable
              key={item.label}
              onPress={() =>
                router.push({ pathname: '/kategori/[id]', params: { id: item.category, akut: '1' } })
              }
              accessibilityLabel={`${item.label}: vis virksomheder med døgnvagt`}
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

      <Section title="Hvad koster det typisk?" subtitle="Prisintervaller inkl. moms fra virksomhederne i appen">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {POPULAR_JOBS.map(([categoryId, jobId]) => {
            const category = getCategory(categoryId);
            const job = category?.jobs.find((j) => j.id === jobId);
            if (!category || !job) return null;
            const price = summarizeJobPrice(job, state.businesses);
            return (
              <Tappable
                key={jobId}
                onPress={() => router.push({ pathname: '/kategori/[id]', params: { id: categoryId, job: jobId } })}
                accessibilityLabel={`${job.name}, typisk ${formatPriceRange(price.min, price.max, price.unit)}. Vis ${category.plural}`}
                style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.jobIcon, { backgroundColor: colors.brandSoft }]}>
                  <Icon name={categoryId} size={16} color={colors.brand} weight="semibold" />
                </View>
                <AppText variant="subhead" weight="600" numberOfLines={2}>
                  {job.name}
                </AppText>
                <AppText variant="footnote" tone="brandText" weight="700" numberOfLines={1}>
                  {formatPriceRange(price.min, price.max, price.unit)}
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
        <Section title="Fremhævet" subtitle="Betalt annonce – påvirker ikke rækkefølgen i søgeresultater">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {promoted.map(({ business, score, km }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={`Annonce: ${business.name}, ${formatDistance(km)} væk`}
                style={[styles.featured, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Photo photo={business.photo} category={business.categories[0]} width={600} style={styles.featuredPhoto} />
                <View style={styles.adLabel}>
                  <Badge label="Annonce" tone="neutral" />
                </View>
                <View style={styles.featuredBody}>
                  <View style={styles.rowBetween}>
                    <AppText variant="headline" numberOfLines={1} style={styles.flex}>
                      {business.name}
                    </AppText>
                    <MatchBadge score={score} />
                  </View>
                  <TrustpilotRating trustpilot={business.trustpilot} />
                  <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                    {formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax)} · {formatDistance(km)}
                  </AppText>
                </View>
              </Tappable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {TRUSTPILOT_ENABLED && topRated.length > 0 ? (
        <Section title="Bedst anmeldt nær dig" subtitle="Højeste TrustScore inden for 10 km">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {topRated.map(({ business, km }) => (
              <Tappable
                key={business.id}
                onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                accessibilityLabel={`${business.name}, ${getCategory(business.categories[0])?.name}, ${formatDistance(km)} væk`}
                style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Photo photo={business.photo} category={business.categories[0]} width={500} style={styles.topPhoto} />
                <View style={styles.topBody}>
                  <AppText variant="caption" tone="brandText" weight="700">
                    {getCategory(business.categories[0])?.name.toUpperCase()}
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

      <Section title="Sådan virker FixMatch">
        <View style={[styles.steps, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Step number={1} title="Vælg fag eller opgave" text="VVS, el, tømrer, murer, mekaniker og flere." />
          <Step number={2} title="Sammenlign" text="Pris inkl. moms, afstand og TrustScore – side om side." />
          <Step number={3} title="Ring direkte" text="Ingen mellemled og ingen gebyrer. Du aftaler prisen direkte." />
        </View>
      </Section>

      <View style={styles.footerLinks}>
        <FooterLink label="Sådan rangerer vi" slug="rangering" />
        <FooterLink label="Om priserne" slug="priser" />
        <FooterLink label="Om anmeldelser" slug="anmeldelser" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
  featuredPhoto: { height: 130 },
  adLabel: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  featuredBody: { padding: Spacing.md, gap: Spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  topCard: { width: 210, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  topPhoto: { height: 110 },
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
