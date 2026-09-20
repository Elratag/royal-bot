import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function initDatabase() {
  try {
    await prisma.$connect();
    console.log('💎 [Database] Connected successfully to SQLite/PostgreSQL via Prisma.');
  } catch (err) {
    console.error('❌ [Database] Connection failed:', err);
  }
}
