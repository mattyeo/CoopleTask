import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAVOURITES_STORAGE_KEY, useFavouritesStore } from '@/features/favourites/favouritesStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const store = useFavouritesStore;

/** Lets pending storage writes and the deferred "hydrated" flag settle. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function readStored(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(FAVOURITES_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

beforeEach(async () => {
  store.setState({ favouriteIds: {}, hasHydrated: false });
  await flush();
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('toggleFavourite', () => {
  it('adds a job and removes it again', () => {
    store.getState().toggleFavourite('job-1');
    expect(store.getState().favouriteIds).toEqual({ 'job-1': true });

    store.getState().toggleFavourite('job-1');
    expect(store.getState().favouriteIds).toEqual({});
  });

  it('keeps jobs independent of each other', () => {
    store.getState().toggleFavourite('job-1');
    store.getState().toggleFavourite('job-2');
    store.getState().toggleFavourite('job-1');

    expect(store.getState().favouriteIds).toEqual({ 'job-2': true });
  });
});

describe('persistence', () => {
  it('writes only the favourite ids, under a versioned key', async () => {
    store.getState().toggleFavourite('job-1');
    await flush();

    expect(await readStored()).toEqual({ state: { favouriteIds: { 'job-1': true } }, version: 1 });
  });

  it('restores favourites from storage and marks the store as hydrated', async () => {
    await AsyncStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify({ state: { favouriteIds: { 'job-7': true } }, version: 1 }),
    );

    await store.persist.rehydrate();
    await flush();

    expect(store.getState().favouriteIds).toEqual({ 'job-7': true });
    expect(store.getState().hasHydrated).toBe(true);
  });

  it('is not hydrated before the stored favourites are loaded', () => {
    expect(store.getState().hasHydrated).toBe(false);
  });

  it('marks the store as hydrated when nothing is stored yet', async () => {
    await store.persist.rehydrate();
    await flush();

    expect(store.getState().favouriteIds).toEqual({});
    expect(store.getState().hasHydrated).toBe(true);
  });
});

describe('untrusted stored data', () => {
  async function rehydrateFrom(state: unknown): Promise<void> {
    await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify({ state, version: 1 }));
    await store.persist.rehydrate();
    await flush();
  }

  it('keeps only entries that are exactly true', async () => {
    await rehydrateFrom({ favouriteIds: { good: true, bad: 'yes', worse: 1, nope: false } });

    expect(store.getState().favouriteIds).toEqual({ good: true });
  });

  it.each([
    ['an array', { favouriteIds: ['job-1'] }],
    ['a string', { favouriteIds: 'job-1' }],
    ['null', { favouriteIds: null }],
    ['a missing field', {}],
    ['a non-object state', 'garbage'],
  ])('ignores favouriteIds that are %s', async (_label, state) => {
    await rehydrateFrom(state);

    expect(store.getState().favouriteIds).toEqual({});
    expect(store.getState().hasHydrated).toBe(true);
  });

  it('still becomes usable when the stored text is not JSON', async () => {
    await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, 'not json');

    await store.persist.rehydrate();
    await flush();
    store.getState().toggleFavourite('job-1');

    expect(store.getState().hasHydrated).toBe(true);
    expect(store.getState().favouriteIds).toEqual({ 'job-1': true });
  });

  it('still becomes usable when reading the storage fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage blocked'));

    await store.persist.rehydrate();
    await flush();
    store.getState().toggleFavourite('job-1');

    expect(store.getState().hasHydrated).toBe(true);
    expect(store.getState().favouriteIds).toEqual({ 'job-1': true });
  });
});
