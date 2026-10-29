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
import { useLayout } from '@/hooks/use-layout';
import { showDialog } from '@/lib/dialog';
import { formatPrice, formatPriceRange, pluralize } from '@/lib/format';
import { CLOSE_MARGIN, FIT_LABELS, type BudgetFit, type BudgetMatch } from '@/lib/matcher';
import { t } from '@/i18n';
import { currencyOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { MAX_COMPARE, useApp, useMarket } from '@/state/app-state';

type Group = {
  id: string;
  title: string;
  subtitle?: string;
  fits: BudgetFit[];
  collapsed?: boolean;
};

const GROUPS: Group[] = [
  { id: 'fit', title: t('Passer til dit budget'), fits: ['within', 'maybe'] },
  {
    id: 'close',
    title: t('Tæt på dit budget'),
    subtitle: t('Højst {CLOSE_MARGIN} % over – spørg, om de kan komme ned', {
      CLOSE_MARGIN: Math.round(CLOSE_MARGIN * 100),
    }),
    fits: ['close'],
  },
  {
    id: 'unknown',
    title: t('Pris på forespørgsel'),
    subtitle: t('Har ikke oplyst en pris for opgaven'),
    fits: ['unknown'],
  },
  { id: 'over', title: t('Over dit budget'), fits: ['over'], collapsed: true },
];

const FIT_BADGE: Record<BudgetFit, { tone: BadgeTone; icon?: IconName }> = {
  within: { tone: 'success', icon: 'check' },
  maybe: { tone: 'success' },
  close: { tone: 'warning' },
  unknown: { tone: 'neutral' },
  over: { tone: 'danger' },
};

export default function MatchScreen() {
  const { column } = useLayout();
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
  const { market } = useMarket();
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
        title={t('Vi mangler faget')}
        message={t('Gå tilbage og beskriv problemet igen.')}
        action={<Button title={t('Tilbage')} onPress={() => router.back()} />}
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
            title: job ? t('Uden budget – sorteret efter FixMatch-score') : t('Sorteret efter FixMatch-score'),
            fits: ['unknown'] as BudgetFit[],
          },
        ];
  const unit = job?.unit === 'm2' ? 'm²' : t('stk.');

  const priceLine = (m: BudgetMatch) => {
    if (!job) return undefined;
    if (!m.price) return t('{name}: pris på forespørgsel', { name: job.name });
    const amount = formatPriceRange(m.price.min, m.price.max, 'opgave', currencyOf(m.business));
    return job.unit === 'opgave'
      ? `${job.name}: ${amount}`
      : t('{price} for {quantity} {unit}', { price: amount, quantity: quantity ?? 1, unit });
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
      message: [
        params.tekst,
        budget
          ? t('Budget: {price} {tax}', { price: formatPrice(budget, market.currency), tax: taxNote(market) })
          : undefined,
        t('Fundet via FixMatch'),
      ]
        .filter(Boolean)
        .join('\n'),
    }).catch(() => undefined);

  const onCompareLimit = () =>
    showDialog(
      t('Højst 3 ad gangen'),
      t('Du kan sammenligne op til {MAX_COMPARE} virksomheder. Fjern en for at vælge en ny.', { MAX_COMPARE }),
    );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('Dit match') }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, column]}>
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
                  budget ? t('Budget {price}', { price: formatPrice(budget, market.currency) }) : t('Intet budget'),
                  quantity && job && job.unit !== 'opgave' ? `${quantity} ${unit}` : undefined,
                  urgent ? t('Haster') : undefined,
                  state.location.label,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </View>
            <Tappable onPress={() => router.back()} accessibilityLabel={t('Ret beskrivelsen')} style={styles.edit}>
              <AppText variant="subhead" tone="brandText" weight="600">
                {t('Ret')}
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
              title={t('Del beskrivelsen med en virksomhed')}
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
              ? `${t('Sorteret efter, hvor godt virksomhedens egen pris passer til dit budget, derefter FixMatch-score. Priser er vejledende og {tax}. Betaling påvirker ikke rækkefølgen.', { tax: taxNote(market) })} `
              : `${t('Sorteret efter FixMatch-score. Betaling påvirker ikke rækkefølgen.')} `}
            <AppText variant="caption" tone="brandText" weight="600">
              {t('Sådan rangerer vi')}
            </AppText>
          </AppText>
        </Tappable>

        {list.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('Ingen kører ud til dig endnu')}
            message={
              outOfReach.length > 0
                ? t('Der er {countText} længere væk.', {
                    countText: pluralize(outOfReach.length, category.name.toLowerCase(), category.plural.toLowerCase()),
                  })
                : t('Der er endnu ingen {plural} på FixMatch. Vi arbejder på at få flere med.', {
                    plural: category.plural.toLowerCase(),
                  })
            }
            action={
              outOfReach.length > 0 ? (
                <Button title={t('Vis dem alligevel')} variant="tinted" onPress={() => setShowFar(true)} />
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
                  title={t('Vis {count} over budget', { count: members.length })}
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
            title={t('Vis også {count} længere væk', { count: outOfReach.length })}
            variant="tinted"
            icon="map"
            onPress={() => setShowFar(true)}
          />
        ) : null}

        <Button
          title={t('Se {plural} på kortet', { plural: category.plural.toLowerCase() })}
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
