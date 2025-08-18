import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function getPgBouncerSafeUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  const hasQuery = base.includes('?');
  const sep = hasQuery ? '&' : '?';
  const add = 'pgbouncer=true&connection_limit=1';
  if (/pgbouncer=true/.test(base)) return base;
  return `${base}${sep}${add}`;
}

const runtimeUrl = getPgBouncerSafeUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: runtimeUrl ? { db: { url: runtimeUrl } } : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
