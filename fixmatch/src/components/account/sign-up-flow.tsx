import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField, type TextFieldHandle } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Tappable } from '@/components/ui/tappable';
import { Radius, Spacing } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import { showDialog } from '@/lib/dialog';
import { SERVER_ENABLED } from '@/lib/supabase';
import {
  isAppleSignInAvailable,
  saveProfile,
  sendEmailCode,
  signInWithApple,
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

/** Explains a failed request in plain words. */
function explain(error: unknown): string {
  const status = (error as { status?: number }).status;
  const message = String((error as { message?: string }).message ?? '');
  if (status === 429 || /rate limit/i.test(message)) return t('For mange forsøg. Vent et minut, og prøv igen.');
  if (/expired|invalid|token/i.test(message))
    return t('Koden er forkert eller udløbet. Prøv igen, eller få en ny kode.');
  if (/network|fetch/i.test(message)) return t('Ingen forbindelse. Tjek internettet, og prøv igen.');
  return t('Noget gik galt. Prøv igen om lidt.');
}

const failed = (error: unknown) => showDialog(t('Det lykkedes ikke'), explain(error));

interface Props {
  reason: SignUpReason;
  /** Called once the account has a name and phone number. */
  onDone: () => void;
  /** Shown as "Spring over" when given (only at launch). */
  onSkip?: () => void;
}

/**
 * Create an account or sign in – with Apple or a code sent by e-mail – and give the name
 * and phone number that businesses see when you contact them.
 */
export function SignUpFlow({ reason, onDone, onSkip }: Props) {
  const dark = useIsDark();
  const account = useAccount();
  const [entry, setEntry] = useState<'choose' | 'code'>('choose');
  // Once signed in, the only step left is the name and phone number.
  const step: Step = account.status === 'signedIn' ? 'profile' : entry;
  const saved = account.status === 'signedIn' ? account.profile : null;
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // Null until edited: shows the saved profile, or the name Apple shared.
  const [appleName, setAppleName] = useState('');
  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const name = nameInput ?? saved?.name ?? appleName;
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

  useEffect(() => {
    isAppleSignInAvailable().then(setApple);
  }, []);

  // Signing in on a new phone to an account that already has a name and phone number:
  // nothing more to ask.
  const alreadyComplete = saved !== null && reason !== 'profile';
  useEffect(() => {
    if (alreadyComplete) finish();
  }, [alreadyComplete, finish]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      failed(error);
    } finally {
      setBusy(false);
    }
  };

  const continueWithApple = () =>
    run(async () => {
      const result = await signInWithApple();
      if (result?.name) setAppleName(result.name);
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
  const confirmCode = () => run(() => verifyEmailCode(email.trim(), code));

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
              onPress={busy ? () => undefined : continueWithApple}
            />
          ) : null}
          {apple ? (
            <AppText variant="footnote" tone="textTertiary" align="center">
              {t('eller')}
            </AppText>
          ) : null}
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
              onPress={() => run(() => sendEmailCode(email.trim()))}
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
  links: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  legal: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
