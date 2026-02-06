/**
 * Prisma client singleton instance
 */

import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance for the entire app
const prisma = new PrismaClient();

export default prisma;
