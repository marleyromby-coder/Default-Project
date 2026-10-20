import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const colors = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: 'Ikke fundet' }} />
      <EmptyState
        icon="help"
        title="Siden findes ikke"
        message="Linket er forkert eller virker ikke længere."
        action={<Button title="Til forsiden" onPress={() => router.replace('/')} />}
      />
    </View>
  );
}
