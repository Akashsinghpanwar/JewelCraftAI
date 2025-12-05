#!/bin/bash
set -e

export PORT="${PORT:-3000}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"

echo "Starting FastAPI on ${BACKEND_PORT}..."
cd /app/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port "${BACKEND_PORT}" --timeout-keep-alive 300 &
BACK_PID=$!

echo "Starting Next.js on ${PORT}..."
cd /app/frontend
npm run start -- --hostname 0.0.0.0 --port "${PORT}"

wait "${BACK_PID}"
