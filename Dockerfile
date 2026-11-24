# ---------- Compilación ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Producción ----------
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Solo la salida compilada: servidor Nitro + páginas pre-generadas + estáticos
COPY --from=build /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/robots.txt > /dev/null || exit 1

CMD ["node", ".output/server/index.mjs"]
