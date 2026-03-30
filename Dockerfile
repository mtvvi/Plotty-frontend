FROM node:20-alpine AS base

# Зависимости
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Сборка
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG BACKEND_URL
ARG NEXT_PUBLIC_API_URL
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_MOCKING=disabled
RUN npm run build

# Продакшен образ
FROM base AS runner
WORKDIR /app
ARG BACKEND_URL
ENV NODE_ENV=production
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_API_MOCKING=disabled

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
