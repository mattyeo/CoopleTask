const DEFAULT_API_URL = 'http://localhost:4000';

export const config = {
  // Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so the full expression is required.
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ''),
};
