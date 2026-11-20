import { router, Stack } from 'expo-router';
import { Fragment, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessMark } from '@/components/business/business-mark';
import { HeroPanel, panelHeaderOptions } from '@/components/hero-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText, type Tone } from '@/components/ui/text';
import { MinTouchSize, Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useLayout } from '@/hooks/use-layout';
import { useScored } from '@/hooks/use-results';
import { useTheme } from '@/hooks/use-theme';
import { sharedTrade } from '@/lib/compare';
import { callBusiness } from '@/lib/contact';
import { currencySymbol, formatDistance, formatNumber, formatPrice, formatRating } from '@/lib/format';
import { getOpenStatus } from '@/lib/opening-hours';
import { bestBy, bestReviewed, type ScoredBusiness } from '@/lib/ranking';
import { cheapestId } from '@/lib/sort-tabs';
import { t } from '@/i18n';
import { businessText, currencyOf, timeZoneOf } from '@/lib/business-text';
import { taxNote } from '@/lib/markets';
import { useApp, useMarket } from '@/state/app-state';

type Best = (items: ScoredBusiness[]) => string | undefined;

const bestMatch: Best = (items) => bestBy(items, (s) => s.score, false);
// The lowest "fra" price, the same rule as "Billigst" on the list.
const bestPrice: Best = cheapestId;
const bestDistance: Best = (items) => bestBy(items, (s) => Math.round(s.distanceKm * 10), true);

/** How a winning cell is coloured: sun for price, sky for distance, brand for match and reviews. */
type WinTone = 'sun' | 'sky' | 'brand';

/** How far the table reaches up into the panel. */
const OVERLAP = 28;

/** "560–660", or one number when both ends are the same. The currency is in the row's label. */
function numberRange(min: number, max: number): string {
  return min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
}

/** "Elektrikere" → "elektrikere", but "VVS'ere" keeps its capitals. */
const lowerTrade = (word: string) => (word.startsWith('VVS') ? word : word.toLowerCase());

