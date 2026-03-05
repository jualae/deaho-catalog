# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the server
RUN pnpm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm in runtime
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start server
CMD ["node", "dist/index.js"]
