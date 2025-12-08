import { env } from './config/env';
import { logger } from './infrastructure/logger';
import { createApp } from './container';

async function bootstrap() {
  const app = await createApp();

  app.listen(env.port, () => {
    logger.info(`server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
