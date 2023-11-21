# Этап 1: Стадия зависимостей
FROM node:19.4-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Этап 2: Разработка
FROM deps AS dev
WORKDIR /app
ARG API_PORT
ENV NODE_ENV development
ENV PORT=${API_PORT}
COPY . .
EXPOSE $PORT
CMD ["yarn", "start:dev"]

# Этап 3: Сборка для продакшена
FROM deps AS builder
WORKDIR /app
COPY . .
ENV NODE_ENV production
RUN yarn build

# Этап 4: Запуск продакшена
FROM node:19.4-alpine AS prod
WORKDIR /app
ARG API_PORT
ENV PORT=${API_PORT}
ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE $PORT
CMD ["node", "dist/main.js"]
