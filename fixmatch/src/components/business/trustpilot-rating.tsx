import { StyleSheet, View } from 'react-native';

import { Stars } from '@/components/ui/stars';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { formatNumber, formatRating, pluralize } from '@/lib/format';
import type { TrustpilotInfo } from '@/lib/types';
import { t } from '@/i18n';

interface Props {
  trustpilot?: TrustpilotInfo;
  size?: 'small' | 'large';
}

/**
 * Trustpilot TrustScore with its source named. The final design must follow
 * Trustpilot's brand guidelines for licensed partners (see docs/jura).
 */
export function TrustpilotRating({ trustpilot, size = 'small' }: Props) {
  if (!TRUSTPILOT_ENABLED) return null;
  if (!trustpilot) {
    return (
      <AppText variant={size === 'large' ? 'subhead' : 'footnote'} tone="textSecondary">
        {t('Ingen Trustpilot-profil endnu')}
      </AppText>
    );
  }

  const label = t('TrustScore {rating} ud af 5 på Trustpilot, baseret på {countText}', {
    rating: formatRating(trustpilot.score),
    countText: pluralize(trustpilot.reviews, 'anmeldelse', 'anmeldelser'),
  });

  if (size === 'large') {
    return (
      <View style={styles.large} accessible accessibilityLabel={label}>
        <AppText variant="largeTitle" rounded tabular>
          {formatRating(trustpilot.score)}
        </AppText>
        <View style={styles.largeText}>
          <Stars value={trustpilot.score} size={20} />
          <AppText variant="subhead" tone="textSecondary">
            {t('TrustScore på Trustpilot · {countText}', {
              countText: pluralize(trustpilot.reviews, 'anmeldelse', 'anmeldelser'),
            })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.small} accessible accessibilityLabel={label}>
      <Stars value={trustpilot.score} size={13} />
      <AppText variant="footnote" weight="600" tabular>
        {formatRating(trustpilot.score)}
      </AppText>
      <AppText variant="footnote" tone="textSecondary" numberOfLines={1}>
        {t('Trustpilot ({number})', { number: formatNumber(trustpilot.reviews) })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  small: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 1, flexShrink: 1 },
  large: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  largeText: { gap: Spacing.xs, flex: 1 },
});
