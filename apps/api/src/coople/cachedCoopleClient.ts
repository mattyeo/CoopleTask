import { TtlCache } from '../cache/ttlCache';
import type { CoopleClient } from './coopleClient';
import type { CoopleJobDetailsDto, CoopleJobListDto } from './coopleSchemas';

export interface CachedCoopleClientOptions {
  listTtlMs: number;
  detailsTtlMs: number;
  /** Bound for each of the two caches. */
  maxEntries?: number;
  now?: () => number;
}

const DEFAULT_MAX_ENTRIES = 500;

/**
 * Wraps a Coople client so repeated requests are answered from memory. Only successful answers are
 * kept; errors (including "not found") always go to the upstream again.
 */
export function createCachedCoopleClient(
  client: CoopleClient,
  options: CachedCoopleClientOptions,
): CoopleClient {
  const cacheOptions = { maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES, now: options.now };
  const lists = new TtlCache<CoopleJobListDto>(cacheOptions);
  const details = new TtlCache<CoopleJobDetailsDto>(cacheOptions);

  return {
    listJobs(pageNum, pageSize) {
      return lists.getOrLoad(`${pageNum}:${pageSize}`, options.listTtlMs, () =>
        client.listJobs(pageNum, pageSize),
      );
    },
    getJob(id) {
      // Ids are hex, so differing letter case is the same job.
      return details.getOrLoad(id.toLowerCase(), options.detailsTtlMs, () => client.getJob(id));
    },
  };
}
