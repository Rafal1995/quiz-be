#!/bin/sh
set -e

# Container entrypoint: run database migrations, then start the app.
#
# `set -e` ensures that if migrations fail, the script exits non-zero and the
# container stops with a clear error instead of starting the app against an
# out-of-date schema. Migrations are idempotent (TypeORM skips already-applied
# ones), so restarts are safe.
#
# DB readiness is guaranteed by compose (`depends_on: condition: service_healthy`),
# so no extra wait/retry loop is needed here.

echo "Running database migrations..."
npm run migration:run:prod

echo "Starting application..."
exec "$@"
