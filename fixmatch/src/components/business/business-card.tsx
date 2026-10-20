import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Photo } from '@/components/ui/photo';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance, formatHourly, formatPriceRange, formatRating } from '@/lib/format';
import { getOpenStatus } from '@/lib/opening-hours';
import type { ScoredBusiness } from '@/lib/ranking';
import type { JobType } from '@/lib/types';
import { useApp } from '@/state/app-state';

import { MatchBadge } from './match-badge';
import { OpenStatus } from './open-status';
import { TrustpilotRating } from './trustpilot-rating';

interface Props {
  item: ScoredBusiness;
  /** When the user searched for a job, show that job's price instead of the hourly rate. */
  job?: JobType;
  rank?: number;
  onCompareLimit?: () => void;
}

export function BusinessCard({ item, job, rank, onCompareLimit }: Props) {
  const colors = useTheme();
  const { state, toggleFavorite, toggleCompare } = useApp();
  const { business, distanceKm, score } = item;
  const favorite = state.favorites.includes(business.id);
  const comparing = state.compare.includes(business.id);
  const jobPrice = job ? business.pricing.examples.find((e) => e.job === job.id) : undefined;
  const priceText = jobPrice
    ? `${job?.name}: ${formatPriceRange(jobPrice.min, jobPrice.max, jobPrice.unit)}`
    : formatHourly(business.pricing.hourlyMin, business.pricing.hourlyMax);
  const authorized = business.authorizations.length > 0;
  const open = getOpenStatus(business.hours);

  const onCompare = () => {
    if (!toggleCompare(business.id)) onCompareLimit?.();
  };

  const summary = [
    rank ? `Nummer ${rank}` : undefined,
    business.name,
    `match ${score} ud af 100`,
    business.trustpilot ? `TrustScore ${formatRating(business.trustpilot.score)} på Trustpilot` : 'ingen Trustpilot-profil',
    priceText.replace('–', ' til ').replace('kr./time', 'kroner i timen').replace('kr.', 'kroner'),
    `${formatDistance(distanceKm)} væk`,
    open.label,
    authorized ? 'autoriseret' : undefined,
    business.demo ? 'eksempelvirksomhed' : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Tappable
      onPress={() => router.push({ pathname: '/virksomhed/[id]', params: { id: business.id } })}
      accessibilityLabel={summary}
      accessibilityHint="Åbner virksomhedens side med telefonnummer og hjemmeside"
      accessibilityActions={[
        { name: 'favorite', label: favorite ? 'Fjern fra gemte' : 'Gem' },
        { name: 'compare', label: comparing ? 'Fjern fra sammenligning' : 'Sammenlign' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'favorite') toggleFavorite(business.id);
        if (event.nativeEvent.actionName === 'compare') onCompare();
      }}
      pressedOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: comparing ? colors.brand : colors.border }]}>
      <View style={styles.top}>
        <Photo photo={business.photo} category={business.categories[0]} width={300} style={styles.photo} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <AppText variant="headline" numberOfLines={2}>
                {business.name}
              </AppText>
              <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
                {business.tagline}
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
            <AppText variant="footnote" tone="textSecondary">
              {formatDistance(distanceKm)}
            </AppText>
            <AppText variant="footnote" tone="textTertiary">
              ·
            </AppText>
            <OpenStatus business={business} />
          </View>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.badges}>
          {authorized ? <Badge label="Autoriseret" tone="success" icon="shield" /> : null}
          {business.emergency ? <Badge label="Døgnvagt" tone="warning" icon="bolt" /> : null}
        </View>
        <Tappable
          onPress={() => toggleFavorite(business.id)}
          accessibilityLabel={favorite ? `Fjern ${business.name} fra gemte` : `Gem ${business.name}`}
          accessibilityState={{ selected: favorite }}
          style={styles.footerButton}>
          <Icon name={favorite ? 'heartFill' : 'heart'} size={19} color={favorite ? colors.brand : colors.textSecondary} weight="semibold" />
        </Tappable>
        <Tappable
          onPress={onCompare}
          accessibilityLabel={comparing ? `Fjern ${business.name} fra sammenligning` : `Sammenlign ${business.name}`}
          accessibilityState={{ selected: comparing }}
          style={[
            styles.compareButton,
            comparing ? { backgroundColor: colors.brandStrong } : { backgroundColor: colors.brandSoft },
          ]}>
          <Icon name={comparing ? 'check' : 'plus'} size={13} color={comparing ? colors.onBrand : colors.brandText} weight="bold" />
          <AppText variant="footnote" weight="600" style={{ color: comparing ? colors.onBrand : colors.brandText }} maxFontSizeMultiplier={1.3}>
            {comparing ? 'Valgt' : 'Sammenlign'}
          </AppText>
        </Tappable>
      </View>
    </Tappable>
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
