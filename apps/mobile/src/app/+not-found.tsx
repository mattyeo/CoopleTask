import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <View style={styles.container}>
        <Text style={styles.message}>This page does not exist.</Text>
        <Link href="/" style={styles.link}>
          Back to jobs
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: '#111827',
    fontSize: 16,
  },
  link: {
    color: '#1a56db',
    fontSize: 16,
    fontWeight: '600',
  },
});
