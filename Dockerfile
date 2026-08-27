# syntax=docker/dockerfile:1

FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm install -g npm@12.0.1
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:25-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm install -g npm@12.0.1
RUN npm ci --omit=dev --workspace backend
COPY backend/src backend/src
COPY database database
COPY shared shared
COPY --from=build /app/frontend/dist frontend/dist
WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "src/server.js"]
