import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { businessText, currencyOf, timeZoneOf } from '@/lib/business-text';
import { formatDistance, formatHourly, formatPriceRange, speakablePrice } from '@/lib/format';
import { availableWhen } from '@/lib/availability';
import { getOpenStatus } from '@/lib/opening-hours';
import type { ScoredBusiness } from '@/lib/ranking';
import { reviewRatingLabel } from '@/lib/review-label';
import { MAX_RIBBONS, type Ribbon } from '@/lib/sort-tabs';
import type { JobType } from '@/lib/types';
import { isTopRated, isVerified } from '@/lib/verification';
import { answerRateText, useAnswerRate } from '@/state/answers';
import { useApp } from '@/state/app-state';

import { BusinessMark } from './business-mark';
import { OpenStatus } from './open-status';
import { PriceText } from './price-text';
import { ReviewRating } from './review-rating';
import { VerifiedMark } from './verified-mark';
import { t } from '@/i18n';

interface Props {
  item: ScoredBusiness;
  /** When the user searched for a job, show that job's price too. */
  job?: JobType;
  rank?: number;
  onCompareLimit?: () => void;
  /** A price line of its own, e.g. a job price for 25 m². */
  priceOverride?: string;
  /** Extra badge shown first, e.g. "Inden for budget". */
  highlight?: { label: string; tone: BadgeTone; icon?: IconName };
  /**
   * What this card won in the list shown ("Bedste match", "Billigst", "Nærmest"), from
   * resultRibbons in src/lib/sort-tabs.ts. Only the winner gets each one.
   */
  ribbons?: Ribbon[];
}

/** Width of the price column on the right. */
const PRICE_COLUMN = 116;

/** Keeps a run of text on one line on the web (not a React Native style, so it is cast). */
const NO_WRAP = { whiteSpace: 'nowrap' } as TextStyle;

/**
 * A business in a result list, in two columns: who it is on the left (initials, name,
 * Verificeret, tagline, reviews when there are any, distance, opening hours and "Sammenlign"),
 * and the hourly price "fra 560 kr." large on the right with "Se priser". At most two small
 * ribbons sit on top.
 */
