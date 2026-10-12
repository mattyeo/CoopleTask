import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../../src/cache/ttlCache';

const TTL = 1000;

let time: number;
let cache: TtlCache<string>;

beforeEach(() => {
  time = 0;
  cache = new TtlCache<string>({ maxEntries: 100, now: () => time });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('TtlCache.getOrLoad', () => {
  it('loads on a miss and answers from memory afterwards', async () => {
    const load = vi.fn().mockResolvedValue('value');

    expect(await cache.getOrLoad('key', TTL, load)).toBe('value');
    expect(await cache.getOrLoad('key', TTL, load)).toBe('value');

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps different keys apart', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('a')
      .mockResolvedValueOnce('b');

    expect(await cache.getOrLoad('one', TTL, load)).toBe('a');
    expect(await cache.getOrLoad('two', TTL, load)).toBe('b');
    expect(await cache.getOrLoad('one', TTL, load)).toBe('a');

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('loads again once the time-to-live has passed', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('new');

    await cache.getOrLoad('key', TTL, load);
    time = TTL - 1;
    expect(await cache.getOrLoad('key', TTL, load)).toBe('old');

    time = TTL;
    expect(await cache.getOrLoad('key', TTL, load)).toBe('new');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('shares one load between concurrent requests for the same key', async () => {
    const pending = deferred<string>();
    const load = vi.fn(() => pending.promise);

    const first = cache.getOrLoad('key', TTL, load);
    const second = cache.getOrLoad('key', TTL, load);
    pending.resolve('value');

    expect(await Promise.all([first, second])).toEqual(['value', 'value']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed load and lets the next request try again', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('upstream down'))
      .mockResolvedValueOnce('recovered');

    await expect(cache.getOrLoad('key', TTL, load)).rejects.toThrow('upstream down');
    expect(cache.size).toBe(0);

    expect(await cache.getOrLoad('key', TTL, load)).toBe('recovered');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('gives every concurrent caller the same failure, then recovers', async () => {
    const pending = deferred<string>();
    const load = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce('recovered');

    const first = cache.getOrLoad('key', TTL, load);
    const second = cache.getOrLoad('key', TTL, load);
    pending.reject(new Error('boom'));

    await expect(first).rejects.toThrow('boom');
    await expect(second).rejects.toThrow('boom');
    expect(await cache.getOrLoad('key', TTL, load)).toBe('recovered');
  });

  it.each([0, -1])('does not cache at all when the time-to-live is %d', async (ttl) => {
    const load = vi.fn().mockResolvedValue('value');

    await cache.getOrLoad('key', ttl, load);
    await cache.getOrLoad('key', ttl, load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(0);
  });
});

describe('TtlCache size limit', () => {
  it('drops the oldest entry when full', async () => {
    const small = new TtlCache<string>({ maxEntries: 2, now: () => time });

    await small.getOrLoad('a', TTL, async () => 'a');
    await small.getOrLoad('b', TTL, async () => 'b');
    await small.getOrLoad('c', TTL, async () => 'c');

    expect(small.size).toBe(2);
    expect(small.get('a')).toBeUndefined();
    expect(small.get('b')).toBe('b');
    expect(small.get('c')).toBe('c');
  });

  it('treats a refreshed entry as the newest one', async () => {
    const small = new TtlCache<string>({ maxEntries: 2, now: () => time });

    await small.getOrLoad('a', TTL, async () => 'a1');
    await small.getOrLoad('b', TTL, async () => 'b');
    time = TTL; // both are expired now
    await small.getOrLoad('a', TTL, async () => 'a2'); // refreshed: now newer than "b"
    await small.getOrLoad('c', TTL, async () => 'c'); // evicts "b", the oldest

    expect(small.get('a')).toBe('a2');
    expect(small.get('c')).toBe('c');
    expect(small.size).toBe(2);
  });

  it('never grows beyond the limit however many keys are used', async () => {
    const small = new TtlCache<number>({ maxEntries: 5, now: () => time });

    for (let key = 0; key < 100; key += 1) {
      await small.getOrLoad(String(key), TTL, async () => key);
    }

    expect(small.size).toBe(5);
  });
});

describe('TtlCache.get and clear', () => {
  it('returns undefined for unknown and expired keys', async () => {
    expect(cache.get('missing')).toBeUndefined();

    await cache.getOrLoad('key', TTL, async () => 'value');
    time = TTL;

    expect(cache.get('key')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('forgets everything on clear', async () => {
    const load = vi.fn().mockResolvedValue('value');
    await cache.getOrLoad('key', TTL, load);

    cache.clear();
    await cache.getOrLoad('key', TTL, load);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
