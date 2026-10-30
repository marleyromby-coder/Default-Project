import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignUpFlow, type SignUpReason } from '@/components/account/sign-up-flow';
import { ScreenPadding, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { finishContactProfileRequest } from '@/state/account';

const REASONS: SignUpReason[] = ['contact', 'settings', 'profile'];

/**
 * Sign up or sign in as a sheet over the app: before contacting a business
 * (`?reason=contact`), from Mere (`settings`), or to change the name and phone (`profile`).
 */
export default function AccountScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { column } = useLayout();
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = REASONS.find((r) => r === params.reason) ?? 'settings';

  // Whoever opened the sheet to contact a business is told how it ended, also when it is
  // swiped away.
  useEffect(() => finishContactProfileRequest, []);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, column, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <SignUpFlow reason={reason} onDone={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg },
});
