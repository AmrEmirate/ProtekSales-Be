# Stage 1: Build & compile TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
