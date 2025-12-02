# Multi-stage build for Indeed Job Application Dashboard

# Stage 1: Build stage (if needed for future enhancements)
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies for extraction script
RUN pip install --no-cache-dir beautifulsoup4

# Stage 2: Production stage
FROM nginx:alpine

# Install Python for the extraction script
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir beautifulsoup4

# Copy application files
COPY src/ /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/
COPY scripts/ /app/scripts/
COPY extract/ /app/extract/

# Create necessary directories
RUN mkdir -p /app/data && \
    chmod +x /app/scripts/*.py

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]