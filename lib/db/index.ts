// Prisma 7: PrismaClient requires a driver adapter.
// We use @prisma/adapter-pg with the pooled DATABASE_URL for app queries.
// The direct DIRECT_URL is used only by migrations (configured in prisma.config.ts).
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
