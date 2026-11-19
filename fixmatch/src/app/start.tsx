import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignUpFlow } from '@/components/account/sign-up-flow';
import { HeroPanel } from '@/components/hero-panel';
import { Logo } from '@/components/logo';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { skipAccount } from '@/state/account';
import { t } from '@/i18n';

/** What FixMatch gives you, in three lines under the tagline. */
const VALUES: { icon: IconName; text: string }[] = [
  { icon: 'tag', text: t('Se prisen, før du ringer') },
  { icon: 'phone', text: t('Ring direkte – ingen mellemled, intet gebyr') },
  // About the badge, not about every business: only the ones FixMatch has checked carry it.
  { icon: 'verified', text: t('Verificeret-mærket viser, hvem FixMatch selv har tjekket') },
];

/**
 * The first screen: create an account, or skip it ("Spring over", or "Ikke nu" after Sign in
 * with Apple). Everything can be browsed without one; the app asks again the first time you
 * contact a business. The root layout moves on once the account has a name and phone number
 * or the step is skipped. The wordmark, the tagline and the three promises sit on the panel.
 */
export default function StartScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  // The tagline ends in the sun-yellow full stop of the logo.
  const price = t('Til den rette pris.').replace(/\.$/, '');

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <HeroPanel contentStyle={styles.panel}>
          <Logo size={30} onPanel />
          <AppText variant="largeTitle" tone="onPanel" style={styles.tagline}>
            {t('Den rette håndværker.')}
            {'\n'}
            {price}
            <Text style={{ color: colors.accent }}>.</Text>
          </AppText>
          <View style={styles.values}>
            {VALUES.map((value) => (
              <View key={value.icon} style={styles.value}>
                <View style={[styles.valueIcon, { backgroundColor: colors.panelRaised }]}>
                  <Icon name={value.icon} size={18} color={colors.onPanel} weight="semibold" />
                </View>
                <AppText variant="headline" tone="onPanel" style={styles.flex}>
                  {value.text}
                </AppText>
              </View>
            ))}
          </View>
        </HeroPanel>
        <View style={[styles.signUp, column]}>
          <SignUpFlow reason="start" onDone={() => undefined} onSkip={skipAccount} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The promises on the panel at the top, the sign-up within reach of the thumb at the bottom.
  content: { flexGrow: 1, justifyContent: 'space-between', gap: Spacing.xxl },
  panel: { gap: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  tagline: { marginTop: Spacing.sm },
  values: { gap: Spacing.lg },
  value: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  valueIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  signUp: { paddingHorizontal: ScreenPadding },
});
