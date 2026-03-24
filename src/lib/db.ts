import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { config as dotenvConfig } from 'dotenv'

// Next.js should load `.env.local` automatically, but Prisma connection errors suggest
// the env isn't present in the runtime where this module is evaluated.
// Load explicitly to make local/dev auth reliable.
dotenvConfig({ path: '.env.local', override: false })
dotenvConfig({ path: '.env', override: false })

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL
    if (!databaseUrl) {
        throw new Error(
            'DATABASE_URL is missing. Ensure `.env.local` contains DATABASE_URL (or DIRECT_URL as fallback).',
        )
    }

    // `PrismaNeon` expects a `neon.PoolConfig`, not the `neon()` query function.
    // Passing the wrong shape causes Prisma/Neon to think host/connection string is missing.
    const adapter = new PrismaNeon({ connectionString: databaseUrl })
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['error', 'warn']
            : ['error'],
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}