import type { ReactElement, ReactNode } from 'react';

// Components that use favourites touch AsyncStorage, which has no native module under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The real router needs a navigation container and a file-based route tree. Screens only need a
// few of its parts, so tests replace it with simple stand-ins they can inspect.
jest.mock('expo-router', () => {
  const { cloneElement } = jest.requireActual<typeof import('react')>('react');

  return {
    // `<Link href asChild>` hands its href to the child, which is how tests can read it.
    Link: ({ href, children }: { href: string; children: ReactElement }) =>
      cloneElement(children, { href } as Record<string, unknown>),
    // `Stack.Screen` renders nothing; tests read the options it was given from the mock's calls.
    Stack: Object.assign(({ children }: { children?: ReactNode }) => children ?? null, {
      Screen: jest.fn(() => null),
    }),
    router: {
      back: jest.fn(),
      replace: jest.fn(),
      push: jest.fn(),
      canGoBack: jest.fn(() => false),
    },
    useLocalSearchParams: jest.fn(() => ({})),
  };
});
