FROM node:20-slim AS builder

# Build tools needed for better-sqlite3 native binary
RUN apt-get update -qq && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vite client (produces dist/client/)
RUN npm run build

# ── Production image ─────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update -qq && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"]
