#!/bin/sh
set -e

echo "Initializing database..."
mkdir -p /app/data

# Push Prisma schema to database (creates tables)
npx prisma db push --skip-generate

echo "Starting server..."
exec node dist/index.js