export default function CompareScreen() {
  const colors = useTheme();
  const { column, gutter } = useLayout();
  const insets = useSafeAreaInsets();
  const { state, toggleCompare, clearCompare } = useApp();
  const { market } = useMarket();
  // A business can be in two trades; it is compared (and scored) in the trade all of them share.
  const tradeId = sharedTrade(
    state.compare.map((id) => state.businesses.find((b) => b.id === id)).filter((b) => b !== undefined),
  );
  const items = useScored(state.compare, tradeId);

  const header = (
    <Stack.Screen
      options={{
        ...panelHeaderOptions(colors),
        headerLeft: () => (
          <HeaderText
            title={t('Luk')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            align="flex-start"
          />
        ),
        headerRight: () =>
          items.length > 0 ? (
            <HeaderText
              title={t('Ryd')}
              accessibilityLabel={t('Ryd sammenligning')}
              onPress={clearCompare}
              align="flex-end"
            />
          ) : null,
      }}
    />
  );

  if (items.length === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {header}
        <EmptyState
          icon="compare"
          title={t('Intet at sammenligne endnu')}
          message={t('Tryk på “Sammenlign” ved op til tre virksomheder i et fag, så vises de her side om side.')}
          action={<Button title={t('Find en håndværker')} variant="tinted" onPress={() => router.dismissTo('/')} />}
        />
      </View>
    );
  }

  const currency = currencyOf(items[0].business);
  const symbol = currencySymbol(currency);
  // A job every compared business has priced, so prices can be compared like for like.
  const sharedJob = items[0].business.pricing.examples.find((example) =>
    items.every((s) => s.business.pricing.examples.some((e) => e.job && e.job === example.job)),
  );
  const jobExample = (s: ScoredBusiness) =>
    sharedJob?.job ? s.business.pricing.examples.find((e) => e.job === sharedJob.job) : undefined;
  const trade = tradeId ? getCategory(tradeId) : undefined;
  // Prices and scores are only compared within one trade, so a mix of trades gets no winners.
  const winners = trade
    ? {
        match: bestMatch(items),
        price: bestPrice(items),
        job: sharedJob?.job ? bestBy(items, (s) => jobExample(s)?.min ?? Infinity, true) : undefined,
        distance: bestDistance(items),
        rating: bestReviewed(items),
      }
    : {};
  const jobName = sharedJob?.job
    ? ((trade ?? getCategory(items[0].business.categories[0]))?.jobs.find((j) => j.id === sharedJob.job)?.name ??
      sharedJob.label)
    : undefined;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        contentInsetAdjustmentBehavior="automatic">
        <View>
          <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: colors.panel }]} />
          <HeroPanel safeArea={false} overlap={OVERLAP} contentStyle={styles.hero}>
            <AppText variant="title1" tone="onPanel">
              {items.length === 1
                ? trade
                  ? t('1 {trade} valgt', { trade: lowerTrade(trade.name) })
                  : t('1 virksomhed valgt')
                : trade
                  ? t('{count} {trade} side om side', { count: items.length, trade: lowerTrade(trade.plural) })
                  : t('{count} virksomheder side om side', { count: items.length })}
              <Text style={{ color: colors.accent }}>.</Text>
            </AppText>
            <AppText variant="footnote" tone="onPanelSoft">
              {t('Nær {place} · priser {tax}', { place: state.location.label, tax: taxNote(market) })}
            </AppText>
          </HeroPanel>
        </View>

        <View style={[styles.body, column]}>
          <Card elevation="raised" padded={false} style={styles.table}>
            <View style={styles.columns}>
              {items.map(({ business }) => (
                <View key={business.id} style={styles.headerCell}>
                  <Tappable
                    onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
                    accessibilityLabel={t('Se {name}', { name: business.name })}
                    pressedOpacity={0.7}
                    style={styles.headerTap}>
                    <BusinessMark business={business} size={44} />
                    <AppText variant="footnote" display weight="700" align="center" numberOfLines={2}>
                      {business.name}
                    </AppText>
                  </Tappable>
                  <Tappable
                    onPress={() => toggleCompare(business.id)}
                    accessibilityLabel={t('Fjern {name} fra sammenligning', { name: business.name })}
                    // 24 pt + 2 × 10 = a 44 pt target.
                    hitSlop={10}
                    style={[styles.remove, { backgroundColor: colors.fill }]}>
                    <Icon name="close" size={11} color={colors.textSecondary} weight="bold" />
                  </Tappable>
                </View>
              ))}
            </View>

            <Row icon="sparkles" label={t('Match-score')}>
              {items.map((s) => (
                <Value
                  key={s.business.id}
                  win={winners.match === s.business.id ? 'brand' : undefined}
                  winLabel={t('Bedste match')}>
                  {(tone) => <Big tone={tone}>{s.score}</Big>}
                </Value>
              ))}
            </Row>
            <Row icon="clock" label={`${t('Timepris')}, ${symbol}`}>
              {items.map((s) => (
                <Value
                  key={s.business.id}
                  win={winners.price === s.business.id ? 'sun' : undefined}
                  // The row shows the whole range, so the label says what was compared.
                  winLabel={t('Lavest fra')}>
                  {(tone) => (
                    <Big tone={tone}>{numberRange(s.business.pricing.hourlyMin, s.business.pricing.hourlyMax)}</Big>
                  )}
                </Value>
              ))}
            </Row>
            {sharedJob?.job && jobName ? (
              <Row icon="tag" label={`${jobName}, ${symbol}`}>
                {items.map((s) => {
                  const example = jobExample(s);
                  return (
                    <Value
                      key={s.business.id}
                      win={winners.job === s.business.id ? 'sun' : undefined}
                      winLabel={t('Lavest fra')}>
                      {(tone) => <Big tone={tone}>{example ? numberRange(example.min, example.max) : '–'}</Big>}
                    </Value>
                  );
                })}
              </Row>
            ) : null}
            <Row icon="car" label={t('Kørsel/opstart')}>
              {items.map((s) => (
                <Value key={s.business.id}>
                  {() => (
                    <AppText variant="subhead" weight="600">
                      {s.business.pricing.calloutFee
                        ? formatPrice(s.business.pricing.calloutFee, currencyOf(s.business))
                        : t('Ingen')}
                    </AppText>
                  )}
                </Value>
              ))}
            </Row>
            <Row icon="pin" label={t('Afstand')}>
              {items.map((s) => (
                <Value
                  key={s.business.id}
                  win={winners.distance === s.business.id ? 'sky' : undefined}
                  winLabel={t('Nærmest')}>
                  {(tone) => <Big tone={tone}>{formatDistance(s.distanceKm)}</Big>}
                </Value>
              ))}
            </Row>
            <Row icon="star" label={t('Anmeldelser')}>
              {items.map((s) => {
                const summary = s.business.reviewSummary;
                return (
                  <Value
                    key={s.business.id}
                    win={winners.rating === s.business.id ? 'brand' : undefined}
                    winLabel={t('Bedst anmeldt')}>
                    {(tone) =>
                      summary && summary.reviews > 0 ? (
                        <View style={styles.rating}>
                          <Icon name="star" size={13} color={colors.star} />
                          <Big tone={tone}>{formatRating(summary.average)}</Big>
                          <AppText variant="caption" tone="textSecondary">
                            ({formatNumber(summary.reviews)})
                          </AppText>
                        </View>
                      ) : (
                        <AppText variant="footnote" tone="textSecondary">
                          {t('Ingen endnu')}
                        </AppText>
                      )
                    }
                  </Value>
                );
              })}
            </Row>
            <Row icon="clock" label={t('Åben nu')}>
              {items.map((s) => {
                const status = getOpenStatus(s.business.hours, undefined, timeZoneOf(s.business));
                return (
                  <Value key={s.business.id}>
                    {() => (
                      <>
                        <AppText variant="subhead" weight="600" tone={status.open ? 'success' : 'textSecondary'}>
                          {status.open ? t('Ja') : t('Nej')}
                        </AppText>
                        <AppText variant="caption" tone="textSecondary" align="center">
                          {status.label}
                        </AppText>
                      </>
                    )}
                  </Value>
                );
              })}
            </Row>
            <Row icon="phone" label={t('Svartid')}>
              {items.map((s) => (
                <Value key={s.business.id}>
                  {() => (
                    <AppText variant="footnote" weight="600" align="center">
                      {businessText(s.business).responseTime?.replace(t('Svarer typisk '), '') ?? '–'}
                    </AppText>
                  )}
                </Value>
              ))}
            </Row>
            <Row icon="bolt" label={t('Døgnvagt')}>
              {items.map((s) => (
                <Value key={s.business.id}>{() => <YesNo value={s.business.emergency} />}</Value>
              ))}
            </Row>
            <Row icon="shield" label={t('Autorisation')} last>
              {items.map((s) => (
                <Value key={s.business.id}>{() => <YesNo value={s.business.authorizations.length > 0} />}</Value>
              ))}
            </Row>
          </Card>

          <AppText variant="caption" tone="textSecondary" align="center" style={styles.note}>
            {t('Priserne er vejledende og oplyst af virksomhederne. Afstand er i luftlinje fra {label}.', {
              label: state.location.label,
            })}
          </AppText>
        </View>
      </ScrollView>

      <View
        style={[
          styles.callBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
            paddingHorizontal: gutter,
          },
        ]}>
        <View style={[styles.columns, styles.callRow, column]}>
          {items.map(({ business }) => (
            <Button
              key={business.id}
              title={t('Ring')}
              icon="phone"
              onPress={() => callBusiness(business)}
              accessibilityLabel={t('Ring til {name}', { name: business.name })}
              style={styles.flex}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/** "Luk" and "Ryd" in the panel-coloured navigation bar. */
function HeaderText({
  title,
  onPress,
  accessibilityLabel,
  align,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  align: 'flex-start' | 'flex-end';
}) {
  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[styles.headerButton, { alignItems: align }]}>
      <AppText variant="body" weight="600" tone="onPanel" maxFontSizeMultiplier={1.3}>
        {title}
      </AppText>
    </Tappable>
  );
}

function Row({ icon, label, last, children }: { icon: IconName; label: string; last?: boolean; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.row,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={styles.rowLabel}>
        <Icon name={icon} size={13} color={colors.textSecondary} weight="semibold" />
        <AppText variant="footnote" tone="textSecondary" accessibilityRole="header" style={styles.flexShrink}>
          {label}
        </AppText>
      </View>
      <View style={styles.columns}>
        {Array.isArray(children) ? children.map((child, index) => <Fragment key={index}>{child}</Fragment>) : children}
      </View>
    </View>
  );
}

/** A value in the display font; winners take their colour's text tone. */
function Big({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return (
    <AppText
      variant="headline"
      display
      weight="800"
      tone={tone}
      align="center"
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      maxFontSizeMultiplier={1.3}>
      {children}
    </AppText>
  );
}

const WIN_TONES: Record<WinTone, { bg: 'accentSoft' | 'skySoft' | 'brandSoft'; fg: Tone }> = {
  sun: { bg: 'accentSoft', fg: 'accentText' },
  sky: { bg: 'skySoft', fg: 'skyText' },
  brand: { bg: 'brandSoft', fg: 'brandText' },
};

/**
 * One cell. The winner of a row gets its colour (sun for the lowest price, sky for the nearest,
 * brand for the best match and the best reviews) and says why, so colour is never the only cue.
 */
function Value({
  children,
  win,
  winLabel,
}: {
  children: (tone?: Tone) => ReactNode;
  win?: WinTone;
  winLabel?: string;
}) {
  const colors = useTheme();
  const palette = win ? WIN_TONES[win] : undefined;
  return (
    <View style={styles.cell}>
      <View style={[styles.cellInner, palette ? { backgroundColor: colors[palette.bg] } : null]}>
        {children(palette?.fg)}
        {palette && winLabel ? (
          <View style={styles.winLabel}>
            <Icon name="check" size={10} color={colors[palette.fg]} weight="bold" />
            <AppText variant="caption2" weight="700" tone={palette.fg} numberOfLines={1}>
              {winLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function YesNo({ value }: { value: boolean }) {
  const colors = useTheme();
  return (
    <View style={styles.yesNo}>
      <Icon
        name={value ? 'check' : 'close'}
        size={14}
        color={value ? colors.brand : colors.textTertiary}
        weight="bold"
      />
      <AppText variant="footnote" weight="600" tone={value ? 'brandText' : 'textSecondary'}>
        {value ? t('Ja') : t('Nej')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  overscroll: { position: 'absolute', left: 0, right: 0, top: -600, height: 600 },
  hero: { gap: Spacing.xs },
  body: { marginTop: -OVERLAP, paddingHorizontal: ScreenPadding, gap: Spacing.md },
  table: { borderRadius: Radius.card },
  // The same inset as the other modals' "Luk" (CloseButton, a small plain Button).
  headerButton: {
    minHeight: MinTouchSize,
    minWidth: MinTouchSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  columns: { flexDirection: 'row' },
  headerCell: { flex: 1, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTap: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  remove: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, gap: Spacing.xs },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.sm },
  cell: { flex: 1, paddingHorizontal: 3 },
  cellInner: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    gap: 2,
  },
  winLabel: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  yesNo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  note: { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg },
  callBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
  },
  callRow: { gap: Spacing.sm },
});
