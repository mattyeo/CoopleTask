import { vi } from 'vitest';
import type { CoopleClient } from '../src/coople/coopleClient';

export function createStubCoopleClient() {
  return {
    listJobs: vi.fn<CoopleClient['listJobs']>(),
    getJob: vi.fn<CoopleClient['getJob']>(),
  } satisfies CoopleClient;
}
