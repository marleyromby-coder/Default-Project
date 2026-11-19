import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroPanel } from '@/components/hero-panel';
import { Logo } from '@/components/logo';
import { TradeArt } from '@/components/trade-art';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { IconWell, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/data/categories';
import { GPS_MESSAGES, useGps } from '@/hooks/use-gps';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { showDialog } from '@/lib/dialog';
import { taxNote } from '@/lib/markets';
import { useApp, useMarket } from '@/state/app-state';
import { t } from '@/i18n';

const STEPS = 3;

/** First-launch onboarding. Location is asked for only on the last step, after explaining why. */
export default function WelcomeScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useApp();
  const { market } = useMarket();
  const { locate, busy } = useGps();
  const [step, setStep] = useState(0);

  const finish = () => setOnboarded(true);
  const useLocation = async () => {
    const result = await locate();
    if (result !== 'ok') showDialog(GPS_MESSAGES[result].title, GPS_MESSAGES[result].message);
    finish();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {step === 0 ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <View style={styles.mosaic} importantForAccessibility="no-hide-descendants">
                {[CATEGORIES.slice(0, 4), CATEGORIES.slice(4)].map((row, index) => (
                  <View key={index} style={[styles.mosaicRow, index === 1 ? styles.mosaicOffset : null]}>
                    {row.map((category) => (
                      <TradeArt key={category.id} trade={category.id} size={64} tile radius={0.3} />
                    ))}
                  </View>
                ))}
              </View>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <AppText variant="largeTitle">{t('Find den rette håndværker – hurtigt')}</AppText>
              <AppText variant="body" tone="textSecondary">
                {t('VVS’er, elektriker, tømrer, murer, mekaniker og flere. Lokale virksomheder samlet ét sted.')}
              </AppText>
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <AppText variant="largeTitle" tone="onPanel">
                {t('Sammenlign på det, der betyder noget')}
              </AppText>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <Feature
                icon="tag"
                title={t('Pris')}
                text={t('Timepris og eksempelpriser {tax} – før du ringer.', { tax: taxNote(market) })}
              />
              <Feature icon="pin" title={t('Afstand')} text={t('Se hvem der er tættest på, og hvor langt de kører.')} />
              <Feature
                icon="star"
                title={t('Anmeldelser')}
                text={t('Kun fra brugere, der har kontaktet virksomheden gennem FixMatch.')}
              />
              <Feature
                icon="phone"
                title={t('Ring direkte')}
                text={t('Telefonnummer og hjemmeside lige ved hånden. Ingen mellemled.')}
              />
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <View style={[styles.bigIcon, { backgroundColor: colors.panelRaised }]}>
                <Icon name="location" size={36} color={colors.onPanel} weight="semibold" />
              </View>
              <AppText variant="largeTitle" tone="onPanel">
                {t('Find håndværkere nær dig')}
              </AppText>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <AppText variant="body" tone="textSecondary">
                {t(
                  'Del din placering, så vi kan beregne afstanden til hver virksomhed. Placeringen bliver på din telefon og deles ikke med nogen.',
                )}
              </AppText>
              <AppText variant="footnote" tone="textSecondary">
                {t('Du kan også vælge din by manuelt – nu eller senere.')}
              </AppText>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, column, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={t('Trin {step} af {STEPS}', { step: step + 1, STEPS })}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.brand : colors.border, width: i === step ? 22 : 8 },
              ]}
            />
          ))}
        </View>
        {step < 2 ? (
          <>
            <Button title={t('Fortsæt')} size="large" onPress={() => setStep(step + 1)} block />
            <Button title={t('Spring over')} variant="plain" onPress={finish} />
          </>
        ) : (
          <>
            <Button
              title={t('Del min placering')}
              icon="location"
              size="large"
              onPress={useLocation}
              loading={busy}
              block
            />
            <Button title={t('Vælg by senere')} variant="plain" onPress={finish} />
          </>
        )}
      </View>
    </View>
  );
}

function Feature({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const colors = useTheme();
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} size={20} color={colors.brandText} weight="semibold" />
      </View>
      <View style={styles.flex}>
        <AppText variant="headline" display>
          {title}
        </AppText>
        <AppText variant="subhead" tone="textSecondary">
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { gap: Spacing.xl, paddingBottom: Spacing.xl },
  panel: { gap: Spacing.xl, paddingTop: Spacing.lg },
  mosaic: { gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.sm },
  mosaicRow: { flexDirection: 'row', gap: Spacing.md },
  mosaicOffset: { transform: [{ translateX: 28 }] },
  textBlock: { gap: Spacing.lg, paddingHorizontal: ScreenPadding },
  bigIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  feature: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  featureIcon: {
    width: IconWell.card.size + 4,
    height: IconWell.card.size + 4,
    borderRadius: IconWell.card.radius + 1,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: ScreenPadding, gap: Spacing.sm, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  dot: { height: 8, borderRadius: 4 },
});
