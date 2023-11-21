# Этап 1: Стадия зависимостей
FROM node:19.4-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Этап 2: Строительная стадия для разработки
FROM node:19.4-alpine AS builder-dev
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# Этап 3: Строительная стадия для продакшена
FROM node:19.4-alpine AS builder-prod
WORKDIR /app
ENV NODE_ENV=production

COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# Этап 4: Рантайм-стадия для разработки
FROM node:19.4-alpine AS dev
WORKDIR /app
ARG API_PORT
ARG API_HOST

ENV NODE_ENV development
ENV PORT=${API_PORT}

COPY --from=builder-dev /app/public ./public
COPY --from=builder-dev /app/.next ./.next
COPY --from=builder-dev /app/node_modules ./node_modules

EXPOSE $PORT
CMD ["yarn", "dev"]

# Этап 5: Рантайм-стадия для продакшена
FROM node:19.4-alpine AS prod
WORKDIR /app

ARG API_PORT
ARG API_HOST

ENV PORT=${API_PORT}

COPY --from=builder-prod /app/public ./public
COPY --from=builder-prod /app/.next/standalone ./
COPY --from=builder-prod /app/.next/static ./.next/static

EXPOSE $PORT
CMD ["node", "server.js"]

