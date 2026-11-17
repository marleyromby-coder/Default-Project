import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { MaxContentWidth, SerifFonts } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { canContact, useAccount, useAccountSkipped } from '@/state/account';
import { CallFollowUp } from '@/components/call-follow-up';
import { AppStateProvider, useApp } from '@/state/app-state';
import { useAppearanceLoaded } from '@/state/appearance';
import { getLanguage, t } from '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Tell browsers and screen readers on the web demo which language the page is in.
if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = getLanguage();

export default function RootLayout() {
  const dark = useIsDark();
  const colors = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brandText,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <AppStateProvider>
        <WebFrame>
          <RootNavigator />
          <CallFollowUp />
        </WebFrame>
      </AppStateProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const colors = useTheme();
  const { state } = useApp();
  const [fontsLoaded, fontError] = useFonts({
    [SerifFonts.regular]: Fraunces_600SemiBold,
    [SerifFonts.bold]: Fraunces_700Bold,
  });
  // The saved light/dark choice is read first, so the app never flashes the wrong theme.
  const appearanceLoaded = useAppearanceLoaded();
  const account = useAccount();
  const skipped = useAccountSkipped();
  // If the fonts cannot load, the titles fall back to the system font instead of hanging.
  const ready = state.ready && appearanceLoaded && account.status !== 'loading' && (fontsLoaded || !!fontError);
  // The app opens on "Opret en bruger" until there is an account with a name and phone
  // number, or the user chose "Spring over" (or "Ikke nu" after Sign in with Apple).
  const accountStepDone = skipped || canContact(account);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.brandText,
        // Inline titles are SF Pro, like the back chevron beside them; large titles are Fraunces.
        headerTitleStyle: { color: colors.text },
        headerLargeTitleStyle: { fontFamily: SerifFonts.bold, color: colors.text },
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!accountStepDone}>
        <Stack.Screen name="start" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={accountStepDone && state.onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('Find') }} />
        <Stack.Screen name="kategori/[id]" options={{ title: '' }} />
        <Stack.Screen name="virksomhed/[id]" options={{ headerShown: false, title: t('Virksomhed') }} />
        <Stack.Screen name="virksomhed/anmeldelser/[id]" options={{ title: t('Anmeldelser') }} />
        <Stack.Screen
          name="sammenlign"
          options={{
            presentation: 'modal',
            title: t('Sammenlign'),
            headerLeft: () => <CloseButton title={t('Luk')} />,
          }}
        />
        <Stack.Screen name="soeg" options={{ presentation: 'modal', headerShown: false, title: t('Søg') }} />
        <Stack.Screen
          name="filtre"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.8, 1],
            sheetGrabberVisible: true,
            title: t('Filtre'),
          }}
        />
        <Stack.Screen
          name="prioriteter"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
            title: t('Dine prioriteter'),
          }}
        />
        <Stack.Screen name="beskriv" options={{ title: t('Beskriv dit problem') }} />
        <Stack.Screen name="tilbudstjek" options={{ title: t('Tilbudstjek') }} />
        <Stack.Screen
          name="anmeld"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.85, 1],
            sheetGrabberVisible: true,
            title: t('Anmeldelse'),
          }}
        />
        <Stack.Screen
          name="del-pris"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.85, 1],
            sheetGrabberVisible: true,
            title: t('Del, hvad du betalte'),
          }}
        />
        <Stack.Screen name="match" options={{ title: t('Dit match') }} />
        <Stack.Screen
          name="placering"
          options={{
            presentation: 'modal',
            title: t('Vælg placering'),
            headerLeft: () => <CloseButton title={t('Luk')} />,
          }}
        />
        <Stack.Screen
          name="konto"
          options={{
            presentation: 'modal',
            title: t('Din bruger'),
            headerLeft: () => <CloseButton title={t('Annuller')} />,
          }}
        />
        <Stack.Screen
          name="tilmeld"
          options={{
            presentation: 'modal',
            title: t('Tilmeld din virksomhed'),
            headerLeft: () => <CloseButton title={t('Luk')} />,
          }}
        />
        <Stack.Screen
          name="virksomhed-login"
          options={{
            presentation: 'modal',
            title: t('Log ind som virksomhed'),
            headerLeft: () => <CloseButton title={t('Annuller')} />,
          }}
        />
        <Stack.Screen name="min-virksomhed/index" options={{ title: t('Min virksomhed') }} />
        <Stack.Screen name="min-virksomhed/ret" options={{ title: t('Ret oplysninger') }} />
        {/* Large titles on pushed pages that scroll; long titles and result lists stay inline. */}
        <Stack.Screen name="tryghed/[id]" options={{ title: t('Tryghed'), headerLargeTitleEnabled: true }} />
        <Stack.Screen name="min-bolig/index" options={{ title: t('Min bolig'), headerLargeTitleEnabled: true }} />
        <Stack.Screen name="groen-guide" options={{ title: t('Grøn guide'), headerLargeTitleEnabled: true }} />
        <Stack.Screen name="akut" options={{ title: t('Akut hjælp'), headerLargeTitleEnabled: true }} />
        <Stack.Screen name="faelles/index" options={{ title: t('Naborabat'), headerLargeTitleEnabled: true }} />
        <Stack.Screen
          name="faelles/ny"
          options={{
            presentation: 'modal',
            title: t('Start en gruppe'),
            headerLeft: () => <CloseButton title={t('Annuller')} />,
          }}
        />
        <Stack.Screen name="faelles/[id]" options={{ title: '' }} />
        <Stack.Screen name="advarselslamper" options={{ title: t('Advarselslampe i bilen') }} />
        <Stack.Screen name="tilbud-foto" options={{ title: t('Tjek hele tilbuddet') }} />
        <Stack.Screen
          name="min-bolig/ny"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [1],
            sheetGrabberVisible: true,
            title: t('Ny opgave'),
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={accountStepDone && !state.onboarded}>
        <Stack.Screen name="velkommen" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      {/* Terms and privacy are linked from the sign-up screen too, before the app is open. */}
      <Stack.Screen name="info/[slug]" options={{ title: '' }} />
    </Stack>
  );
}

/** "Luk" or "Annuller" at the top left of a modal, as on iOS. */
function CloseButton({ title }: { title: string }) {
  return (
    <Button
      title={title}
      variant="plain"
      size="small"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

/** On the web demo, show the app in a phone-sized column. */
function WebFrame({ children }: PropsWithChildren) {
  const colors = useTheme();
  if (Platform.OS !== 'web') return children;
  return (
    <View style={[styles.webBackdrop, { backgroundColor: colors.backdrop }]}>
      <View style={[styles.webColumn, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webBackdrop: { flex: 1, alignItems: 'center' },
  webColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
