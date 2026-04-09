import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma(): PrismaClient {
  // DATABASE_URL must be in SQLite "file:" form, e.g. "file:./prisma/dev.db"
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  console.log('[prisma] creating client, db url:', url);
  // Pass the url config to the adapter — it opens the SQLite file internally
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

// Cache in globalThis so only one connection exists per Node.js process
const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

export default prisma;
