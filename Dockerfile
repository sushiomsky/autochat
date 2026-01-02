# Multi-stage Dockerfile for AutoChat Chrome Extension
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Run linter and tests
RUN npm run lint || true
RUN npm test -- --testPathIgnorePatterns="tests/integration" || true

# Build production artifacts
RUN npm run build:prod
RUN npm run build:firefox:prod

# Create package artifacts
RUN cd dist && zip -r /app/autochat-chrome.zip ./*
RUN cd dist-firefox && zip -r /app/autochat-firefox.zip ./*

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S autochat && \
    adduser -S -u 1001 -G autochat autochat

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    curl

# Copy only production artifacts from builder
COPY --from=builder --chown=autochat:autochat /app/dist ./dist
COPY --from=builder --chown=autochat:autochat /app/dist-firefox ./dist-firefox
COPY --from=builder --chown=autochat:autochat /app/autochat-chrome.zip ./
COPY --from=builder --chown=autochat:autochat /app/autochat-firefox.zip ./
COPY --from=builder --chown=autochat:autochat /app/manifest.json ./
COPY --from=builder --chown=autochat:autochat /app/README.md ./
COPY --from=builder --chown=autochat:autochat /app/LICENSE ./

# Switch to non-root user
USER autochat

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD test -f /app/dist/manifest.json || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Default command (serve static files for inspection)
CMD ["sh", "-c", "echo 'AutoChat build artifacts ready' && ls -lah /app && tail -f /dev/null"]

# Metadata
LABEL org.opencontainers.image.title="AutoChat Extension"
LABEL org.opencontainers.image.description="Automated message sender browser extension"
LABEL org.opencontainers.image.version="5.0.0"
LABEL org.opencontainers.image.vendor="AutoChat Team"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/sushiomsky/autochat"
