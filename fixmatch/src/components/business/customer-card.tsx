import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReviewItem } from '@/components/business/review-item';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { currencyOf } from '@/lib/business-text';
import { openReviewLink } from '@/lib/contact';
import { formatPriceRange, formatRating } from '@/lib/format';
import { MIN_PAID_PRICES } from '@/lib/prices';
import { reviewRatingLabel } from '@/lib/review-label';
import { reviewSiteName } from '@/lib/review-links';
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
import { useHiddenIds } from '@/state/reports';

/** Reviews shown on the page; "Vis alle" opens the rest (app/virksomhed/anmeldelser/[id].tsx). */
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
 * FixMatch. Only they can add either. Prices show from 3 reports per job. Below the reviews,
 * plain links to the business's profiles on other review sites: the site's name only, never
 * their scores, and they do not count in the FixMatch score.
 */
export function CustomerCard({ business }: { business: Business }) {
  const hiddenReviews = useHiddenIds('review');
  // Reviews the user reported are hidden on this phone; their own is always shown.
  const reviews = useReviews(business.id).filter((review) => review.mine || !hiddenReviews.has(review.id));
  const summary = useReviewSummary(business);
  const canReview = useCanReview(business.id);
  const mine = useMyReview(business.id);
  const shared = useSharedPrices();
  const links = business.reviewLinks ?? [];
  // A demo business's numbers are made up and have no review texts: count only the loaded ones.
  const total = business.demo ? reviews.length : Math.max(summary?.reviews ?? 0, reviews.length);

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
      <CardTitle title={t('Kundernes erfaringer')} />
      {summary ? (
        <View style={styles.summary} accessible accessibilityLabel={reviewRatingLabel(summary)}>
          <AppText variant="title2" rounded>
            {formatRating(summary.average)}
          </AppText>
          <View style={styles.flex}>
            <Stars value={summary.average} size={16} />
            <AppText variant="footnote" tone="textSecondary">
              {summary.reviews === 1
                ? t('1 anmeldelse fra en bruger via FixMatch')
                : t('{count} anmeldelser fra brugere via FixMatch', { count: summary.reviews })}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
          {t('Ingen anmeldelser endnu. Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde.')}
        </AppText>
      )}
      {/* A demo business has a made-up average and count, but no texts: say so instead of showing nothing. */}
      {summary && business.demo && reviews.length === 0 ? (
        <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
          {t('I demoen er anmeldelserne kun tal. Der er ingen tekster at læse.')}
        </AppText>
      ) : null}

      {reviews.slice(0, SHOWN_REVIEWS).map((review) => (
        <View key={review.id} style={styles.review}>
          <Divider />
          <ReviewItem business={business} review={review} style={styles.reviewBody} />
        </View>
      ))}
      {total > SHOWN_REVIEWS ? (
        <Button
          title={t('Vis alle {count} anmeldelser', { count: total })}
          variant="link"
          chevron
          onPress={() => router.push({ pathname: '/virksomhed/anmeldelser/[id]', params: { id: business.id } })}
        />
      ) : null}

      {links.length > 0 ? (
        <View style={styles.elsewhere}>
          <Divider />
          <AppText variant="subhead" weight="600">
            {t('Se anmeldelser andre steder')}
          </AppText>
          <View style={styles.links}>
            {links.map((link) => {
              const site = reviewSiteName(link.site);
              return (
                <Button
                  key={link.url}
                  title={site}
                  variant="link"
                  chevron
                  onPress={() => openReviewLink(business, link)}
                  accessibilityLabel={t('Anmeldelser på {site}, åbner en anden side', { site })}
                />
              );
            })}
          </View>
          <AppText variant="caption" tone="textSecondary">
            {t('Åbner en anden side. FixMatch tjekker ikke anmeldelserne dér, og de tæller ikke med i scoren.')}
          </AppText>
        </View>
      ) : null}

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
            {t('Priser, som brugere selv har delt. Vises fra {min} priser pr. opgave.', { min: MIN_PAID_PRICES })}
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
            {t('Når du har kontaktet dem gennem FixMatch, kan du anmelde dem og dele, hvad du betalte.')}
          </AppText>
        )}
      </View>
      <Button
        title={t('Sådan virker anmeldelserne')}
        variant="link"
        chevron
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
  reviewBody: { marginTop: Spacing.sm },
  paid: { gap: Spacing.xs, marginTop: Spacing.sm },
  elsewhere: { gap: Spacing.sm, marginTop: Spacing.md },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.xl },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
});
