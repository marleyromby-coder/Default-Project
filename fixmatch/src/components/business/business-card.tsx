import { router } from 'expo-router';
import { type ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
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
import type { JobType } from '@/lib/types';
import { isTopRated, isVerified } from '@/lib/verification';
import { answerRateText, useAnswerRate } from '@/state/answers';
import { useApp } from '@/state/app-state';

import { AvailabilityBadge } from './availability-badge';
import { BusinessMark } from './business-mark';
import { MatchBadge } from './match-badge';
import { OpenStatus } from './open-status';
import { ReviewRating } from './review-rating';
import { VerifiedMark } from './verified-mark';
import { t } from '@/i18n';

interface Props {
  item: ScoredBusiness;
  /** When the user searched for a job, show that job's price instead of the hourly rate. */
  job?: JobType;
  rank?: number;
  onCompareLimit?: () => void;
  /** Replaces the price line, e.g. a job price for 25 m². */
  priceOverride?: string;
  /** Extra badge shown first in the footer, e.g. "Inden for budget". */
  highlight?: { label: string; tone: BadgeTone; icon?: IconName };
}

export function BusinessCard({ item, job, rank, onCompareLimit, priceOverride, highlight }: Props) {
  const colors = useTheme();
  const { state, toggleFavorite, toggleCompare } = useApp();
  const { business, distanceKm, score } = item;
  const favorite = state.favorites.includes(business.id);
  const comparing = state.compare.includes(business.id);
  const jobPrice = job ? business.pricing.examples.find((e) => e.job === job.id) : undefined;
  const priceText =
    priceOverride ??
    (jobPrice
      ? `${job?.name}: ${formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit, currencyOf(business))}`
      : formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax, currencyOf(business)));
  const authorized = business.authorizations.length > 0;
  const verified = isVerified(business);
  const topRated = isTopRated(business);
  const open = getOpenStatus(business.hours, undefined, timeZoneOf(business));
  const free = availableWhen(business);
  const answers = answerRateText(useAnswerRate(business));

  const onCompare = () => {
    if (!toggleCompare(business.id)) onCompareLimit?.();
  };

  const summary = [
    rank ? t('Nummer {rank}', { rank }) : undefined,
    business.name,
    verified ? t('verificeret af FixMatch') : undefined,
    topRated ? t('topbedømt') : undefined,
    highlight?.label,
    t('match {score} ud af 100', { score }),
    reviewRatingLabel(business.reviewSummary),
    speakablePrice(priceText),
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

  // At most two badges, so the footer stays one row; the rest is in the summary and on the page.
  const badges = [
    highlight ? <Badge key="highlight" label={highlight.label} tone={highlight.tone} icon={highlight.icon} /> : null,
    free ? <AvailabilityBadge key="free" business={business} /> : null,
    business.emergency ? <Badge key="emergency" label={t('Døgnvagt')} tone="warning" icon="bolt" /> : null,
    authorized ? <Badge key="authorized" label={t('Autoriseret')} tone="brand" icon="shield" /> : null,
  ]
    .filter((badge) => badge !== null)
    .slice(0, 2);

  return (
    <View
      style={[
        styles.card,
        // The selected outline is always there, so choosing a card never moves the layout.
        { backgroundColor: colors.surface, borderColor: comparing ? colors.brand : 'transparent' },
      ]}>
      <Tappable
        onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
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
        style={styles.top}>
        <BusinessMark business={business} size={56} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <View style={styles.nameRow}>
                <AppText variant="headline" numberOfLines={2} style={styles.flexShrink}>
                  {business.name}
                </AppText>
                {verified ? (
                  <View style={styles.seal}>
                    <VerifiedMark business={business} />
                  </View>
                ) : null}
              </View>
              <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                {businessText(business).tagline}
              </AppText>
            </View>
            <MatchBadge score={score} />
          </View>
          <ReviewRating summary={business.reviewSummary} />
          <AppText variant="subhead" weight="600" tabular numberOfLines={1}>
            {priceText}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="footnote" tone="textSecondary" numberOfLines={1} style={styles.noShrink}>
              {formatDistance(distanceKm)}
            </AppText>
            <AppText variant="footnote" tone="textTertiary">
              ·
            </AppText>
            <OpenStatus business={business} />
          </View>
        </View>
      </Tappable>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <FittingBadges badges={badges} />
        <Tappable
          onPress={() => toggleFavorite(business.id)}
          accessibilityLabel={
            favorite ? t('Fjern {name} fra gemte', { name: business.name }) : t('Gem {name}', { name: business.name })
          }
          accessibilityState={{ selected: favorite }}
          style={styles.footerButton}>
          <Icon
            name={favorite ? 'heartFill' : 'heart'}
            size={19}
            color={favorite ? colors.brand : colors.textSecondary}
            weight="semibold"
          />
        </Tappable>
        <Tappable
          onPress={onCompare}
          accessibilityLabel={
            comparing
              ? t('Fjern {name} fra sammenligning', { name: business.name })
              : t('Sammenlign {name}', { name: business.name })
          }
          accessibilityState={{ selected: comparing }}
          style={styles.compareButton}>
          <Icon name={comparing ? 'check' : 'plus'} size={13} color={colors.brandText} weight="bold" />
          <AppText variant="footnote" weight="600" tone="brandText" maxFontSizeMultiplier={1.3}>
            {comparing ? t('Valgt') : t('Sammenlign')}
          </AppText>
        </Tappable>
      </View>
    </View>
  );
}

/**
 * The footer badges on one row. A badge that does not fit whole on a narrow screen is hidden,
 * also from screen readers, instead of being cut off; the first one always shows.
 */
function FittingBadges({ badges }: { badges: ReactElement[] }) {
  const [width, setWidth] = useState(0);
  const [ends, setEnds] = useState<number[]>([]);
  return (
    <View style={styles.badges} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {badges.map((badge, index) => {
        const end = ends[index];
        const fits = index === 0 || (width > 0 && end !== undefined && end <= width + 0.5);
        return (
          <View
            key={badge.key}
            onLayout={(event) => {
              const { x, width: badgeWidth } = event.nativeEvent.layout;
              setEnds((current) => {
                if (current[index] === x + badgeWidth) return current;
                const next = [...current];
                next[index] = x + badgeWidth;
                return next;
              });
            }}
            style={fits ? null : styles.hidden}
            accessibilityElementsHidden={!fits}
            importantForAccessibility={fits ? 'auto' : 'no-hide-descendants'}>
            {badge}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderCurve: 'continuous', borderWidth: 2, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  body: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  titleText: { flex: 1, gap: Spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  // Puts the seal beside the first line of a two-line name.
  seal: { paddingTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  flexShrink: { flexShrink: 1 },
  noShrink: { flexShrink: 0 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: MinTouchSize + 4,
  },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'nowrap', overflow: 'hidden', gap: Spacing.xs },
  hidden: { opacity: 0 },
  footerButton: { width: MinTouchSize, height: MinTouchSize, alignItems: 'center', justifyContent: 'center' },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minHeight: MinTouchSize,
  },
});
