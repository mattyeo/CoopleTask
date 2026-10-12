import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const createdClients: QueryClient[] = [];

// Cached queries keep timers alive, which would stop Jest from exiting; clear them after each test.
afterEach(() => {
  for (const client of createdClients.splice(0)) client.clear();
});

/** A client for tests: no automatic retries, so a failed request shows its error straight away. */
export function createTestQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  createdClients.push(client);
  return client;
}

/** Renders a screen with the providers the app root normally supplies. */
export async function renderWithProviders(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient(),
): Promise<{ client: QueryClient }> {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>{children}</SafeAreaProvider>
      </QueryClientProvider>
    );
  }

  await render(ui, { wrapper: Wrapper });
  return { client };
}
