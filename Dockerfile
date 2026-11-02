# --- Stage 1: Build Front-End ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci

# Copy application sources and build production assets
COPY . .
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and backend server source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/services/mockData.ts ./src/services/mockData.ts
COPY --from=builder /app/src/services/emailService.ts ./src/services/emailService.ts

# Expose standard web port
EXPOSE 3000

# Start Express full-stack service
CMD ["npm", "run", "server"]

