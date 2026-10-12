import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function LoadingState() {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
