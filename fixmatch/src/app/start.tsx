import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignUpFlow } from '@/components/account/sign-up-flow';
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
  { icon: 'verified', text: t('Verificeret: CVR og autorisation tjekket af FixMatch') },
];

/**
 * The first screen: create an account, or skip it ("Spring over", or "Ikke nu" after Sign in
 * with Apple). Everything can be browsed without one; the app asks again the first time you
 * contact a business. The root layout moves on once the account has a name and phone number
 * or the step is skipped.
 */
export default function StartScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          column,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}>
        <View style={styles.top}>
          <Logo size={30} mark />
          <AppText variant="largeTitle">
            {t('Den rette håndværker.')}
            {'\n'}
            <Text style={{ color: colors.brandText }}>{t('Til den rette pris.')}</Text>
          </AppText>
          <View style={styles.values}>
            {VALUES.map((value) => (
              <View key={value.icon} style={styles.value}>
                <Icon name={value.icon} size={22} color={colors.brand} weight="semibold" />
                <AppText variant="headline" style={styles.flex}>
                  {value.text}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <SignUpFlow reason="start" onDone={() => undefined} onSkip={skipAccount} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The tagline at the top, the sign-up within reach of the thumb at the bottom.
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: ScreenPadding, gap: Spacing.xxl },
  top: { alignItems: 'flex-start', gap: Spacing.xl },
  values: { alignSelf: 'stretch', gap: Spacing.lg },
  value: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
