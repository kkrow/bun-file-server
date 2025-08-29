# Dockerfile for bun-file-server with multi-stage build
ARG BUN_VERSION=1.2.20
ARG TARGETARCH

# Stage 1: Build dependencies and compile
FROM oven/bun:${BUN_VERSION}-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create dist directory and build project
RUN bun run build.js

# Compile executable for target architecture
RUN if [ "$TARGETARCH" = "arm64" ]; then \
        bun build ./src/index.ts --compile --minify --sourcemap --outfile bun-file-server --target=bun-linux-arm64; \
    else \
        bun build ./src/index.ts --compile --minify --sourcemap --outfile bun-file-server --target=bun-linux-amd64; \
    fi

# Stage 2: Final image
FROM alpine:3.22.1

# Metadata
LABEL org.opencontainers.image.title="Bun File Server" \
      org.opencontainers.image.description="File server built with Bun runtime" \
      org.opencontainers.image.source="https://github.com/kkrow/bun-file-server" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy compiled executable from builder stage
COPY --from=builder /app/bun-file-server /app/bun-file-server

# Copy built static files
COPY --from=builder /app/dist /app/dist

# Install required dependencies and create user
RUN apk add --no-cache \
        wget \
        ca-certificates \
        tzdata \
        libc6-compat \
        libgcc \
        libstdc++ && \
    addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser && \
    mkdir -p /app/uploads /app/data && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 3000

# Default environment variables
ENV PORT=3000
ENV ADDRESS=0.0.0.0
ENV NODE_ENV=production

# Health check using the /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["/app/bun-file-server"]
