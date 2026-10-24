import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

export default function NotFoundScreen() {
  const colors = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: t('Ikke fundet') }} />
      <EmptyState
        icon="help"
        title={t('Siden findes ikke')}
        message={t('Linket er forkert eller virker ikke længere.')}
        action={<Button title={t('Til forsiden')} onPress={() => router.replace('/')} />}
      />
    </View>
  );
}
