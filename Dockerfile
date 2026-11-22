# Multi-stage Dockerfile for ReviewLens
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and client dependency specifications
COPY package*.json ./
COPY client/package*.json ./client/

# Install root dependencies
RUN npm ci

# Install client dependencies
RUN npm --prefix client ci

# Copy source code
COPY . .

# Build frontend production bundle
RUN npm --prefix client run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root dependencies and build outputs
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/reviews.csv ./reviews.csv
COPY --from=builder /app/.env.example ./.env.example

# Create data directory for cache persistence
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "server/index.js"]
