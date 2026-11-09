import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, Divider } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { formatPrice, formatPriceRange } from '@/lib/format';
import { defaultQuantity } from '@/lib/matcher';
import { checkQuote, greenDeduction, type QuoteVerdict } from '@/lib/quote-check';
import { parseQuoteLines, type QuoteLine, summarizeQuote } from '@/lib/quote-lines';
import { useApp, useMarket } from '@/state/app-state';
import { useSharedPrices } from '@/state/community';
import { t } from '@/i18n';

const VERDICT: Record<QuoteVerdict, { label: string; tone: BadgeTone }> = {
  low: { label: t('Lav'), tone: 'info' },
  normal: { label: t('Normal'), tone: 'success' },
  high: { label: t('Lidt høj'), tone: 'warning' },
  veryHigh: { label: t('Høj'), tone: 'danger' },
};

const EXAMPLE = `Udskiftning af toilet 4.800,00
Nyt blandingsbatteri 2.100,00
Arbejdsløn 3 timer 1.950,00
Materialer 2.400,00
Moms 25 % 2.812,50
I alt 14.062,50 kr.`;

/**
 * "Tjek hele tilbuddet": a photo of the quote plus its text. Every line with a price is
 * checked against what the job normally costs; labour is found for the deduction. The text
 * comes from the phone's own text recognition (copy from the photo), so nothing leaves the phone.
 */
