# Multi-stage build for Indeed Job Application Dashboard
# Optimized for size and security

# Stage 1: Builder (Python dependencies)
FROM python:3.11-alpine as builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    libffi-dev

# Install Python packages
COPY scripts/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production
FROM nginx:alpine

# Install runtime dependencies only
RUN apk add --no-cache python3

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts are in path
ENV PATH=/root/.local/bin:$PATH

# Copy application files
COPY src/ /usr/share/nginx/html/
COPY scripts/ /app/scripts/

# Create directories with proper permissions
# Added /etc/nginx/conf.d to permissions to fix startup script errors
RUN mkdir -p /app/data /app/extract /usr/share/nginx/html/data && \
    chmod +x /app/scripts/*.py && \
    addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser && \
    chown -R appuser:appgroup /usr/share/nginx/html /app /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    chmod -R 755 /app

# Copy data and extract directories
# Removed invalid '|| true' syntax
COPY --chown=appuser:appgroup data/ /usr/share/nginx/html/data/
COPY --chown=appuser:appgroup extract/ /app/extract/

# Copy custom nginx configuration with correct ownership
COPY --chown=appuser:appgroup docker/nginx.conf /etc/nginx/conf.d/default.conf

# Fix nginx to run as non-root
RUN sed -i 's/user nginx;/user appuser;/' /etc/nginx/nginx.conf && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]