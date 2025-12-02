# Docker Deployment Guide

This guide covers containerized deployment of the Indeed Job Application Dashboard.

## 🐳 Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

Access the dashboard at: **http://localhost:8080**

### Using Docker CLI

```bash
# Build the image
docker build -t indeed-dashboard .

# Run the container
docker run -d \
  --name indeed-dashboard \
  -p 8080:80 \
  -v $(pwd)/data:/usr/share/nginx/html/data:ro \
  -v $(pwd)/extract:/app/extract \
  indeed-dashboard

# View logs
docker logs -f indeed-dashboard

# Stop and remove
docker stop indeed-dashboard
docker rm indeed-dashboard
```

## 📦 Container Details

### Image Information
- **Base Image**: `nginx:alpine` (lightweight, ~40MB)
- **Python**: Included for extraction scripts
- **Ports**: Exposes port 80 (mapped to 8080 on host)
- **Volumes**: Data and extract directories mounted

### Included Features
✅ Automated health checks  
✅ Gzip compression  
✅ Security headers  
✅ CORS enabled for development  
✅ Static asset caching  
✅ Multi-platform support (amd64, arm64)

## 🔄 GitHub Actions Workflow

The project includes automated CI/CD with GitHub Actions:

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main`
- Version tags (`v*`)
- Manual workflow dispatch

### Pipeline Steps
1. **Build**: Builds Docker image with Buildx
2. **Test**: Runs container and performs health check
3. **Push**: Pushes to GitHub Container Registry (ghcr.io)
4. **Security Scan**: Scans with Trivy for vulnerabilities

### Image Tags
Images are automatically tagged:
- `latest` - Latest main branch
- `v1.0.0` - Semantic version tags
- `main-sha123abc` - Branch + commit SHA
- `pr-42` - Pull request number

## 🚀 Pulling Pre-built Images

### From GitHub Container Registry

```bash
# Pull latest image
docker pull ghcr.io/yourusername/indeed-data-dashboard:latest

# Run pulled image
docker run -d \
  --name indeed-dashboard \
  -p 8080:80 \
  ghcr.io/yourusername/indeed-data-dashboard:latest
```

### Setting up GitHub Container Registry
1. Enable GitHub Packages in repository settings
2. Create Personal Access Token with `write:packages` scope
3. Login to registry:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## 🔧 Advanced Configuration

### Custom nginx Configuration

Edit `docker/nginx.conf` to customize server behavior:
- Change port bindings
- Modify cache policies
- Add SSL/TLS support
- Configure rate limiting

### Environment Variables

```bash
docker run -d \
  -e NGINX_HOST=dashboard.example.com \
  -e NGINX_PORT=80 \
  -p 8080:80 \
  indeed-dashboard
```

### Volume Mounts

Mount additional directories:
```yaml
volumes:
  - ./custom-data:/usr/share/nginx/html/custom-data
  - ./logs:/var/log/nginx
```

## 🛠️ Development Workflow

### Local Testing

```bash
# Build development image
docker build -t indeed-dashboard:dev .

# Run with live reload (mount source)
docker run -d \
  -p 8080:80 \
  -v $(pwd)/src:/usr/share/nginx/html \
  -v $(pwd)/data:/usr/share/nginx/html/data \
  indeed-dashboard:dev
```

### Running Extraction Script in Container

```bash
# Execute extraction script
docker exec indeed-dashboard python3 /app/scripts/extract_indeed_html.py

# Copy generated JSON to host
docker cp indeed-dashboard:/app/data/indeed-applications.json ./data/
```

## 📊 Monitoring

### Health Check Status

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' indeed-dashboard
```

### Resource Usage

```bash
# Monitor CPU/Memory
docker stats indeed-dashboard

# View detailed resource usage
docker top indeed-dashboard
```

## 🔒 Security Best Practices

### 1. Use Specific Image Versions
```dockerfile
FROM nginx:1.25-alpine
```

### 2. Run as Non-Root User
```dockerfile
RUN adduser -D -u 1000 appuser
USER appuser
```

### 3. Scan for Vulnerabilities
```bash
# Using Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image indeed-dashboard:latest
```

### 4. Minimal Image Size
Current image: ~60MB (nginx:alpine + Python)

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs indeed-dashboard

# Inspect configuration
docker inspect indeed-dashboard
```

### Port Already in Use
```bash
# Change host port
docker run -p 8081:80 indeed-dashboard
```

### Data Not Loading
```bash
# Verify volume mounts
docker exec indeed-dashboard ls -la /usr/share/nginx/html/data

# Check nginx access logs
docker logs indeed-dashboard 2>&1 | grep "GET /data"
```

### Permission Issues
```bash
# Fix volume permissions
chmod -R 755 ./data ./extract
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [nginx Configuration Guide](https://nginx.org/en/docs/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🤝 Contributing

When adding Docker-related changes:
1. Test locally with `docker compose up`
2. Ensure health checks pass
3. Update this documentation
4. Verify multi-platform builds work

---

**Need Help?** Open an issue with the `docker` label.