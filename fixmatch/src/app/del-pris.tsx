import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { countryOf } from '@/lib/business-text';
import { showDialog } from '@/lib/dialog';
import { currencySymbol } from '@/lib/format';
import { getMarket, taxNote } from '@/lib/markets';
import { msg, t } from '@/i18n';
import { useAccount } from '@/state/account';
import { useBusiness } from '@/state/app-state';
import { postalArea, reportPrice, useCanReview } from '@/state/community';

/** "12.500 kr." typed in any way → 12500. Empty or zero → undefined. */
function amount(text: string): number | undefined {
  const value = Number(text.replace(/\D/g, ''));
  return value > 0 ? value : undefined;
}

/** When the work was paid for, as the first day of the month (no exact dates needed). */
const WHEN = [
  { months: 0, label: msg('Denne måned') },
  { months: 1, label: msg('Sidste måned') },
  { months: 3, label: msg('For 2–6 måneder siden') },
  { months: 9, label: msg('For mere end et halvt år siden') },
] as const;

function monthsAgo(months: number, now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  return date.toISOString().slice(0, 10);
}

/**
 * "Del, hvad du betalte": after contacting a business through FixMatch, a user shares what
 * the job cost. Only the amount, the job, the month and the first two digits of the postal
 * code are shared, never who paid. The prices make Tilbudstjek and the price ranges real.
 */
export default function SharePriceScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness(id);
  const account = useAccount();
  const contacted = useCanReview(business?.id);
  const [jobId, setJobId] = useState<string>();
  const [totalText, setTotalText] = useState('');
  const [labourText, setLabourText] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [when, setWhen] = useState(0);
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

  const market = getMarket(countryOf(business));
  const jobs = business.categories.flatMap((id) => getCategory(id)?.jobs.map((job) => ({ job, category: id })) ?? []);
  const picked = jobs.find((j) => j.job.id === jobId);
  const total = amount(totalText);
  const labour = amount(labourText);
  const quantity = picked && picked.job.unit !== 'opgave' ? (amount(quantityText) ?? 0) : 1;
  const ready = !!picked && !!total && quantity > 0 && (labour === undefined || labour <= total);

  if (!contacted) {
    return (
      <EmptyState
        icon="phone"
        title={t('Ring til dem først')}
        message={t('Du kan dele, hvad du betalte, når du har kontaktet virksomheden gennem FixMatch.')}
        action={<Button title={t('Luk')} onPress={() => router.back()} />}
      />
    );
  }

  const send = async () => {
    if (!picked || !total) return;
    setBusy(true);
    try {
      await reportPrice(
        {
          businessId: business.id,
          country: market.country,
          category: picked.category,
          job: picked.job.id,
          total,
          labour,
          quantity,
          postalArea: postalArea(business.address.postalCode),
          paidOn: monthsAgo(WHEN.at(when)?.months ?? 0),
        },
        account.status === 'signedIn' ? account.userId : undefined,
      );
      router.back();
      showDialog(
        t('Tak, fordi du delte'),
        t(
          'Din pris hjælper andre med at se, hvad opgaven koster. Vil du også gemme opgaven i Min bolig med faktura og garanti?',
        ),
        [
          { text: t('Nej tak'), style: 'cancel' },
          {
            text: t('Gem i Min bolig'),
            onPress: () =>
              router.push({
                pathname: '/min-bolig/ny',
                params: {
                  virksomhed: business.id,
                  opgave: picked.job.id,
                  pris: String(total),
                  ...(labour ? { loen: String(labour) } : {}),
                  dato: monthsAgo(WHEN.at(when)?.months ?? 0),
                },
              }),
          },
        ],
      );
    } catch {
      showDialog(t('Det lykkedes ikke'), t('Prisen blev ikke sendt. Tjek internettet, og prøv igen.'));
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
          <AppText variant="title2">{t('Hvad betalte du?')}</AppText>
          <AppText variant="callout" tone="textSecondary">
            {t(
              'Del, hvad opgaven hos {name} kostede. Så kan andre se, hvad det rigtigt koster. Vi deler kun beløbet, opgaven, måneden og de to første cifre i postnummeret, aldrig hvem du er.',
              { name: business.name },
            )}
          </AppText>
        </View>

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Opgave')}
          </AppText>
          <View style={styles.wrap}>
            {jobs.map(({ job }) => (
              <Chip key={job.id} label={job.name} selected={job.id === jobId} onPress={() => setJobId(job.id)} />
            ))}
          </View>
        </View>

        {picked && picked.job.unit !== 'opgave' ? (
          <TextField
            label={picked.job.unit === 'm2' ? t('Antal m²') : t('Antal stk.')}
            keyboardType="number-pad"
            value={quantityText}
            onChangeText={setQuantityText}
          />
        ) : null}
        <TextField
          label={t('Samlet pris i {currency}, {tax}', {
            currency: currencySymbol(market.currency),
            tax: taxNote(market),
          })}
          keyboardType="number-pad"
          value={totalText}
          onChangeText={setTotalText}
          hint={t('Det, der står på fakturaen.')}
        />
        <TextField
          label={t('Heraf arbejdsløn (valgfrit)')}
          keyboardType="number-pad"
          value={labourText}
          onChangeText={setLabourText}
          error={
            labour !== undefined && total !== undefined && labour > total
              ? t('Arbejdslønnen kan ikke være mere end den samlede pris.')
              : undefined
          }
        />

        <View style={styles.block}>
          <AppText variant="subhead" weight="600" tone="textSecondary" accessibilityRole="header">
            {t('Hvornår?')}
          </AppText>
          <View style={styles.wrap}>
            {WHEN.map((option, index) => (
              <Chip
                key={option.label}
                label={t(option.label)}
                selected={when === index}
                onPress={() => setWhen(index)}
              />
            ))}
          </View>
        </View>

        <View style={styles.privacy}>
          <Icon name="privacy" size={15} color={colors.textSecondary} />
          <AppText variant="caption" tone="textSecondary" style={styles.flex}>
            {t('Priser vises først, når mindst 3 har delt for samme opgave. Du kan rette din pris ved at dele igen.')}
          </AppText>
        </View>

        <Button title={t('Del prisen')} size="large" onPress={send} loading={busy} disabled={!ready} block />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  block: { gap: Spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  privacy: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
});
