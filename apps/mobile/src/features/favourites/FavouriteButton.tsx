import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFavouritesStore, useIsFavourite } from './favouritesStore';

interface FavouriteButtonProps {
  jobId: string;
}

export function FavouriteButton({ jobId }: FavouriteButtonProps) {
  const hasHydrated = useFavouritesStore((state) => state.hasHydrated);
  const toggleFavourite = useFavouritesStore((state) => state.toggleFavourite);
  const isFavourite = useIsFavourite(jobId);

  // Until the stored favourites are loaded the real state is unknown; render an empty box of the
  // same size so the layout does not jump and the star never flickers from ☆ to ★.
  if (!hasHydrated) return <View style={styles.button} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      accessibilityState={{ selected: isFavourite }}
      hitSlop={8}
      onPress={() => toggleFavourite(jobId)}
      style={styles.button}
    >
      <Text style={[styles.star, isFavourite && styles.starActive]}>{isFavourite ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    color: '#6b7280',
    fontSize: 24,
  },
  starActive: {
    color: '#d97706',
  },
});
