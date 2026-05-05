# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_STRAPI_BASE_URL
ARG VITE_STRAPI_TOKEN

ENV VITE_STRAPI_BASE_URL=$VITE_STRAPI_BASE_URL
ENV VITE_STRAPI_TOKEN=$VITE_STRAPI_TOKEN

RUN npm run build

# =============================================================================
# Stage 2: Serve
# =============================================================================
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]