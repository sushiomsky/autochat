FROM node:22-bookworm-slim AS base
WORKDIR /app

ENV CHROMEDRIVER_SKIP_DOWNLOAD=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
    NODE_ENV=development \
    NPM_CONFIG_LEGACY_PEER_DEPS=true

COPY package*.json ./
COPY .npmrc ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY . .
RUN npm run verify

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN useradd -m -u 10001 appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/manifest.json ./manifest.json
COPY --from=builder /app/manifest_firefox.json ./manifest_firefox.json
USER appuser

CMD ["bash", "-c", "ls dist && echo \"Artifacts available at /app/dist\""]
