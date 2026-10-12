import { router, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { StateLayout } from '@/shared/components/feedback/StateLayout';
import { colors, fontSizes, lineHeights } from '@/shared/theme/tokens';

export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <StateLayout>
        <Text style={styles.message}>This page does not exist.</Text>
        <Button label="Back to jobs" onPress={() => router.replace('/')} />
      </StateLayout>
    </>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.text,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    textAlign: 'center',
  },
});
