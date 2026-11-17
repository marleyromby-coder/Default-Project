import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReviewItem } from '@/components/business/review-item';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Stars } from '@/components/ui/stars';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { formatRating } from '@/lib/format';
import type { Business } from '@/lib/types';
import { t } from '@/i18n';
import { useBusiness } from '@/state/app-state';
import {
  fetchReviewPage,
  loadNextPage,
  type Pages,
  type Review,
  useReviews,
  useReviewSummary,
} from '@/state/community';
import { useHiddenIds } from '@/state/reports';

/**
 * "Alle anmeldelser": every FixMatch review of a business, the bad ones too, newest first. The
 * business page shows the 5 newest and links here. Reviews are read 50 at a time while the user
 * scrolls, until a page comes back with fewer.
 */
export default function AllReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  if (!business) {
    return (
      <EmptyState
        icon="help"
        title={t('Virksomheden findes ikke længere')}
        message={t('Linket virker ikke længere.')}
        action={<Button title={t('Tilbage')} onPress={() => router.back()} />}
      />
    );
  }
  return <AllReviews business={business} />;
}

function AllReviews({ business }: { business: Business }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const summary = useReviewSummary(business);
  const hiddenReviews = useHiddenIds('review');
  // Without a server there are no pages, only the user's own review on this phone.
  const own = useReviews(business.id);
  const [pages, setPages] = useState<Pages<Review>>({ items: [], done: false });
  const [status, setStatus] = useState<'loading' | 'idle' | 'failed'>('loading');

  useEffect(() => {
    if (status !== 'loading') return;
    let current = true;
    loadNextPage(pages.items, (from) => fetchReviewPage(business.id, from))
      .then((next) => {
        if (!current) return;
        setPages(next);
        setStatus('idle');
      })
      .catch(() => {
        if (current) setStatus('failed');
      });
    return () => {
      current = false;
    };
  }, [status, pages.items, business.id]);

  const loadMore = () => {
    if (status === 'idle' && !pages.done) setStatus('loading');
  };
  const list = pages.done && pages.items.length === 0 ? own : pages.items;
  // Reviews the user reported are hidden on this phone; their own is always shown.
  const reviews = list.filter((review) => review.mine || !hiddenReviews.has(review.id));

  const header = (
    <View style={styles.header}>
      <AppText variant="title3" numberOfLines={2}>
        {business.name}
      </AppText>
      {summary ? (
        <View
          style={styles.summary}
          accessible
          accessibilityLabel={t('{rating} af 5 stjerner fra {count} brugere via FixMatch', {
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
                ? t('1 anmeldelse fra en bruger via FixMatch')
                : t('{count} anmeldelser fra brugere via FixMatch', { count: summary.reviews })}
            </AppText>
          </View>
        </View>
      ) : null}
      <AppText variant="footnote" tone="textSecondary">
        {t('Alle anmeldelser, også de dårlige, med de nyeste først.')}
      </AppText>
    </View>
  );

  const footer =
    status === 'loading' ? (
      <ActivityIndicator style={styles.footer} color={colors.textSecondary} accessibilityLabel={t('Henter…')} />
    ) : status === 'failed' ? (
      <View style={[styles.footer, styles.failed]}>
        <AppText variant="subhead" tone="textSecondary" align="center">
          {t('Noget gik galt. Prøv igen om lidt.')}
        </AppText>
        <Button title={t('Prøv igen')} variant="plain" onPress={() => setStatus('loading')} />
      </View>
    ) : undefined;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={reviews}
      keyExtractor={(review) => review.id}
      renderItem={({ item }) => (
        <Card>
          <ReviewItem business={business} review={item} />
        </Card>
      )}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={
        status === 'idle' ? (
          <AppText variant="subhead" tone="textSecondary">
            {t('Ingen anmeldelser endnu. Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde.')}
          </AppText>
        ) : undefined
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={[styles.list, column, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.md },
  header: { gap: Spacing.sm, marginBottom: Spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  footer: { marginTop: Spacing.lg },
  failed: { gap: Spacing.xs, alignItems: 'center' },
});
