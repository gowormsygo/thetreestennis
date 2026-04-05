import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const defaultDbPath = 'prisma/dev.db';
  const dbUrl = process.env.DATABASE_URL;
  const resolvedPath = dbUrl ? dbUrl.replace(/^file:/, '') : defaultDbPath;
  const dbPath = path.resolve(process.cwd(), resolvedPath);
  const sqlite = new Database(dbPath);
  const adapter = new PrismaBetterSqlite3(sqlite);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
