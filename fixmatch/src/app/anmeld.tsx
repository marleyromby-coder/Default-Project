import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { MinTouchSize, ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { showDialog } from '@/lib/dialog';
import { msg, t } from '@/i18n';
import { useAccount } from '@/state/account';
import { useBusiness } from '@/state/app-state';
import { MAX_REVIEW_LENGTH, type Review, submitReview, useCanReview, useMyReview } from '@/state/community';

/** What each number of stars means, so ratings mean the same for everyone. */
const STAR_MEANING = [msg('Meget dårligt'), msg('Dårligt'), msg('Okay'), msg('Godt'), msg('Rigtig godt')] as const;

/**
 * A review from a real call: only users who contacted the business through FixMatch can write
 * one, once per business (they can change it later). The contact is the proof that they were
 * a customer, so no fake reviews (markedsføringslovens § 6 b).
 */
export default function ReviewScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  const account = useAccount();
  const contacted = useCanReview(business?.id);
  const mine = useMyReview(business?.id ?? '');
  const [rating, setRating] = useState<Review['rating'] | undefined>(mine?.rating);
  const [text, setText] = useState(mine?.text ?? '');
  const [jobId, setJobId] = useState<string | undefined>(mine?.job);
  const [busy, setBusy] = useState(false);

  if (!business) {
    return (
      <EmptyState
        icon="help"
        title={t('Virksomheden findes ikke længere')}
        message={t('Linket virker ikke længere.')}
        action={<Button title={t('Luk')} onPress={() => router.back()} />}
      />
    );
  }
  if (!contacted) {
    return (
      <EmptyState
        icon="phone"
        title={t('Ring til dem først')}
        message={t(
          'Kun kunder, der har kontaktet virksomheden gennem FixMatch, kan anmelde den. Så er alle anmeldelser ægte.',
        )}
        action={<Button title={t('Luk')} onPress={() => router.back()} />}
      />
    );
  }

  const jobs = business.categories.flatMap((cid) => getCategory(cid)?.jobs ?? []);

  const send = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await submitReview(
        { business, rating, text, job: jobId },
        {
          id: account.status === 'signedIn' ? account.userId : undefined,
          name: account.status === 'signedIn' ? account.profile?.name : undefined,
        },
      );
      router.back();
      showDialog(t('Tak for din anmeldelse'), t('Den hjælper andre med at vælge den rette.'));
    } catch {
      showDialog(t('Det lykkedes ikke'), t('Anmeldelsen blev ikke sendt. Tjek internettet, og prøv igen.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.block}>
          <AppText variant="title2">
            {mine ? t('Ret din anmeldelse') : t('Anmeld {name}', { name: business.name })}
          </AppText>
          <AppText variant="callout" tone="textSecondary">
            {t(
              'Du kan anmelde, fordi du har kontaktet dem gennem FixMatch. Andre ser dit forbogstav, aldrig dit navn.',
            )}
          </AppText>
        </View>

        <View style={styles.block}>
          <View
            style={styles.stars}
            accessibilityRole="adjustable"
            accessibilityLabel={t('Antal stjerner')}
            accessibilityValue={{ min: 1, max: 5, now: rating ?? 0, text: rating ? t(STAR_MEANING[rating - 1]) : '' }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              const next = (rating ?? 0) + (event.nativeEvent.actionName === 'increment' ? 1 : -1);
              if (next >= 1 && next <= 5) setRating(next as Review['rating']);
            }}>
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <Tappable
                key={value}
                onPress={() => setRating(value)}
                accessibilityLabel={t('{count} stjerner', { count: value })}
                style={styles.star}>
                <Icon
                  name="star"
                  size={34}
                  color={rating !== undefined && value <= rating ? colors.star : colors.starEmpty}
                />
              </Tappable>
            ))}
          </View>
          <AppText variant="subhead" tone="textSecondary" align="center">
            {rating ? t(STAR_MEANING[rating - 1]) : t('Tryk på en stjerne')}
          </AppText>
        </View>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Hvad lavede de? (valgfrit)')}
          </AppText>
          <View style={styles.wrap}>
            {jobs.map((job) => (
              <Chip
                key={job.id}
                label={job.name}
                selected={job.id === jobId}
                onPress={() => setJobId(job.id === jobId ? undefined : job.id)}
              />
            ))}
          </View>
        </View>

        <TextField
          label={t('Fortæl lidt mere (valgfrit)')}
          multiline
          maxLength={MAX_REVIEW_LENGTH}
          value={text}
          onChangeText={setText}
          placeholder={t('Fx: Kom til tiden, gav fast pris og ryddede op efter sig.')}
          hint={t('{count} af {max} tegn. Skriv ikke navne eller telefonnumre.', {
            count: text.length,
            max: MAX_REVIEW_LENGTH,
          })}
        />

        <Button
          title={mine ? t('Gem anmeldelsen') : t('Send anmeldelsen')}
          size="large"
          onPress={send}
          loading={busy}
          disabled={!rating}
          block
        />
        <AppText variant="caption" tone="textSecondary" align="center">
          {t(
            'Anmeldelser, der bryder reglerne, kan rapporteres og bliver skjult, hvis de gør. FixMatch ændrer aldrig dit indhold.',
          )}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  block: { gap: Spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs },
  star: { width: MinTouchSize + 4, height: MinTouchSize + 4, alignItems: 'center', justifyContent: 'center' },
});
