#!/bin/sh
set -e

echo "🚀 Starting Nigerian Tax Compliance API..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => { console.log('✅ Database connected'); client.end(); process.exit(0); })
  .catch((err) => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
" 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping for 2 seconds..."
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations
echo "📦 Running database migrations..."
if npm run typeorm -- migration:run -d dist/config/typeorm.config.js; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration failed or no pending migrations"
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec node dist/main.js