export default function QuotePhotoScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { state } = useApp();
  const { market } = useMarket();
  const shared = useSharedPrices();
  const [photo, setPhoto] = useState<string>();
  const [text, setText] = useState('');

  const lines = parseQuoteLines(text);
  const summary = lines.length > 0 ? summarizeQuote(lines) : undefined;
  const paid = shared.filter((r) => r.country === market.country);

  const checkLine = (line: QuoteLine) => {
    if (!line.job || !line.category) return undefined;
    return checkQuote({
      price: line.amount,
      job: line.job,
      category: line.category,
      quantity: line.quantity ?? defaultQuantity(line.job),
      businesses: state.businesses,
      market,
      origin: state.location.coords,
      paid,
    });
  };

  const pick = async (camera: boolean) => {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const paste = async () => {
    const clip = await Clipboard.getStringAsync().catch(() => '');
    if (clip.trim()) setText(clip.trim());
  };

  const deduction = summary && summary.labour > 0 ? greenDeduction(summary.labour) : undefined;
  const flagged = lines.filter((l) => {
    const check = checkLine(l);
    return check && (check.verdict === 'high' || check.verdict === 'veryHigh');
  });

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('Tjek hele tilbuddet') }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <AppText variant="callout" tone="textSecondary">
          {t(
            'Tag et billede af tilbuddet, og sæt teksten ind. Så tjekker vi hver linje mod det, opgaven normalt koster, og finder arbejdslønnen til fradraget.',
          )}
        </AppText>

        <Card>
          <CardTitle title={t('1. Billede af tilbuddet')} icon="camera" />
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={[styles.photo, { backgroundColor: colors.surfaceAlt }]}
              contentFit="contain"
            />
          ) : null}
          <View style={styles.buttons}>
            {Platform.OS !== 'web' ? (
              <Button
                title={photo ? t('Tag nyt billede') : t('Tag billede')}
                icon="camera"
                variant="secondary"
                size="small"
                onPress={() => pick(true).catch(() => undefined)}
              />
            ) : null}
            <Button
              title={t('Vælg fra billeder')}
              icon="photo"
              variant="secondary"
              size="small"
              onPress={() => pick(false).catch(() => undefined)}
            />
          </View>
          <AppText variant="caption" tone="textSecondary" style={styles.spaced}>
            {t('Billedet bliver på telefonen. Det er kun til dig, så du har tilbuddet ved hånden.')}
          </AppText>
        </Card>

        <Card>
          <CardTitle title={t('2. Teksten fra tilbuddet')} icon="receipt" />
          <AppText variant="footnote" tone="textSecondary" style={styles.spaced}>
            {Platform.OS === 'ios'
              ? t(
                  'Åbn billedet i Fotos, hold fingeren på teksten, vælg Kopiér, og sæt den ind her. Eller skriv linjerne selv.',
                )
              : t('Kopiér teksten fra tilbuddet, og sæt den ind her. Eller skriv linjerne selv.')}
          </AppText>
          <View style={styles.spaced}>
            <TextField
              label={t('Linjer med pris')}
              multiline
              value={text}
              onChangeText={setText}
              placeholder={EXAMPLE}
              autoCorrect={false}
            />
          </View>
          <View style={styles.buttons}>
            <Button title={t('Sæt ind')} icon="receipt" variant="secondary" size="small" onPress={paste} />
            {!text ? (
              <Button title={t('Prøv med et eksempel')} variant="plain" size="small" onPress={() => setText(EXAMPLE)} />
            ) : null}
          </View>
        </Card>

        {summary && lines.length > 0 ? (
          <Card>
            <CardTitle title={t('3. Vores vurdering')} icon="check" />
            <View
              style={[
                styles.verdict,
                styles.spaced,
                { backgroundColor: flagged.length > 0 ? colors.warningSoft : colors.successSoft },
              ]}>
              <Icon
                name={flagged.length > 0 ? 'flag' : 'check'}
                size={16}
                color={flagged.length > 0 ? colors.warning : colors.success}
                weight="semibold"
              />
              <AppText variant="subhead" style={styles.flex}>
                {flagged.length > 0
                  ? t('{count} af {total} linjer ligger over det normale. Spørg, hvad der er med i prisen.', {
                      count: flagged.length,
                      total: lines.filter((l) => l.kind === 'job').length,
                    })
                  : lines.some((l) => l.kind === 'job')
                    ? t('De opgaver, vi kender, ligger inden for det normale.')
                    : t(
                        'Vi genkender ingen af opgaverne. Skriv fx "Udskiftning af toilet 4.800" for at få dem tjekket.',
                      )}
              </AppText>
            </View>
            {lines.map((line, index) => {
              const check = checkLine(line);
              return (
                <View key={`${index}-${line.text}`}>
                  <Divider />
                  <View style={styles.line}>
                    <View style={styles.flex}>
                      <AppText variant="subhead" numberOfLines={2}>
                        {line.text}
                      </AppText>
                      {check && line.job ? (
                        <AppText variant="caption" tone="textSecondary">
                          {t('{job}: normalt {range}', {
                            job: line.job.name,
                            range: formatPriceRange(check.min, check.max, 'opgave', market.currency),
                          })}
                        </AppText>
                      ) : line.kind === 'labour' ? (
                        <AppText variant="caption" tone="textSecondary">
                          {t('Arbejdsløn, tæller til fradraget')}
                        </AppText>
                      ) : line.kind === 'total' ? (
                        <AppText variant="caption" tone="textSecondary">
                          {t('I alt')}
                        </AppText>
                      ) : null}
                    </View>
                    {check ? <Badge label={VERDICT[check.verdict].label} tone={VERDICT[check.verdict].tone} /> : null}
                  </View>
                </View>
              );
            })}
            <Divider />
            <View style={styles.sum}>
              <AppText variant="subhead" tone="textSecondary" style={styles.flex}>
                {t('Tilbuddet i alt')}
              </AppText>
              <AppText variant="headline" tabular>
                {formatPrice(summary.total, market.currency)}
              </AppText>
            </View>
            {deduction ? (
              <AppText variant="footnote" tone="textSecondary">
                {t('Arbejdsløn fundet: {labour}. Er det grøn istandsættelse, giver fradraget cirka {saving} tilbage.', {
                  labour: formatPrice(summary.labour, market.currency),
                  saving: formatPrice(deduction.saving, market.currency),
                })}
              </AppText>
            ) : (
              <AppText variant="footnote" tone="textSecondary">
                {t('Vi fandt ingen linje med arbejdsløn. Bed om at få den skrevet på, hvis du vil bruge fradraget.')}
              </AppText>
            )}
            {!summary.mentionsVat ? (
              <AppText variant="footnote" tone="textSecondary">
                {t('Tilbuddet nævner ikke moms. Spørg, om priserne er med moms.')}
              </AppText>
            ) : null}
            {flagged[0]?.job && flagged[0].category ? (
              <Button
                title={t('Se billigere for {job}', { job: flagged[0].job.name })}
                variant="secondary"
                size="small"
                onPress={() =>
                  router.push({
                    pathname: '/tilbudstjek',
                    params: {
                      kategori: flagged[0].category!,
                      opgave: flagged[0].job!.id,
                      pris: String(flagged[0].amount),
                    },
                  })
                }
              />
            ) : null}
          </Card>
        ) : null}

        <AppText variant="caption" tone="textSecondary" align="center">
          {t('Vurderingen er vejledende. Billedet og teksten bliver på din telefon.')}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg },
  spaced: { marginTop: Spacing.sm },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  photo: { width: '100%', height: 220, borderRadius: Radius.md, marginTop: Spacing.sm },
  verdict: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  sum: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
});
