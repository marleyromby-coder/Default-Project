import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextField, type TextFieldHandle } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Tappable } from '@/components/ui/tappable';
import { Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { EMAIL_LOGIN_ENABLED, SERVER_ENABLED, serverProviders } from '@/lib/supabase';
import {
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
  saveProfile,
  sendEmailCode,
  signInWithApple,
  signInWithGoogle,
  useAccount,
  verifyEmailCode,
} from '@/state/account';
import { t } from '@/i18n';

/** Where the flow is shown: at launch, before contacting a business, from Mere, or to edit the profile. */
export type SignUpReason = 'start' | 'contact' | 'settings' | 'profile';

type Step = 'choose' | 'code' | 'profile';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Same rule as the profiles table in supabase/migrations. */
const PHONE = /^\+?[0-9 ()-]{6,20}$/;

/**
 * Explains a failed request in plain words. `code` is the e-mail code step: only there does
 * an "invalid token" mean the code was wrong (Apple and Google errors mention tokens too).
 */
function explain(error: unknown, context: 'login' | 'code'): string {
  const status = (error as { status?: number }).status;
  const message = String((error as { message?: string }).message ?? '');
  if (status === 429 || /rate limit/i.test(message)) return t('For mange forsøg. Vent et minut, og prøv igen.');
  if (status === 0 || /network|fetch|timed? ?out/i.test(message))
    return t('Kunne ikke få forbindelse til FixMatch. Tjek internettet, og prøv igen om lidt.');
  if (context === 'code' && /expired|invalid|token/i.test(message))
    return t('Koden er forkert eller udløbet. Prøv igen, eller få en ny kode.');
  return t('Noget gik galt. Prøv igen om lidt.');
}

const failed = (error: unknown, context: 'login' | 'code') => showDialog(t('Det lykkedes ikke'), explain(error, context));

interface Props {
  reason: SignUpReason;
  /** Called once the account has a name and phone number. */
  onDone: () => void;
  /** Shown as "Spring over", and as "Ikke nu" on the name and phone step, when given (only at launch). */
  onSkip?: () => void;
}

/**
 * Create an account or sign in – with Apple, Google or a code sent by e-mail – and give the
 * name and phone number that businesses see when you contact them.
 */
export function SignUpFlow({ reason, onDone, onSkip }: Props) {
  const dark = useIsDark();
  const colors = useTheme();
  const account = useAccount();
  const [entry, setEntry] = useState<'choose' | 'code'>('choose');
  // Once signed in, the only step left is the name and phone number.
  const step: Step = account.status === 'signedIn' ? 'profile' : entry;
  const saved = account.status === 'signedIn' ? account.profile : null;
  const [apple, setApple] = useState(false);
  const [google, setGoogle] = useState(false);
  // Whether the server answered; without it no sign-in can work, so the screen says so at once.
  const [serverDown, setServerDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // Null until edited: shows the saved profile, or the name Apple or Google shared.
  const [sharedName, setSharedName] = useState('');
  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const name = nameInput ?? saved?.name ?? sharedName;
  const phone = phoneInput ?? saved?.phone ?? '';
  const [showErrors, setShowErrors] = useState(false);
  const phoneRef = useRef<TextFieldHandle>(null);
  // Closing twice would also close the screen below.
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const checkServer = useCallback(() => {
    if (!SERVER_ENABLED) return;
    serverProviders().then((providers) => setServerDown(providers === null));
    isGoogleSignInAvailable().then(setGoogle);
  }, []);

  useEffect(() => {
    isAppleSignInAvailable().then(setApple);
    checkServer();
  }, [checkServer]);

  // Signing in on a new phone to an account that already has a name and phone number:
  // nothing more to ask.
  const alreadyComplete = saved !== null && reason !== 'profile';
  useEffect(() => {
    if (alreadyComplete) finish();
  }, [alreadyComplete, finish]);

  const run = async (task: () => Promise<void>, context: 'login' | 'code' = 'login') => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      failed(error, context);
      // A failed sign-in is often the server being down: check, so the screen can say so.
      checkServer();
    } finally {
      setBusy(false);
    }
  };

  const continueWith = (signIn: () => Promise<{ name: string } | null>) =>
    run(async () => {
      const result = await signIn();
      if (result?.name) setSharedName(result.name);
    });

  const emailValid = EMAIL.test(email.trim());
  const continueWithEmail = () => {
    if (!emailValid) {
      setShowErrors(true);
      return;
    }
    run(async () => {
      if (SERVER_ENABLED) {
        await sendEmailCode(email.trim());
        setShowErrors(false);
        setEntry('code');
      } else {
        await verifyEmailCode(email.trim(), '');
      }
    });
  };

  const codeValid = /^\d{6,10}$/.test(code);
  const confirmCode = () => run(() => verifyEmailCode(email.trim(), code), 'code');

  const nameValid = name.trim().length >= 2;
  const phoneValid = PHONE.test(phone.trim()) && phone.replace(/\D/g, '').length >= 6;
  const save = () => {
    if (!nameValid || !phoneValid) {
      setShowErrors(true);
      return;
    }
    run(async () => {
      await saveProfile({ name: name.trim(), phone: phone.trim() });
      finish();
    });
  };

  const intro = {
    start: {
      title: t('Opret en bruger'),
      text: t('Så kan håndværkerne se, hvem de taler med, når du kontakter dem. Det tager under et minut.'),
    },
    contact: {
      title: t('Opret en bruger for at kontakte virksomheden'),
      text: t('Virksomheden får dit navn og telefonnummer, så den ved, hvem den taler med.'),
    },
    settings: {
      title: t('Opret bruger eller log ind'),
      text: t('Med en bruger kan du kontakte virksomhederne, og de kan se, hvem du er.'),
    },
    profile: { title: t('Dit navn og telefonnummer'), text: '' },
  }[reason];

  return (
    <View style={styles.flow}>
      {step === 'choose' ? (
        <>
          <View style={styles.heading}>
            <AppText variant={reason === 'start' ? 'title2' : 'title1'} accessibilityRole="header">
              {intro.title}
            </AppText>
            <AppText variant="body" tone="textSecondary">
              {intro.text}
            </AppText>
          </View>
          {serverDown ? (
            <View style={[styles.notice, { backgroundColor: colors.fill }]} accessibilityLiveRegion="polite">
              <Icon name="warning" size={18} color={colors.textSecondary} />
              <View style={styles.noticeText}>
                <AppText variant="callout">
                  {t('Vi kan ikke få forbindelse til FixMatch lige nu, så du kan ikke logge ind. Tjek internettet, eller prøv igen om lidt.')}
                </AppText>
                <Button title={t('Prøv igen')} variant="link" size="small" onPress={checkServer} />
              </View>
            </View>
          ) : null}
          {apple ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                dark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={Radius.md}
              style={styles.apple}
              onPress={busy ? () => undefined : () => continueWith(signInWithApple)}
            />
          ) : null}
          {google ? <GoogleButton disabled={busy} onPress={() => continueWith(signInWithGoogle)} /> : null}
          {(apple || google) && EMAIL_LOGIN_ENABLED ? (
            <AppText variant="footnote" tone="textTertiary" align="center">
              {t('eller')}
            </AppText>
          ) : null}
          {!EMAIL_LOGIN_ENABLED && !apple && !google ? (
            <AppText variant="footnote" tone="textTertiary">
              {t('Opret en bruger i iPhone-appen.')}
            </AppText>
          ) : null}
          {EMAIL_LOGIN_ENABLED ? (
            <>
              <TextField
                label={t('E-mail')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('navn@eksempel.dk')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={continueWithEmail}
                error={showErrors && !emailValid ? t('Skriv en gyldig e-mailadresse.') : undefined}
                hint={SERVER_ENABLED ? t('Vi sender dig en kode. Ingen adgangskode.') : undefined}
              />
              <Button
                title={t('Fortsæt med e-mail')}
                variant="secondary"
                onPress={continueWithEmail}
                loading={busy}
                block
              />
            </>
          ) : null}
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <View style={styles.heading}>
            <AppText variant="title1" accessibilityRole="header">
              {t('Tjek din e-mail')}
            </AppText>
            <AppText variant="body" tone="textSecondary">
              {t('Vi har sendt en kode til {email}. Skriv den her.', { email: email.trim() })}
            </AppText>
          </View>
          <TextField
            label={t('Kode')}
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 10))}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoFocus
            onSubmitEditing={codeValid ? confirmCode : undefined}
          />
          <Button title={t('Bekræft')} onPress={confirmCode} disabled={!codeValid} loading={busy} block />
          <View style={styles.links}>
            <Button
              title={t('Send en ny kode')}
              variant="plain"
              size="small"
              onPress={() => run(() => sendEmailCode(email.trim()), 'code')}
            />
            <Button
              title={t('Brug en anden e-mail')}
              variant="plain"
              size="small"
              onPress={() => {
                setCode('');
                setEntry('choose');
              }}
            />
          </View>
        </>
      ) : null}

      {step === 'profile' ? (
        <>
          <View style={styles.heading}>
            <AppText variant="title1" accessibilityRole="header">
              {t('Dit navn og telefonnummer')}
            </AppText>
            <AppText variant="body" tone="textSecondary">
              {t(
                'Virksomheder, du kontakter gennem FixMatch, ser dit navn og telefonnummer, så de ved, hvem de taler med. Vi viser dem ikke til andre.',
              )}
            </AppText>
          </View>
          <TextField
            label={t('Navn')}
            value={name}
            onChangeText={setName}
            placeholder={t('Fornavn og efternavn')}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            error={showErrors && !nameValid ? t('Skriv dit navn.') : undefined}
          />
          <TextField
            ref={phoneRef}
            label={t('Telefonnummer')}
            value={phone}
            onChangeText={setPhone}
            placeholder="+45 12 34 56 78"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={save}
            error={showErrors && !phoneValid ? t('Skriv et telefonnummer, gerne med landekode.') : undefined}
          />
          <Button title={t('Gem og fortsæt')} onPress={save} loading={busy} block size="large" />
          {!SERVER_ENABLED ? (
            <AppText variant="footnote" tone="textTertiary">
              {t('Demo: din bruger gemmes kun på denne telefon.')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {onSkip && step === 'choose' ? <Button title={t('Spring over')} variant="plain" onPress={onSkip} block /> : null}
      {/* At launch, signed in with Apple but no name and number yet: the app opens anyway. */}
      {onSkip && step === 'profile' ? (
        <View style={styles.later}>
          <Button title={t('Ikke nu')} variant="plain" onPress={onSkip} block />
          <AppText variant="footnote" tone="textTertiary" align="center">
            {t('Du kan se og sammenligne uden. Vi spørger igen, når du vil ringe eller skrive til en virksomhed.')}
          </AppText>
        </View>
      ) : null}

      <View style={styles.legal}>
        <AppText variant="footnote" tone="textTertiary">
          {t('Når du fortsætter, accepterer du')}{' '}
        </AppText>
        <LegalLink slug="vilkaar" title={t('vilkårene')} />
        <AppText variant="footnote" tone="textTertiary">
          {' '}
          {t('og')}{' '}
        </AppText>
        <LegalLink slug="privatliv" title={t('privatlivspolitikken')} />
        <AppText variant="footnote" tone="textTertiary">
          .
        </AppText>
      </View>
    </View>
  );
}

/** Google's own "G", drawn in its four colours as Google's sign-in guidelines ask. */
const GOOGLE_G = [
  ['#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'],
  ['#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'],
  ['#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'],
  ['#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'],
] as const;

/** "Fortsæt med Google", the same size and shape as Apple's button above it. */
function GoogleButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const colors = useTheme();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={t('Fortsæt med Google')}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.google, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Svg width={18} height={18} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
        {GOOGLE_G.map(([fill, d]) => (
          <Path key={fill} fill={fill} d={d} />
        ))}
      </Svg>
      <AppText variant="headline">{t('Fortsæt med Google')}</AppText>
    </Tappable>
  );
}

function LegalLink({ slug, title }: { slug: string; title: string }) {
  return (
    <Tappable
      accessibilityRole="link"
      accessibilityLabel={title}
      hitSlop={8}
      onPress={() => router.push({ pathname: '/info/[slug]', params: { slug } })}>
      <AppText variant="footnote" tone="brandText" weight="600">
        {title}
      </AppText>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  flow: { gap: Spacing.lg },
  heading: { gap: Spacing.sm },
  apple: { height: 50, width: '100%' },
  google: {
    height: 50,
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  notice: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  noticeText: { flex: 1, alignItems: 'flex-start', gap: Spacing.xs },
  links: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  later: { gap: Spacing.xs },
  legal: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
