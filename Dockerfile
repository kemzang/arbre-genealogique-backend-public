# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Skip postinstall (prisma generate) here: prisma/ not copied yet. Run in builder stage.
RUN npm install --ignore-scripts

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (provide a dummy URL for build time validation)
ENV DATABASE_URL="postgresql://postgres:root@db:5432/family_tree"
RUN npx prisma generate

# Build the app
RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install prisma globally to have the CLI available for db push
RUN npm install -g prisma

# Create upload directory
RUN mkdir -p public/uploads

# Copy necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY docker-start.sh ./
# Fix Windows CRLF → LF so ./docker-start.sh runs in Alpine
RUN sed -i 's/\r$//' docker-start.sh

# Set permissions
RUN chmod +x docker-start.sh && chown -R node:node /app

USER node

EXPOSE 3000

# Start script
CMD ["./docker-start.sh"]
