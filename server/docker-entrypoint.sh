#!/bin/sh
set -e

echo "🔧 Initializing database..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Push Prisma schema to database (creates tables)
npx prisma db push --skip-generate

# Check if admin user exists, if not run seed
echo "🌱 Checking for seed data..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkAndSeed() {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.log('No admin found, running seed...');
    process.exit(1);
  } else {
    console.log('Admin already exists, skipping seed');
    process.exit(0);
  }
}
checkAndSeed().catch(() => process.exit(1));
" || node dist/seed.js

echo "🚀 Starting server..."
exec node dist/index.js
