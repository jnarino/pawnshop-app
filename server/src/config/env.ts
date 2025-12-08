import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
  dotenv.config({ path: `.env.${nodeEnv}` });
}
dotenv.config();

export const env = {
  databaseUrl: process.env.DATABASE_URL ??
    `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
  jwtSecret: process.env.JWT_SECRET ?? 'H/wu3l1NCv3Dmd4aRXXsJHYDvhdk1KlUnn8GnB4f7gHmqTLUKNpgwYNtWSl/Z7bOjV7w/kfoUkJTWfC3kAYhdg==',
  port: Number(process.env.PORT ?? 3000)
};

if (!env.databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn('[env] DATABASE_URL is not set. Set it in your .env file.');
}
