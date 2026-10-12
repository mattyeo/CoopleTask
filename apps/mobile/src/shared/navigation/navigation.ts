import { router } from 'expo-router';

/** Goes back, or to the list when the page was opened directly from a link (no history). */
export function goBackToList(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
