import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../api/queryClient';
import { BackButton } from '../components/BackButton';
import { colors, fontSizes, fontWeights } from '../theme/tokens';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: {
              color: colors.text,
              fontSize: fontSizes.md,
              fontWeight: fontWeights.semibold,
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Coople Jobs' }} />
          <Stack.Screen
            name="job/[id]"
            options={{ title: 'Job', headerLeft: () => <BackButton /> }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
