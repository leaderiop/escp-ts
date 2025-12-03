FROM debian:stable-slim AS builder

# Install build dependencies
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

# Clone and build PrinterToPDF
# Fix: libHaru installs to /usr/local/include, but PrinterToPDF expects /usr/include
# Fix: Add missing libgen.h include for basename()
# Fix: Patch Makefile to use correct paths
RUN git clone https://github.com/RWAP/PrinterToPDF.git && \
    cd PrinterToPDF && \
    sed -i 's|/usr/include/hpdf.h|/usr/local/include/hpdf.h|g' PrinterConvert.c && \
    sed -i '1i #include <libgen.h>' PrinterConvert.c && \
    sed -i 's|-I/usr/include/SDL|-I/usr/include/SDL -I/usr/local/include|g' Makefile && \
    sed -i 's|-lhpdf|-L/usr/local/lib -lhpdf|g' Makefile && \
    make

# --- Runtime stage ---
FROM debian:stable-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpng16-16 \
    libsdl1.2debian \
    libsdl-image1.2 \
    zlib1g \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Copy libHaru
COPY --from=builder /usr/local/lib/libhpdf* /usr/local/lib/
RUN ldconfig

# Copy PrinterToPDF binary and fonts
COPY --from=builder /tmp/PrinterToPDF/printerToPDF /usr/local/bin/
COPY --from=builder /tmp/PrinterToPDF/font2 /usr/local/share/PrinterToPDF/font2

# Create working directory
WORKDIR /work

# Default entrypoint - convert PRN to PDF
# Usage: docker run -v "$PWD:/work" escp2pdf input.prn [output-dir]
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
