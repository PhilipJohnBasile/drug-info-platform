# Deployment Guide

## Production Deployment

### Prerequisites

- Docker & Docker Compose
- Domain name with SSL certificate
- Environment variables configured
- Database backup strategy

### 1. Environment Setup

Create production environment file:

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/drug_info_db
REDIS_URL=redis://redis:6379
HUGGINGFACE_API_KEY=hf_...
JWT_SECRET=your-super-secret-jwt-key
POSTGRES_PASSWORD=secure-db-password
REDIS_PASSWORD=secure-redis-password
```

### 2. Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### 3. SSL Configuration

#### Option A: Using Nginx Proxy Manager
```bash
# Add to docker-compose.prod.yml
nginx-proxy-manager:
  image: jc21/nginx-proxy-manager:latest
  ports:
    - "80:80"
    - "81:81"
    - "443:443"
  volumes:
    - ./nginx/data:/data
    - ./nginx/letsencrypt:/etc/letsencrypt
```

#### Option B: Traefik
```bash
# Add labels to frontend service
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
  - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

### 4. Database Migration

```bash
# Run migrations
docker-compose exec backend npm run prisma:migrate:deploy

# Seed production data
docker-compose exec backend npm run seed:prod
```

### 5. Health Checks

```bash
# API health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "ai_providers": {
    "huggingface": "active"
  },
  "uptime": "2d 5h 32m",
  "version": "1.0.0"
}
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm run test:cov
          cd ../frontend && npm run test:coverage
      
      - name: Run E2E tests
        run: cd frontend && npm run e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Deploy script here
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## Monitoring & Alerting

### 1. Application Monitoring

```bash
# Add monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

Services included:
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **AlertManager**: Alert routing
- **Node Exporter**: System metrics

### 2. Log Management

```bash
# Centralized logging with ELK stack
docker-compose -f docker-compose.logging.yml up -d
```

### 3. Health Monitoring

Set up monitoring endpoints:

```javascript
// Custom health checks
GET /api/health/detailed
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "responseTime": "12ms" },
    "redis": { "status": "up", "responseTime": "3ms" },
    "ai_huggingface": { "status": "up", "responseTime": "1.2s" }
  },
  "metrics": {
    "uptime": "5d 12h 45m",
    "memory_usage": "45%",
    "cpu_usage": "12%",
    "active_connections": 23,
    "requests_per_minute": 145
  }
}
```

## Backup Strategy

### 1. Database Backups

```bash
# Automated daily backups
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres pg_dump -U postgres drug_info_db > backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql s3://backups/database/
```

### 2. Application Data

```bash
# Backup uploaded files and configurations
tar -czf app_data_${DATE}.tar.gz ./data ./uploads
aws s3 cp app_data_${DATE}.tar.gz s3://backups/app-data/
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    
  frontend:
    deploy:
      replicas: 2
      
  redis:
    deploy:
      replicas: 3
      mode: replicated
```

### Load Balancing

```nginx
# nginx.conf
upstream backend {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}
```

## Security Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] Database passwords rotated
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates
- [ ] Firewall rules configured
- [ ] Backup encryption enabled
- [ ] Monitoring alerts active