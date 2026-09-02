# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install deps first so this layer is cached until package files change.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS production

# dumb-init acts as PID 1: forwards signals (SIGTERM from `docker stop`) to
# Node and reaps zombie processes. Combined with app.enableShutdownHooks()
# this gives a clean graceful shutdown.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app

# Production dependencies only (no devDependencies).
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled output from the builder stage.
COPY --from=builder /app/dist ./dist

# Entrypoint runs migrations before starting the app.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as the built-in non-root `node` user shipped with the base image.
USER node

EXPOSE 3000

# Liveness check against the app's /health endpoint (IPv4 to match listener).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# dumb-init (PID 1) -> entrypoint (runs migrations) -> exec node (CMD).
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