export function BusinessCard({ item, job, rank, onCompareLimit, priceOverride, highlight, ribbons = [] }: Props) {
  const colors = useTheme();
  const { state, toggleFavorite, toggleCompare } = useApp();
  const { business, distanceKm, score } = item;
  const favorite = state.favorites.includes(business.id);
  const comparing = state.compare.includes(business.id);
  const currency = currencyOf(business);
  const jobPrice = job ? business.pricing.examples.find((e) => e.job === job.id) : undefined;
  const jobLine =
    priceOverride ??
    (jobPrice && job ? `${job.name}: ${formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit, currency)}` : null);
  const hourly = formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currency);
  const authorized = business.authorizations.length > 0;
  const verified = isVerified(business);
  const topRated = isTopRated(business);
  const open = getOpenStatus(business.hours, undefined, timeZoneOf(business));
  const free = availableWhen(business);
  const answers = answerRateText(useAnswerRate(business));
  const seal = verified ? (
    <View style={styles.seal}>
      <VerifiedMark business={business} />
    </View>
  ) : null;
  // On iOS the no-break space keeps the seal with the last word. Chrome still breaks before the
  // inline seal, so on the web the name's last letter and the seal share a span that does not wrap:
  // there is no break inside a word, so the seal moves with the whole last word, and a word too long
  // for the line can still break before that letter.
  const lastLetter = Array.from(business.name).pop() ?? '';

  const ribbonBadges = [
    highlight ? { key: 'highlight', ...highlight } : null,
    ...ribbons.map((ribbon) => ({ key: ribbon, ...RIBBONS[ribbon]() })),
  ]
    .filter((badge) => badge !== null)
    .slice(0, MAX_RIBBONS);

  const openPage = () => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } });
  const onCompare = () => {
    if (!toggleCompare(business.id)) onCompareLimit?.();
  };

  const summary = [
    rank ? t('Nummer {rank}', { rank }) : undefined,
    business.name,
    verified ? t('verificeret af FixMatch') : undefined,
    topRated ? t('topbedømt') : undefined,
    ...ribbonBadges.map((badge) => badge.label),
    t('match {score} ud af 100', { score }),
    reviewRatingLabel(business.reviewSummary),
    jobLine ? speakablePrice(jobLine) : undefined,
    speakablePrice(hourly),
    t('{distance} væk', { distance: formatDistance(distanceKm) }),
    open.label,
    free === 'today' ? t('ledig i dag') : free === 'tomorrow' ? t('ledig i morgen') : undefined,
    answers
      ? t('tager telefonen {answered} ud af {outOf} gange', { answered: answers.answered, outOf: answers.outOf })
      : undefined,
    authorized ? t('autoriseret') : undefined,
    business.videoCheck ? t('tilbyder videotjek') : undefined,
    business.demo ? t('eksempelvirksomhed') : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.columns}>
        <View style={styles.left}>
          <Tappable
            onPress={openPage}
            accessibilityLabel={summary}
            accessibilityHint={t('Åbner virksomhedens side med telefonnummer og hjemmeside')}
            accessibilityActions={[
              { name: 'favorite', label: favorite ? t('Fjern fra gemte') : t('Gem') },
              { name: 'compare', label: comparing ? t('Fjern fra sammenligning') : t('Sammenlign') },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'favorite') toggleFavorite(business.id);
              if (event.nativeEvent.actionName === 'compare') onCompare();
            }}
            pressedOpacity={0.75}
            style={styles.main}>
            {ribbonBadges.length > 0 ? (
              <View style={styles.ribbons}>
                {ribbonBadges.map((badge) => (
                  <Badge key={badge.key} label={badge.label} tone={badge.tone} icon={badge.icon} />
                ))}
              </View>
            ) : null}
            <View style={styles.identity}>
              <BusinessMark business={business} size={44} />
              <View style={styles.titleText}>
                {/* The seal sits in the text, so it follows the last word of a two-line name. */}
                <AppText variant="headline" display numberOfLines={2}>
                  {!seal ? (
                    business.name
                  ) : Platform.OS === 'web' ? (
                    <>
                      {business.name.slice(0, business.name.length - lastLetter.length)}
                      <Text style={NO_WRAP}>
                        {lastLetter}
                        {'\u00a0'}
                        {seal}
                      </Text>
                    </>
                  ) : (
                    <>
                      {business.name}
                      {'\u00a0'}
                      {seal}
                    </>
                  )}
                </AppText>
                <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                  {businessText(business).tagline}
                </AppText>
              </View>
            </View>
            {jobLine ? (
              <AppText variant="subhead" weight="600" numberOfLines={2}>
                {jobLine}
              </AppText>
            ) : null}
            <View style={styles.meta}>
              <ReviewRating summary={business.reviewSummary} compact />
              {business.reviewSummary && business.reviewSummary.reviews > 0 ? <Dot /> : null}
              <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                {formatDistance(distanceKm)}
              </AppText>
              <OpenStatus business={business} />
            </View>
            {free ? (
              <View style={styles.free}>
                <Icon
                  name="calendar"
                  size={13}
                  color={free === 'today' ? colors.success : colors.textSecondary}
                  weight="semibold"
                />
                <AppText variant="footnote" weight="600" tone={free === 'today' ? 'success' : 'textSecondary'}>
                  {free === 'today' ? t('Ledig i dag') : t('Ledig i morgen')}
                </AppText>
              </View>
            ) : null}
          </Tappable>
          <View style={styles.footer}>
            <Tappable
              onPress={onCompare}
              accessibilityRole="checkbox"
              accessibilityLabel={t('Sammenlign {name}', { name: business.name })}
              accessibilityState={{ checked: comparing }}
              aria-checked={comparing}
              style={styles.compare}>
              <View
                style={[
                  styles.checkbox,
                  comparing
                    ? { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong }
                    : { borderColor: colors.textTertiary },
                ]}>
                {comparing ? <Icon name="check" size={13} color={colors.onBrand} weight="bold" /> : null}
              </View>
              <AppText variant="subhead" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
                {t('Sammenlign')}
              </AppText>
            </Tappable>
            <Tappable
              onPress={() => toggleFavorite(business.id)}
              accessibilityLabel={
                favorite
                  ? t('Fjern {name} fra gemte', { name: business.name })
                  : t('Gem {name}', { name: business.name })
              }
              accessibilityState={{ selected: favorite }}
              style={styles.heart}>
              <Icon
                name={favorite ? 'heartFill' : 'heart'}
                size={19}
                color={favorite ? colors.brand : colors.textSecondary}
                weight="semibold"
              />
            </Tappable>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.right}>
          {/* The price is in the summary on the left, so VoiceOver skips this copy. */}
          <Tappable
            onPress={openPage}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pressedOpacity={0.75}
            style={styles.price}>
            <AppText variant="footnote" tone="textSecondary" align="right" maxFontSizeMultiplier={1.3}>
              {t('fra')}
            </AppText>
            <PriceText value={business.pricing.hourlyMin} currency={currency} align="right" />
            <AppText variant="footnote" tone="textSecondary" align="right" maxFontSizeMultiplier={1.3}>
              {t('pr. time')}
            </AppText>
          </Tappable>
          <Button
            title={t('Se priser')}
            size="small"
            block
            // The column is narrow: less side padding leaves room for "See prices" at larger text.
            style={styles.pricesButton}
            onPress={openPage}
            accessibilityLabel={t('Se priser hos {name}', { name: business.name })}
          />
        </View>
      </View>
      {/* The selected outline is drawn on top and takes no space, so choosing a card never moves the layout. */}
      {comparing ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.outline, { borderColor: colors.brand }]} />
      ) : null}
    </Card>
  );
}

const RIBBONS: Record<Ribbon, () => { label: string; tone: BadgeTone; icon?: IconName }> = {
  match: () => ({ label: t('Bedste match'), tone: 'brand' }),
  price: () => ({ label: t('Billigst'), tone: 'sun' }),
  distance: () => ({ label: t('Nærmest'), tone: 'sky' }),
};

function Dot() {
  return (
    <AppText variant="footnote" tone="textTertiary" accessible={false}>
      ·
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card },
  outline: { borderRadius: Radius.card, borderCurve: 'continuous', borderWidth: 2 },
  columns: { flexDirection: 'row' },
  left: { flex: 1, minWidth: 0 },
  main: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  ribbons: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  identity: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  titleText: { flex: 1, gap: 1 },
  // An inline view rests on the baseline; this lowers the seal to the middle of the letters.
  seal: { width: 16, height: 16, transform: [{ translateY: 2 }] },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.xs + 1, rowGap: 2 },
  // The open status starts with its own coloured dot, so it needs no "·" and can start a line.
  free: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingBottom: Spacing.xs,
    minHeight: MinTouchSize + Spacing.xs,
  },
  compare: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: MinTouchSize, paddingRight: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { width: MinTouchSize, height: MinTouchSize, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  right: {
    width: PRICE_COLUMN,
    padding: Spacing.md,
    paddingLeft: Spacing.sm,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  price: { alignItems: 'flex-end' },
  pricesButton: { paddingHorizontal: Spacing.sm },
});
