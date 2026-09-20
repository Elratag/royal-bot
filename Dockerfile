# Production Multi-Stage Dockerfile for Royal Discord Bot & Dashboard Suite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install

# Build dashboard
COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm install

COPY dashboard ./dashboard/
RUN cd dashboard && npm run build

# Build backend
COPY src ./src/
RUN npx prisma generate
RUN npm run build:backend

# ----------------------------------------------------
# Production Runtime Stage
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install ffmpeg and opus libraries for voice/audio
RUN apk add --no-cache ffmpeg

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dashboard/dist ./dashboard/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/src/index.js"]
