# ==============================================================
# Stage 1: Build React + Vite Frontend Application
# ==============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using clean lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and assets (including 3D .glb models and photos)
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src

# Optional build-time API gateway URL (defaults to relative /api path for reverse proxy / Ingress)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run typecheck && npm run build

# ==============================================================
# Stage 2: Production Nginx Runtime
# ==============================================================
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
