import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  // DATABASE_URL for SQLite is in the form "file:./path/to/db" or "file:/absolute/path"
  const filePart = url.startsWith('file:') ? url.slice(5) : url;
  // Resolve relative paths from the project root
  return path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart);
}

function createPrisma() {
  const dbPath = getDbPath();
  const sqlite = new Database(dbPath);
  const adapter = new PrismaBetterSqlite3(sqlite);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
