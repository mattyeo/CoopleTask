import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../api/queryClient';
import { BackButton } from '../components/BackButton';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack>
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
