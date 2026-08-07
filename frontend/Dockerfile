# Stage dev dipakai docker-compose.yml (hot reload, source di-bind mount).
FROM node:22-alpine AS dev
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage prod dipakai docker-compose.prod.yml (standalone output, tanpa dev deps).
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* dijahit ke dalam bundel saat `npm run build`, bukan dibaca
# saat kontainer jalan. Tanpa ARG di sini, mengisinya di .env tidak
# berpengaruh apa-apa di produksi — alamatnya diam-diam hilang.
ARG NEXT_PUBLIC_URL_BELI=""
ENV NEXT_PUBLIC_URL_BELI=$NEXT_PUBLIC_URL_BELI
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
