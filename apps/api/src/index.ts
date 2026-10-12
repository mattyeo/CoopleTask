import { buildApp } from './app';
import { createCoopleClient } from './coople/coopleClient';
import { loadConfig } from './config';

const config = loadConfig();
const coopleClient = createCoopleClient({
  baseUrl: config.coopleBaseUrl,
  timeoutMs: config.upstreamTimeoutMs,
});
const app = await buildApp({ config, coopleClient }, { logger: true });

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
