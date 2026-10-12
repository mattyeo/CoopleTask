import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const FAVOURITES_STORAGE_KEY = 'coople-jobs/favourites/v1';

/** A JSON-serialisable set of job ids. */
type FavouriteIds = Record<string, true>;

interface FavouritesState {
  favouriteIds: FavouriteIds;
  hasHydrated: boolean;
  toggleFavourite: (jobId: string) => void;
  markHydrated: () => void;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set) => ({
      favouriteIds: {},
      hasHydrated: false,
      toggleFavourite: (jobId) =>
        set((state) => {
          if (state.favouriteIds[jobId]) {
            const favouriteIds = { ...state.favouriteIds };
            delete favouriteIds[jobId];
            return { favouriteIds };
          }
          return { favouriteIds: { ...state.favouriteIds, [jobId]: true } };
        }),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: FAVOURITES_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favouriteIds: state.favouriteIds }),
      // Stored data is untrusted: keep only well-formed entries instead of crashing on bad JSON.
      merge: (persisted, current) => ({
        ...current,
        favouriteIds: sanitiseFavouriteIds(persisted),
      }),
      // Runs on success and on failure, so a broken storage never hides the buttons forever.
      // Deferred so it can't run before `useFavouritesStore` is assigned (synchronous storages).
      onRehydrateStorage: () => () => {
        queueMicrotask(() => useFavouritesStore.getState().markHydrated());
      },
    },
  ),
);

export function useIsFavourite(jobId: string): boolean {
  return useFavouritesStore((state) => state.favouriteIds[jobId] === true);
}

function sanitiseFavouriteIds(persisted: unknown): FavouriteIds {
  const ids: FavouriteIds = {};
  if (typeof persisted !== 'object' || persisted === null || !('favouriteIds' in persisted)) {
    return ids;
  }
  const { favouriteIds } = persisted;
  if (typeof favouriteIds !== 'object' || favouriteIds === null || Array.isArray(favouriteIds)) {
    return ids;
  }
  for (const [jobId, value] of Object.entries(favouriteIds)) {
    if (value === true) ids[jobId] = true;
  }
  return ids;
}
