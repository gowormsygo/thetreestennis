import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// GET /api/debug — server diagnostics (safe: no sensitive data exposed)
export async function GET() {
  const checks = {};

  // 1. Environment
  const rawUrl = process.env.DATABASE_URL ?? '(not set, using default)';
  checks.DATABASE_URL_set = !!process.env.DATABASE_URL;
  checks.NODE_ENV = process.env.NODE_ENV;

  // 2. Resolve the DB path (same logic as lib/prisma.ts)
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  const filePart = url.startsWith('file:') ? url.slice(5) : url;
  const dbPath = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart);

  checks.db_path = dbPath;
  checks.db_file_exists = fs.existsSync(dbPath);
  checks.cwd = process.cwd();

  // 3. Check prisma directory
  const prismaDir = path.resolve(process.cwd(), 'prisma');
  checks.prisma_dir_exists = fs.existsSync(prismaDir);

  // 4. Check generated client
  const generatedDir = path.resolve(process.cwd(), 'generated', 'prisma');
  checks.generated_client_exists = fs.existsSync(generatedDir);

  // 5. Try a real DB query
  try {
    const prisma = (await import('../../../lib/prisma')).default;
    const userCount = await prisma.user.count();
    const bookingCount = await prisma.booking.count();
    checks.db_connected = true;
    checks.user_count = userCount;
    checks.booking_count = bookingCount;
  } catch (err) {
    checks.db_connected = false;
    checks.db_error = String(err?.message ?? err);
  }

  const allOk = checks.db_connected && checks.db_file_exists;

  return NextResponse.json({
    status: allOk ? 'ok' : 'error',
    checks,
  }, { status: allOk ? 200 : 500 });
}
