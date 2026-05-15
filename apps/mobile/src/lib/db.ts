import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new client if models are missing (hot-reload cache issue)
let existingClient = globalForPrisma.prisma
if (existingClient && (!('review' in existingClient) || !('readingSession' in existingClient))) {
  existingClient = undefined
  globalForPrisma.prisma = undefined
}

export const db =
  existingClient ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
