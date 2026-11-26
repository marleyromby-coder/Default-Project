import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TradeTile } from '@/components/category-tile';
import { HeroPanel } from '@/components/hero-panel';
import { Logo } from '@/components/logo';
import { TradeArt } from '@/components/trade-art';
import { Button } from '@/components/ui/button';
import { Card, Divider } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { AppText } from '@/components/ui/text';
import { IconWell, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/data/categories';
import { GPS_MESSAGES, useGps } from '@/hooks/use-gps';
import { useTheme } from '@/hooks/use-theme';
import { useLayout } from '@/hooks/use-layout';
import { countryOf } from '@/lib/business-text';
import { DATA_MODE } from '@/lib/data-source';
import { showDialog } from '@/lib/dialog';
import { formatPrice } from '@/lib/format';
import { taxNote } from '@/lib/markets';
import { lowestHourlyByTrade } from '@/lib/prices';
import { useApp, useMarket } from '@/state/app-state';
import { t } from '@/i18n';

const STEPS = 5;
const LOCATION_STEP = 3;
const TRADE_STEP = 4;

/**
 * The introduction for a new user: what FixMatch gives you (the price first, a fair comparison,
 * a checked quote and a direct call), then where you are, and last the trade you need first, so
 * the app opens on a list with prices. Location is asked for only after explaining why.
 */
export default function WelcomeScreen() {
  const { column } = useLayout();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setOnboarded, setStartTrade } = useApp();
  const { country, market, supported } = useMarket();
  const { locate, busy } = useGps();
  const [step, setStep] = useState(0);

  // "fra 560 kr." from the businesses near the chosen place, like the tiles on Find.
  const fromPrices = useMemo(
    () =>
      lowestHourlyByTrade(
        state.businesses.filter((b) => countryOf(b) === country),
        state.location.coords,
        market,
      ),
    [state.businesses, state.location.coords, country, market],
  );
  const priced = CATEGORIES.filter((c) => fromPrices[c.id]).slice(0, 3);
  const demo = supported && DATA_MODE === 'demo';

  const finish = () => setOnboarded(true);
  const useLocation = async () => {
    const result = await locate();
    if (result !== 'ok') showDialog(GPS_MESSAGES[result].title, GPS_MESSAGES[result].message);
    setStep(TRADE_STEP);
  };
  // Find opens the trade's list once the introduction has closed.
  const startWith = (trade: string) => {
    setStartTrade(trade);
    finish();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {step === 0 ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <AppText variant="largeTitle" tone="onPanel">
                {t('Se prisen, før du ringer')}
                <Text style={{ color: colors.accent }}>.</Text>
              </AppText>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <AppText variant="body" tone="textSecondary">
                {t('Håndværkernes og værkstedernes egne priser står fremme, før du tager telefonen.')}
              </AppText>
              {priced.length > 0 ? (
                <Card padded={false}>
                  {priced.map((category, index) => {
                    const from = fromPrices[category.id];
                    return (
                      <View key={category.id}>
                        {index > 0 ? <Divider inset={Spacing.lg + 44 + Spacing.md} /> : null}
                        <View
                          style={styles.priceRow}
                          accessible
                          accessibilityLabel={t('{name}: timepris fra {price}', {
                            name: category.name,
                            price: from ? formatPrice(from.price, from.currency) : '',
                          })}>
                          <TradeArt trade={category.id} size={44} tile />
                          <AppText variant="headline" display style={styles.flex}>
                            {category.name}
                          </AppText>
                          <View style={styles.priceText}>
                            <AppText variant="caption" tone="textSecondary">
                              {t('fra')}
                            </AppText>
                            <AppText variant="title3" maxFontSizeMultiplier={1.3}>
                              {from ? formatPrice(from.price, from.currency) : ''}
                            </AppText>
                            <AppText variant="caption" tone="textSecondary">
                              {t('pr. time')}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              ) : (
                <View style={styles.mosaic} importantForAccessibility="no-hide-descendants">
                  {[CATEGORIES.slice(0, 4), CATEGORIES.slice(4)].map((row, index) => (
                    <View key={index} style={[styles.mosaicRow, index === 1 ? styles.mosaicOffset : null]}>
                      {row.map((category) => (
                        <TradeArt key={category.id} trade={category.id} size={64} tile radius={0.3} />
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {demo && priced.length > 0 ? (
                <Notice
                  text={t('Demoversion: virksomhederne er fiktive eksempler, indtil de rigtige har givet samtykke.')}
                />
              ) : null}
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
                icon="shield"
                title={t('Rækkefølgen kan ikke købes')}
                text={t('Den bygger på pris, afstand og anmeldelser. Du vælger selv, hvad der vejer mest.')}
              />
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <AppText variant="largeTitle" tone="onPanel">
                {t('Fair pris og direkte kontakt')}
              </AppText>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <Feature
                icon="receipt"
                title={t('Tilbudstjek')}
                text={t('Har du fået et tilbud? Se, om prisen er lav, normal eller høj.')}
              />
              <Feature
                icon="phone"
                title={t('Ring direkte')}
                text={t('Telefonnummer og hjemmeside lige ved hånden. Ingen mellemled.')}
              />
              <Feature
                icon="money"
                title={t('Gratis for dig')}
                text={t('Du betaler kun virksomheden for arbejdet. Prisen aftaler du direkte med dem.')}
              />
            </View>
          </>
        ) : null}

        {step === LOCATION_STEP ? (
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

        {step === TRADE_STEP ? (
          <>
            <HeroPanel contentStyle={styles.panel}>
              <Logo size={28} onPanel />
              <AppText variant="largeTitle" tone="onPanel">
                {t('Hvad skal laves først?')}
              </AppText>
            </HeroPanel>
            <View style={[styles.textBlock, column]}>
              <AppText variant="body" tone="textSecondary">
                {t('Vælg et fag, så viser vi priserne nær {place} med det samme.', { place: state.location.label })}
              </AppText>
              <View style={styles.grid}>
                {[CATEGORIES.slice(0, 4), CATEGORIES.slice(4)].map((row) => (
                  <View key={row[0].id} style={styles.gridRow}>
                    {row.map((category) => (
                      <TradeTile
                        key={category.id}
                        category={category}
                        fromPrice={fromPrices[category.id]}
                        onPress={() => startWith(category.id)}
                      />
                    ))}
                  </View>
                ))}
              </View>
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
        {step < LOCATION_STEP ? (
          <>
            <Button title={t('Fortsæt')} size="large" onPress={() => setStep(step + 1)} block />
            <Button title={t('Spring over')} variant="plain" onPress={finish} />
          </>
        ) : step === TRADE_STEP ? (
          <Button title={t('Se forsiden først')} variant="plain" onPress={finish} />
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
            <Button title={t('Vælg by senere')} variant="plain" onPress={() => setStep(TRADE_STEP)} />
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  priceText: { alignItems: 'flex-end' },
  grid: { gap: Spacing.lg },
  gridRow: { flexDirection: 'row', gap: Spacing.md },
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
