import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
let prisma;

// Function to get or create Prisma client with custom configuration
export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Disable prepared statements to avoid caching issues in serverless
      log: ['error'],
      // Use connection pooling settings
      __internal: {
        engine: {
          binaryTargets: ['native']
        }
      }
    });
  }
  return prisma;
}

// Function to safely disconnect Prisma client
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Function to create a fresh Prisma client for each request (serverless-safe)
export function createFreshPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error']
  });
}
