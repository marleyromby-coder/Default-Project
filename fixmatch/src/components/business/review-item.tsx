import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Stars } from '@/components/ui/stars';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import type { Review } from '@/state/community';
import { confirmReport } from '@/state/reports';

/**
 * Reports a review that breaks the rules (DSA art. 16, App Store guideline 1.2). It is hidden
 * on this phone at once; without a server the report goes by e-mail with the review's id.
 */
function reportReview(business: Business, reviewId: string) {
  confirmReport({
    kind: 'review',
    id: reviewId,
    subject: t('Rapportér anmeldelse af {name}', { name: business.name }),
    body: t('Anmeldelse {id} hos {name} bryder reglerne, fordi:', { id: reviewId, name: business.name }),
  });
}

/**
 * One FixMatch review: the reviewer's initial, the stars, the job and date, the text and
 * "Rapportér". On the business page (CustomerCard) and in "Alle anmeldelser".
 */
export function ReviewItem({
  business,
  review,
  style,
}: {
  business: Business;
  review: Review;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  const job = review.job
    ? business.categories.flatMap((id) => getCategory(id)?.jobs ?? []).find((j) => j.id === review.job)?.name
    : undefined;

  return (
    <View style={[styles.review, style]}>
      <View style={styles.head}>
        <View style={[styles.initial, { backgroundColor: colors.brandSoft }]}>
          <AppText variant="footnote" weight="700" style={{ color: colors.brandText }}>
            {review.initial}
          </AppText>
        </View>
        <Stars value={review.rating} size={13} />
        <AppText variant="caption" tone="textSecondary" style={styles.flex}>
          {[review.mine ? t('Din anmeldelse') : undefined, job, formatDate(review.createdAt.slice(0, 10))]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      </View>
      {review.text ? <AppText variant="subhead">{review.text}</AppText> : null}
      {!review.mine ? (
        <Tappable
          onPress={() => reportReview(business, review.id)}
          accessibilityRole="button"
          accessibilityLabel={t('Rapportér anmeldelsen')}
          hitSlop={8}
          style={styles.report}>
          <AppText variant="caption" tone="textSecondary">
            {t('Rapportér')}
          </AppText>
        </Tappable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  review: { gap: Spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  initial: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  report: { alignSelf: 'flex-start' },
});
