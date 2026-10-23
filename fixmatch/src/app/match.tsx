import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { BusinessCard } from '@/components/business/business-card';
import { CompareTray } from '@/components/business/compare-tray';
import type { BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useBudgetMatch } from '@/hooks/use-budget-match';
import { useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { formatNumber, formatPrice, formatPriceRange, pluralize } from '@/lib/format';
import { CLOSE_MARGIN, FIT_LABELS, type BudgetFit, type BudgetMatch } from '@/lib/matcher';
import { MAX_COMPARE, useApp } from '@/state/app-state';

type Group = {
  id: string;
  title: string;
  subtitle?: string;
  fits: BudgetFit[];
  collapsed?: boolean;
};

const GROUPS: Group[] = [
  { id: 'fit', title: 'Passer til dit budget', fits: ['within', 'maybe'] },
  {
    id: 'close',
    title: 'Tæt på dit budget',
    subtitle: `Højst ${Math.round(CLOSE_MARGIN * 100)} % over – spørg, om de kan komme ned`,
    fits: ['close'],
  },
  {
    id: 'unknown',
    title: 'Pris på forespørgsel',
    subtitle: 'Har ikke oplyst en pris for opgaven',
    fits: ['unknown'],
  },
  { id: 'over', title: 'Over dit budget', fits: ['over'], collapsed: true },
];

const FIT_BADGE: Record<BudgetFit, { tone: BadgeTone; icon?: IconName }> = {
  within: { tone: 'success', icon: 'check' },
  maybe: { tone: 'success' },
  close: { tone: 'warning' },
  unknown: { tone: 'neutral' },
  over: { tone: 'danger' },
};

export default function MatchScreen() {
  const colors = useTheme();
  const params = useLocalSearchParams<{
    kategori: string;
    job?: string;
    budget?: string;
    antal?: string;
    akut?: string;
    tekst?: string;
  }>();
  const { state } = useApp();
  const category = getCategory(params.kategori);
  const job = category?.jobs.find((j) => j.id === params.job);
  const budget = params.budget ? Number(params.budget) : undefined;
  const quantity = params.antal ? Number(params.antal) : undefined;
  const urgent = params.akut === '1';
  const [showOver, setShowOver] = useState(false);
  const [showFar, setShowFar] = useState(false);

  const { items, outOfReach } = useBudgetMatch(
    category ? { category: category.id, job, quantity, budget, urgent } : undefined,
  );

  if (!category) {
    return (
      <EmptyState
        icon="help"
        title="Vi mangler faget"
        message="Gå tilbage og beskriv problemet igen."
        action={<Button title="Tilbage" onPress={() => router.back()} />}
      />
    );
  }

  const list = showFar ? [...items, ...outOfReach] : items;
  const groups =
    budget && job
      ? GROUPS
      : [
          {
            id: 'all',
            title: job ? 'Uden budget – sorteret efter FixMatch-score' : 'Sorteret efter FixMatch-score',
            fits: ['unknown'] as BudgetFit[],
          },
        ];
  const unit = job?.unit === 'm2' ? 'm²' : 'stk.';

  const priceLine = (m: BudgetMatch) => {
    if (!job) return undefined;
    if (!m.price) return `${job.name}: pris på forespørgsel`;
    const amount = formatPriceRange(m.price.min, m.price.max);
    return job.unit === 'opgave'
      ? `${job.name}: ${amount}`
      : `${amount} for ${quantity ?? 1} ${unit}`;
  };

  const highlight = (m: BudgetMatch) => {
    if (!budget || !job) return undefined;
    const label =
      m.fit === 'close' || m.fit === 'over'
        ? `${FIT_LABELS[m.fit]} (+${Math.round((m.overBy ?? 0) * 100)} %)`
        : FIT_LABELS[m.fit];
    return { label, ...FIT_BADGE[m.fit] };
  };

  const share = () =>
    Share.share({
      message: [params.tekst, budget ? `Budget: ${formatPrice(budget)} inkl. moms` : undefined, `Fundet via FixMatch`]
        .filter(Boolean)
        .join('\n'),
    }).catch(() => undefined);

  const onCompareLimit = () =>
    showDialog(
      'Højst 3 ad gangen',
      `Du kan sammenligne op til ${MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.`,
    );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Dit match' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.tradeIcon, { backgroundColor: colors.brandSoft }]}>
              <Icon name={category.id} size={18} color={colors.brand} weight="semibold" />
            </View>
            <View style={styles.flex}>
              <AppText variant="headline">
                {category.name}
                {job ? ` · ${job.name}` : ''}
              </AppText>
              <AppText variant="footnote" tone="textSecondary">
                {[
                  budget ? `Budget ${formatNumber(budget)} kr.` : 'Intet budget',
                  quantity && job && job.unit !== 'opgave' ? `${quantity} ${unit}` : undefined,
                  urgent ? 'Haster' : undefined,
                  state.location.label,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </View>
            <Tappable onPress={() => router.back()} accessibilityLabel="Ret beskrivelsen" style={styles.edit}>
              <AppText variant="subhead" tone="brandText" weight="600">
                Ret
              </AppText>
            </Tappable>
          </View>
          {params.tekst ? (
            <AppText variant="subhead" tone="textSecondary" numberOfLines={3} style={styles.quote}>
              “{params.tekst}”
            </AppText>
          ) : null}
          {params.tekst ? (
            <Button
              title="Del beskrivelsen med en virksomhed"
              icon="share"
              variant="secondary"
              size="small"
              onPress={share}
            />
          ) : null}
        </View>

        <Tappable
          onPress={() =>
            router.push({
              pathname: '/info/[slug]',
              params: { slug: 'rangering' },
            })
          }
          accessibilityRole="link"
          style={styles.rankingNote}>
          <Icon name="info" size={14} color={colors.textSecondary} />
          <AppText variant="caption" tone="textSecondary" style={styles.flexShrink}>
            {budget && job
              ? 'Sorteret efter, hvor godt virksomhedens egen pris passer til dit budget, derefter FixMatch-score. Priser er vejledende og inkl. moms. Betaling påvirker ikke rækkefølgen. '
              : 'Sorteret efter FixMatch-score. Betaling påvirker ikke rækkefølgen. '}
            <AppText variant="caption" tone="brandText" weight="600">
              Sådan rangerer vi
            </AppText>
          </AppText>
        </Tappable>

        {list.length === 0 ? (
          <EmptyState
            icon="search"
            title="Ingen kører ud til dig endnu"
            message={
              outOfReach.length > 0
                ? `Der er ${pluralize(outOfReach.length, category.name.toLowerCase(), category.plural.toLowerCase())} længere væk.`
                : `Der er endnu ingen ${category.plural.toLowerCase()} på FixMatch. Vi arbejder på at få flere med.`
            }
            action={
              outOfReach.length > 0 ? (
                <Button title="Vis dem alligevel" variant="tinted" onPress={() => setShowFar(true)} />
              ) : undefined
            }
          />
        ) : null}

        {groups.map((group) => {
          const members = list.filter((m) => group.fits.includes(m.fit));
          if (members.length === 0) return null;
          const hidden = group.collapsed && !showOver;
          return (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <AppText variant="title3" accessibilityRole="header">
                  {group.title}{' '}
                  <AppText variant="title3" tone="textTertiary">
                    {members.length}
                  </AppText>
                </AppText>
                {group.subtitle ? (
                  <AppText variant="footnote" tone="textSecondary">
                    {group.subtitle}
                  </AppText>
                ) : null}
              </View>
              {hidden ? (
                <Button
                  title={`Vis ${members.length} over budget`}
                  variant="secondary"
                  icon="chevronDown"
                  onPress={() => setShowOver(true)}
                />
              ) : (
                members.map((m) => (
                  <BusinessCard
                    key={m.business.id}
                    item={m}
                    job={job}
                    priceOverride={priceLine(m)}
                    highlight={highlight(m)}
                    onCompareLimit={onCompareLimit}
                  />
                ))
              )}
            </View>
          );
        })}

        {!showFar && outOfReach.length > 0 && list.length > 0 ? (
          <Button
            title={`Vis også ${outOfReach.length} længere væk`}
            variant="tinted"
            icon="map"
            onPress={() => setShowFar(true)}
          />
        ) : null}

        <Button
          title={`Se ${category.plural.toLowerCase()} på kortet`}
          variant="secondary"
          icon="map"
          onPress={() =>
            router.navigate({
              pathname: '/kort',
              params: { kategori: category.id },
            })
          }
        />
      </ScrollView>
      <CompareTray />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: { padding: ScreenPadding, paddingBottom: 140, gap: Spacing.lg },
  summary: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edit: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quote: { fontStyle: 'italic' },
  rankingNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    marginTop: -Spacing.sm,
  },
  group: { gap: Spacing.md },
  groupHeader: { gap: 2 },
});
