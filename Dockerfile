# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src

RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Chỉ cài đặt dependencies cho môi trường production
RUN npm ci --omit=dev

# Sao chép code đã được build sang môi trường chạy
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
