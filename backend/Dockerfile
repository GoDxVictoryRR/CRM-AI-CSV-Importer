# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL deps (including devDependencies for tsc)
COPY package*.json ./
RUN npm install --include=dev

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Environment defaults (override via docker-compose or platform env vars)
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]
