FROM node:18-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package*.json ./

# Install dependencies (this will be cached if package.json doesn't change)
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 4000

# Health check with longer timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:4000/ping || exit 1

# Start command - simplified for MongoDB
CMD ["node", "server.js"]
