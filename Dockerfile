# =============================================================================
# ESC/P Converter API - Multi-stage Docker Build
#
# This Dockerfile builds from the monorepo root to access workspace dependencies.
# It creates a single container with NestJS API + PrinterToPDF binary.
# =============================================================================

# =============================================================================
# Stage 1: Build PrinterToPDF (C binary with libHaru)
# =============================================================================
FROM debian:stable-slim AS printer-builder

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    libpng-dev \
    libsdl1.2-dev \
    libsdl-image1.2-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Build libHaru from source
WORKDIR /tmp
RUN git clone https://github.com/libharu/libharu.git && \
    cd libharu && \
    mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc) && \
    make install

# Clone and build PrinterToPDF with fixes
RUN git clone https://github.com/RWAP/PrinterToPDF.git && \
    cd PrinterToPDF && \
    sed -i 's|/usr/include/hpdf.h|/usr/local/include/hpdf.h|g' PrinterConvert.c && \
    sed -i '1i #include <libgen.h>' PrinterConvert.c && \
    sed -i 's|-I/usr/include/SDL|-I/usr/include/SDL -I/usr/local/include|g' Makefile && \
    sed -i 's|-lhpdf|-L/usr/local/lib -lhpdf|g' Makefile && \
    make

# =============================================================================
# Stage 2: Build NestJS application with pnpm (monorepo-aware)
# =============================================================================
FROM node:20-slim AS nest-builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy tooling/config (shared configs)
COPY tooling/config ./tooling/config

# Copy the converter app
COPY apps/converter ./apps/converter

# Install dependencies with pnpm (workspace-aware)
RUN pnpm install --frozen-lockfile --filter @escp/converter...

# Build the converter app
WORKDIR /app/apps/converter
RUN pnpm build

# Deploy to a clean directory with all dependencies resolved (no symlinks)
WORKDIR /app
RUN pnpm deploy --filter @escp/converter --prod --legacy /deploy

# =============================================================================
# Stage 3: Production image
# =============================================================================
FROM debian:stable-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpng16-16 \
    libsdl1.2debian \
    libsdl-image1.2 \
    zlib1g \
    imagemagick \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js runtime
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy libHaru from printer builder
COPY --from=printer-builder /usr/local/lib/libhpdf* /usr/local/lib/
RUN ldconfig

# Copy PrinterToPDF binary and fonts
COPY --from=printer-builder /tmp/PrinterToPDF/printerToPDF /usr/local/bin/
COPY --from=printer-builder /tmp/PrinterToPDF/font2 /usr/local/share/PrinterToPDF/font2

# Copy NestJS application from pnpm deploy output
WORKDIR /app
COPY --from=nest-builder /deploy ./
COPY --from=nest-builder /app/apps/converter/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PRINTER_PATH=/usr/local/bin/printerToPDF
ENV FONT_PATH=/usr/local/share/PrinterToPDF/font2/Epson-Standard.C16

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/main.js"]
