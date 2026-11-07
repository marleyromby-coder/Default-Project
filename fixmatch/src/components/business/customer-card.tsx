import { router } from 'expo-router';
import { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import { Tappable } from '@/components/ui/tappable';
import { AppText } from '@/components/ui/text';
import { APP_INFO } from '@/constants/app-info';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { currencyOf } from '@/lib/business-text';
import { formatDate, formatPriceRange, formatRating } from '@/lib/format';
import { MIN_PAID_PRICES } from '@/lib/prices';
import type { Business, JobType } from '@/lib/types';
import { t } from '@/i18n';
import {
  loadReviews,
  loadSharedPrices,
  useCanReview,
  useMyReview,
  useReviews,
  useReviewSummary,
  useSharedPrices,
} from '@/state/community';

/** Reports a review that breaks the rules (DSA art. 16): an e-mail with the review's id. */
function reportReview(business: Business, reviewId: string) {
  const subject = encodeURIComponent(t('Rapportér anmeldelse af {name}', { name: business.name }));
  const body = encodeURIComponent(
    t('Anmeldelse {id} hos {name} bryder reglerne, fordi:', { id: reviewId, name: business.name }) + '\n\n',
  );
  Linking.openURL(`mailto:${APP_INFO.email}?subject=${subject}&body=${body}`).catch(() => undefined);
}

/** Reviews shown on the page; the rest are a tap away later. */
const SHOWN_REVIEWS = 5;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * "Kundernes erfaringer": reviews and prices from people who contacted the business through
 * FixMatch. Only they can add either, so both are real. Prices show from 3 reports per job.
 */
export function CustomerCard({ business }: { business: Business }) {
  const colors = useTheme();
  const reviews = useReviews(business.id);
  const summary = useReviewSummary(business.id);
  const canReview = useCanReview(business.id);
  const mine = useMyReview(business.id);
  const shared = useSharedPrices();

  useEffect(() => {
    loadReviews(business.id).catch(() => undefined);
    loadSharedPrices(business.country ?? 'DK').catch(() => undefined);
  }, [business.id, business.country]);

  const jobs = business.categories.flatMap((id) => getCategory(id)?.jobs ?? []);
  const paid = jobs
    .map((job: JobType) => {
      const reports = shared.filter((r) => r.businessId === business.id && r.job === job.id);
      const perUnit = reports
        .map((r) => (job.unit === 'opgave' ? r.total : r.total / Math.max(1, r.quantity)))
        .sort((a, b) => a - b);
      return { job, perUnit };
    })
    .filter(({ perUnit }) => perUnit.length >= MIN_PAID_PRICES);

  return (
    <Card>
      <CardTitle title={t('Kundernes erfaringer')} icon="people" />
      {summary ? (
        <View
          style={styles.summary}
          accessible
          accessibilityLabel={t('{rating} af 5 stjerner fra {count} kunder via FixMatch', {
            rating: formatRating(summary.average),
            count: summary.reviews,
          })}>
          <AppText variant="title2" rounded>
            {formatRating(summary.average)}
          </AppText>
          <View style={styles.flex}>
            <Stars value={summary.average} size={16} />
            <AppText variant="footnote" tone="textSecondary">
              {summary.reviews === 1
                ? t('1 anmeldelse fra en kunde via FixMatch')
                : t('{count} anmeldelser fra kunder via FixMatch', { count: summary.reviews })}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
          {t('Ingen anmeldelser endnu. Kun kunder, der har kontaktet virksomheden gennem FixMatch, kan anmelde.')}
        </AppText>
      )}

      {reviews.slice(0, SHOWN_REVIEWS).map((review) => (
        <View key={review.id} style={styles.review}>
          <Divider />
          <View style={styles.reviewHead}>
            <View style={[styles.initial, { backgroundColor: colors.brandSoft }]}>
              <AppText variant="footnote" weight="700" style={{ color: colors.brandText }}>
                {review.initial}
              </AppText>
            </View>
            <Stars value={review.rating} size={13} />
            <AppText variant="caption" tone="textSecondary" style={styles.flex}>
              {[
                review.mine ? t('Din anmeldelse') : undefined,
                review.job ? jobs.find((j) => j.id === review.job)?.name : undefined,
                formatDate(review.createdAt.slice(0, 10)),
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>
          {review.text ? <AppText variant="subhead">{review.text}</AppText> : null}
          {!review.mine ? (
            <Tappable
              onPress={() => reportReview(business, review.id)}
              accessibilityRole="link"
              accessibilityLabel={t('Rapportér anmeldelsen')}
              hitSlop={8}
              style={styles.report}>
              <AppText variant="caption" tone="textSecondary">
                {t('Rapportér')}
              </AppText>
            </Tappable>
          ) : null}
        </View>
      ))}

      {paid.length > 0 ? (
        <View style={styles.paid}>
          <Divider />
          <AppText variant="subhead" weight="600">
            {t('Det har kunder betalt')}
          </AppText>
          {paid.map(({ job, perUnit }) => (
            <View key={job.id} style={styles.paidRow}>
              <AppText variant="subhead" style={styles.flex}>
                {job.name}
              </AppText>
              <AppText variant="subhead" weight="600">
                {formatPriceRange(
                  Math.round(percentile(perUnit, 0.2)),
                  Math.round(percentile(perUnit, 0.8)),
                  job.unit,
                  currencyOf(business),
                )}
              </AppText>
            </View>
          ))}
          <AppText variant="caption" tone="textSecondary">
            {t('Fra fakturaer, kunder har delt. Vises fra {min} priser pr. opgave.', { min: MIN_PAID_PRICES })}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canReview ? (
          <>
            <Button
              title={mine ? t('Ret din anmeldelse') : t('Skriv en anmeldelse')}
              icon="star"
              variant="secondary"
              size="small"
              onPress={() => router.push({ pathname: '/anmeld', params: { id: business.id } })}
            />
            <Button
              title={t('Del, hvad du betalte')}
              icon="receipt"
              variant="secondary"
              size="small"
              onPress={() => router.push({ pathname: '/del-pris', params: { id: business.id } })}
            />
          </>
        ) : (
          <AppText variant="caption" tone="textSecondary">
            {t('Når du har ringet til dem gennem FixMatch, kan du anmelde dem og dele, hvad du betalte.')}
          </AppText>
        )}
      </View>
      <Button
        title={t('Sådan virker anmeldelserne')}
        variant="plain"
        size="small"
        onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'anmeldelser' } })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spaced: { marginTop: Spacing.xs },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  review: { gap: Spacing.xs, marginTop: Spacing.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  initial: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  paid: { gap: Spacing.xs, marginTop: Spacing.sm },
  report: { alignSelf: 'flex-start' },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
});
