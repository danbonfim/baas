#!/bin/bash
# BAAS Development Startup Script
# Starts: local PostgreSQL (embedded) + NestJS backend + Next.js frontend

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_BIN="$ROOT_DIR/backend/node_modules/@embedded-postgres/darwin-arm64/native/bin"
PG_LIB="$ROOT_DIR/backend/node_modules/@embedded-postgres/darwin-arm64/native/lib"
PG_DATA="$ROOT_DIR/backend/.pgdata"

echo "🐘 Starting local PostgreSQL..."

# Check if postgres is already running
if "$PG_BIN/pg_ctl" -D "$PG_DATA" status > /dev/null 2>&1; then
  echo "   PostgreSQL already running"
else
  DYLD_LIBRARY_PATH="$PG_LIB" "$PG_BIN/pg_ctl" \
    -D "$PG_DATA" -o "-p 5433 -k /tmp" \
    start -l "$PG_DATA/postgres.log" -w
  echo "   PostgreSQL started on port 5433"
fi

echo "🚀 Starting backend..."
cd "$ROOT_DIR/backend"
npm run start:dev &
BACK_PID=$!

echo "⚡ Starting frontend..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONT_PID=$!

echo ""
echo "✅ BAAS is running!"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001/api"
echo "   Swagger:   http://localhost:3001/api/docs"
echo ""
echo "   Test credentials:"
echo "   Cliente:  cliente@baas.com / cliente123"
echo "   Admin:    admin@baas.com   / admin123"
echo "   Pro:      isabella.santos@baas.com / senha123"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and handle cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACK_PID $FRONT_PID 2>/dev/null || true
  DYLD_LIBRARY_PATH="$PG_LIB" "$PG_BIN/pg_ctl" -D "$PG_DATA" stop 2>/dev/null || true
  echo "Done."
}

trap cleanup INT TERM
wait $BACK_PID $FRONT_PID
