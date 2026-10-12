import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';
import { createStubCoopleClient } from './stubCoopleClient';

function buildTestApp() {
  return buildApp({ config: loadConfig({}), coopleClient: createStubCoopleClient() });
}

describe('app', () => {
  it('responds to the health check', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns an ApiErrorBody for unknown routes', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_REQUEST', message: 'Route not found' },
    });
  });
});

describe('loadConfig', () => {
  it('applies defaults', () => {
    expect(loadConfig({})).toMatchObject({ port: 4000, corsOrigin: 'http://localhost:8081' });
  });

  it('fails fast on invalid env', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/Invalid environment configuration/);
  });
});
