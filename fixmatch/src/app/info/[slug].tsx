import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow, ListSection } from '@/components/ui/list';
import { AppText } from '@/components/ui/text';
import { APP_INFO } from '@/constants/app-info';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { INFO_PAGES, type InfoPage, isInfoSlug } from '@/data/content';
import { useTheme } from '@/hooks/use-theme';
import { openLink } from '@/lib/contact';
import { formatDate } from '@/lib/format';
import { weightsFromPriorities } from '@/lib/ranking';
import { useApp } from '@/state/app-state';
import { t } from '@/i18n';

export default function InfoScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { state } = useApp();

  if (!slug || !isInfoSlug(slug)) {
    return (
      <EmptyState
        icon="help"
        title={t('Siden findes ikke')}
        message={t('Linket virker ikke længere.')}
        action={<Button title={t('Til forsiden')} onPress={() => router.replace('/')} />}
      />
    );
  }

  const page: InfoPage = INFO_PAGES[slug];
  const weights = weightsFromPriorities(state.priorities);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: page.title }} />
      <AppText variant="body">{page.intro}</AppText>

      {slug === 'rangering' ? (
        <View style={[styles.callout, { backgroundColor: colors.brandSoft }]}>
          <AppText variant="subhead" weight="600">
            {t('Din vægtning lige nu')}
          </AppText>
          <AppText variant="subhead">
            {t('Pris {price} % · Afstand {distance} % · Anmeldelser {reviews} %', {
              price: Math.round(weights.price * 100),
              distance: Math.round(weights.distance * 100),
              reviews: Math.round(weights.reviews * 100),
            })}
          </AppText>
          <Button
            title={t('Justér dine prioriteter')}
            variant="plain"
            size="small"
            onPress={() => router.push('/prioriteter')}
            style={styles.alignStart}
          />
        </View>
      ) : null}

      {page.sections.map((section, index) => (
        <View key={section.heading ?? index} style={styles.section}>
          {section.heading ? (
            <AppText variant="headline" accessibilityRole="header">
              {section.heading}
            </AppText>
          ) : null}
          {section.paragraphs?.map((p) => (
            <AppText key={p} variant="body" tone="textSecondary">
              {p}
            </AppText>
          ))}
          {section.bullets?.map((b) => (
            <View key={b} style={styles.bullet}>
              <AppText variant="body" tone="brandText">
                •
              </AppText>
              <AppText variant="body" tone="textSecondary" style={styles.flex}>
                {b}
              </AppText>
            </View>
          ))}
        </View>
      ))}

      {page.links?.length ? (
        <ListSection title={t('Læs mere')}>
          {page.links.map((link) => (
            <ListRow key={link.url} title={link.label} icon="external" external onPress={() => openLink(link.url)} />
          ))}
        </ListSection>
      ) : null}

      {slug === 'privatliv' || slug === 'vilkaar' ? (
        <AppText variant="caption" tone="textSecondary">
          {t('Senest opdateret {date}.', { date: formatDate(APP_INFO.legalUpdated) })}
        </AppText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  callout: { borderRadius: 12, padding: Spacing.lg, gap: Spacing.xs },
  alignStart: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  section: { gap: Spacing.sm },
  bullet: { flexDirection: 'row', gap: Spacing.sm },
});
