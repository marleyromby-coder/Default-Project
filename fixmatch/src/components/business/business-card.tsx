import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { businessText, currencyOf } from '@/lib/business-text';
import { formatDistance, formatHourly, formatPriceRange, formatRating, speakablePrice } from '@/lib/format';
import { getOpenStatus } from '@/lib/opening-hours';
import type { ScoredBusiness } from '@/lib/ranking';
import type { JobType } from '@/lib/types';
import { useApp } from '@/state/app-state';

import { MatchBadge } from './match-badge';
import { OpenStatus } from './open-status';
import { TrustpilotRating } from './trustpilot-rating';
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
  const open = getOpenStatus(business.hours);

  const onCompare = () => {
    if (!toggleCompare(business.id)) onCompareLimit?.();
  };

  const summary = [
    rank ? t('Nummer {rank}', { rank }) : undefined,
    business.name,
    highlight?.label,
    t('match {score} ud af 100', { score }),
    business.trustpilot
      ? t('TrustScore {rating} på Trustpilot', { rating: formatRating(business.trustpilot.score) })
      : t('ingen Trustpilot-profil'),
    speakablePrice(priceText),
    t('{distance} væk', { distance: formatDistance(distanceKm) }),
    open.label,
    authorized ? t('autoriseret') : undefined,
    business.demo ? t('eksempelvirksomhed') : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: comparing ? colors.brand : colors.border }]}>
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
        <Photo photo={business.photo} category={business.categories[0]} width={300} style={styles.photo} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <AppText variant="headline" numberOfLines={2}>
                {business.name}
              </AppText>
              <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                {businessText(business).tagline}
              </AppText>
            </View>
            <MatchBadge score={score} />
          </View>
          <TrustpilotRating trustpilot={business.trustpilot} />
          <View style={styles.metaRow}>
            <Icon name="tag" size={13} color={colors.textSecondary} />
            <AppText variant="footnote" weight="600" numberOfLines={1} style={styles.flexShrink}>
              {priceText}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <Icon name="pin" size={13} color={colors.textSecondary} />
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
        <View style={styles.badges}>
          {highlight ? <Badge label={highlight.label} tone={highlight.tone} icon={highlight.icon} /> : null}
          {authorized ? <Badge label={t('Autoriseret')} tone="success" icon="shield" /> : null}
          {business.emergency ? <Badge label={t('Døgnvagt')} tone="warning" icon="bolt" /> : null}
        </View>
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
          style={[
            styles.compareButton,
            comparing ? { backgroundColor: colors.brandStrong } : { backgroundColor: colors.brandSoft },
          ]}>
          <Icon
            name={comparing ? 'check' : 'plus'}
            size={13}
            color={comparing ? colors.onBrand : colors.brandText}
            weight="bold"
          />
          <AppText
            variant="footnote"
            weight="600"
            style={{ color: comparing ? colors.onBrand : colors.brandText }}
            maxFontSizeMultiplier={1.3}>
            {comparing ? t('Valgt') : t('Sammenlign')}
          </AppText>
        </Tappable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  photo: { width: 88, height: 88, borderRadius: Radius.md },
  body: { flex: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  titleText: { flex: 1, gap: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
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
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  footerButton: { width: MinTouchSize, height: MinTouchSize, alignItems: 'center', justifyContent: 'center' },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    minHeight: 34,
    borderRadius: Radius.pill,
  },
});
