import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getInteractionState } from '../../components/pressableState';
import { colors, fontSizes, touchTarget } from '../../theme/tokens';
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
      onPress={() => toggleFavourite(jobId)}
      style={(state) => {
        const { pressed, hovered } = getInteractionState(state);
        return [styles.button, styles.interactive, (pressed || hovered) && styles.active];
      }}
    >
      <Text style={[styles.star, isFavourite ? styles.starActive : styles.starInactive]}>
        {isFavourite ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: touchTarget,
    justifyContent: 'center',
    width: touchTarget,
  },
  interactive: {
    cursor: 'pointer',
  },
  active: {
    opacity: 0.7,
  },
  star: {
    fontSize: fontSizes.xl,
  },
  starActive: {
    color: colors.favourite,
  },
  starInactive: {
    color: colors.favouriteInactive,
  },
});
