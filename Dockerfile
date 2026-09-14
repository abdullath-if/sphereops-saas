# Multi-stage production build for SphereOps SaaS

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets to server/client dist directory
COPY --from=client-builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p /app/server/uploads

EXPOSE 5000

CMD ["node", "server/src/server.js"]
