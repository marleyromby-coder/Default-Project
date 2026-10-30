import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { MaxContentWidth, SerifFonts } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { canContact, useAccount, useAccountSkipped } from '@/state/account';
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
  // number, or the user chose "Spring over".
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
        headerTitleStyle: { color: colors.text, fontFamily: SerifFonts.regular },
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
        <Stack.Screen name="sammenlign" options={{ presentation: 'modal', title: t('Sammenlign') }} />
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
        <Stack.Screen name="match" options={{ title: t('Dit match') }} />
        <Stack.Screen name="placering" options={{ presentation: 'modal', title: t('Vælg placering') }} />
        <Stack.Screen name="konto" options={{ presentation: 'modal', title: t('Din bruger') }} />
        <Stack.Screen name="tilmeld" options={{ presentation: 'modal', title: t('Tilmeld din virksomhed') }} />
      </Stack.Protected>
      <Stack.Protected guard={accountStepDone && !state.onboarded}>
        <Stack.Screen name="velkommen" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      {/* Terms and privacy are linked from the sign-up screen too, before the app is open. */}
      <Stack.Screen name="info/[slug]" options={{ title: '' }} />
    </Stack>
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
