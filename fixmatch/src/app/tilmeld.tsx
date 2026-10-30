import { router } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Tappable } from '@/components/ui/tappable';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Radius, ScreenPadding, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/data/categories';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import {
  type BusinessSignup,
  CONSENT_KEYS,
  CONSENT_STATEMENTS,
  emptySignup,
  type SignupField,
  signupErrors,
  submitSignup,
} from '@/lib/business-signup';
import { showDialog } from '@/lib/dialog';
import { COUNTRY_CODES, countryName, getMarket, taxNote } from '@/lib/markets';
import { useMarket } from '@/state/app-state';
import { t } from '@/i18n';

/**
 * "Tilmeld din virksomhed": a business fills in its details and gives its consent itself,
 * so the team only has to check and publish them. Also on the website (tilmeld.html).
 */
export default function BusinessSignupScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const { country } = useMarket();
  const [signup, setSignup] = useState<BusinessSignup>(() => emptySignup(country ?? 'DK'));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<'saved' | 'mail' | null>(null);

  const market = getMarket(signup.country);
  const errors = showErrors ? signupErrors(signup) : {};
  const update = <K extends keyof BusinessSignup>(key: K, value: BusinessSignup[K]) =>
    setSignup((current) => ({ ...current, [key]: value }));
  const field = (key: SignupField & keyof BusinessSignup) => ({
    value: signup[key] as string,
    onChangeText: (value: string) => update(key, value as never),
    error: errors[key],
  });

  const send = async () => {
    if (Object.keys(signupErrors(signup)).length > 0) {
      setShowErrors(true);
      showDialog(t('Der mangler noget'), t('Ret de felter, der er markeret med rødt.'));
      return;
    }
    setBusy(true);
    try {
      setSent(await submitSignup(signup));
    } catch {
      showDialog(t('Det lykkedes ikke'), t('Tilmeldingen blev ikke sendt. Tjek internettet, og prøv igen.'));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.done, { backgroundColor: colors.background }]}>
        <View style={[styles.doneIcon, { backgroundColor: colors.brandSoft }]}>
          <Icon name="check" size={30} color={colors.brandText} weight="bold" />
        </View>
        <AppText variant="title1" align="center" accessibilityRole="header">
          {sent === 'saved' ? t('Tak for tilmeldingen') : t('Send e-mailen for at blive tilmeldt')}
        </AppText>
        <AppText variant="body" tone="textSecondary" align="center">
          {sent === 'saved'
            ? t(
                'Vi tjekker oplysningerne og viser {name} i FixMatch inden for få dage. I kan altid få dem rettet eller fjernet.',
                { name: signup.companyName.trim() },
              )
            : t('Din mail-app er åbnet med tilmeldingen. Når du har sendt den, tjekker vi oplysningerne.')}
        </AppText>
        <Button title={t('Luk')} onPress={() => router.back()} block />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.heading}>
          <AppText variant="title1" accessibilityRole="header">
            {t('Kom gratis på FixMatch')}
          </AppText>
          <AppText variant="body" tone="textSecondary">
            {t(
              'Udfyld oplysningerne, og giv samtykke. Vi tjekker dem og viser jer i appen inden for få dage. Det koster intet, og I kan altid få oplysningerne rettet eller fjernet.',
            )}
          </AppText>
        </View>

        <Section title={t('Land')}>
          <View style={styles.chips}>
            {COUNTRY_CODES.map((code) => (
              <Chip
                key={code}
                label={countryName(code)}
                selected={signup.country === code}
                onPress={() => update('country', code)}
              />
            ))}
          </View>
        </Section>

        <Section title={t('Virksomheden')}>
          <TextField
            label={t('Navn')}
            autoComplete="organization"
            textContentType="organizationName"
            {...field('companyName')}
          />
          <TextField
            label={market.registryLabel ? t(market.registryLabel) : t('Registreringsnummer')}
            autoCapitalize="characters"
            {...field('registryNumber')}
          />
          <View style={styles.group}>
            <AppText variant="subhead" weight="600" tone="textSecondary">
              {t('Fag')}
            </AppText>
            <View style={styles.chips}>
              {CATEGORIES.map((category) => {
                const selected = signup.trades.includes(category.id);
                return (
                  <Chip
                    key={category.id}
                    icon={category.id}
                    label={category.name}
                    selected={selected}
                    onPress={() =>
                      update(
                        'trades',
                        selected ? signup.trades.filter((id) => id !== category.id) : [...signup.trades, category.id],
                      )
                    }
                  />
                );
              })}
            </View>
            {errors.trades ? (
              <AppText variant="footnote" tone="danger">
                {errors.trades}
              </AppText>
            ) : null}
          </View>
          <TextField
            label={t('Adresse')}
            autoComplete="street-address"
            textContentType="streetAddressLine1"
            {...field('street')}
          />
          <View style={styles.row}>
            <View style={styles.postal}>
              <TextField
                label={t('Postnummer')}
                autoComplete="postal-code"
                textContentType="postalCode"
                {...field('postalCode')}
              />
            </View>
            <View style={styles.flex}>
              <TextField label={t('By')} textContentType="addressCity" {...field('city')} />
            </View>
          </View>
        </Section>

        <Section title={t('Sådan kontakter kunderne jer')}>
          <TextField
            label={t('Telefon')}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            {...field('phone')}
          />
          <TextField
            label={t('E-mail')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            hint={t('Vises ikke i appen. Vi bruger den kun til at bekræfte tilmeldingen.')}
            {...field('email')}
          />
          <TextField
            label={t('Hjemmeside (valgfri)')}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="URL"
            {...field('website')}
          />
        </Section>

        <Section title={t('Priser i {currency} {tax}', { currency: market.currency, tax: taxNote(market) })}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label={t('Timepris fra')} keyboardType="number-pad" {...field('hourlyMin')} />
            </View>
            <View style={styles.flex}>
              <TextField label={t('Timepris til')} keyboardType="number-pad" {...field('hourlyMax')} />
            </View>
          </View>
          <TextField label={t('Kørselsgebyr (valgfrit)')} keyboardType="number-pad" {...field('calloutFee')} />
          <TextField
            label={t('Åbningstider (valgfrit)')}
            placeholder={t('Fx man-fre 07-16, lør-søn lukket')}
            {...field('openingHours')}
          />
          <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="body" style={styles.flex}>
              {t('Døgnvagt / akut hjælp')}
            </AppText>
            <Switch
              value={signup.emergency}
              onValueChange={(value) => update('emergency', value)}
              trackColor={{ true: colors.brandStrong }}
              accessibilityLabel={t('Døgnvagt / akut hjælp')}
            />
          </View>
          <TextField
            label={t('Kort om jer (valgfrit)')}
            multiline
            maxLength={500}
            placeholder={t('Fx: Familieejet VVS-firma med speciale i badeværelser.')}
            {...field('description')}
          />
        </Section>

        <Section title={t('Dig, der tilmelder')}>
          <TextField label={t('Dit navn')} autoComplete="name" textContentType="name" {...field('contactName')} />
          <TextField
            label={t('Din stilling (valgfri)')}
            placeholder={t('Fx ejer eller daglig leder')}
            {...field('contactRole')}
          />
        </Section>

        <Section title={t('Samtykke')}>
          {CONSENT_KEYS.map((key) => (
            <CheckRow
              key={key}
              label={t(CONSENT_STATEMENTS[key])}
              checked={signup.consent[key]}
              onToggle={() => update('consent', { ...signup.consent, [key]: !signup.consent[key] })}
            />
          ))}
          {errors.consent ? (
            <AppText variant="footnote" tone="danger">
              {errors.consent}
            </AppText>
          ) : null}
          <Button
            title={t('Læs vilkårene for virksomheder')}
            variant="plain"
            size="small"
            onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'virksomheder' } })}
            style={styles.left}
          />
        </Section>

        <Button title={t('Send tilmelding')} size="large" onPress={send} loading={busy} block />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <AppText variant="title3" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const colors = useTheme();
  return (
    <Tappable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.check}>
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong }
            : { backgroundColor: colors.surface, borderColor: colors.textTertiary },
        ]}>
        {checked ? <Icon name="check" size={14} color={colors.onBrand} weight="bold" /> : null}
      </View>
      <AppText variant="body" style={styles.flex}>
        {label}
      </AppText>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg, gap: Spacing.xxl },
  heading: { gap: Spacing.sm },
  section: { gap: Spacing.md },
  group: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  postal: { width: 120 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  check: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', paddingVertical: Spacing.xs },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  left: { alignSelf: 'flex-start' },
  done: { flex: 1, padding: ScreenPadding, gap: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  doneIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
