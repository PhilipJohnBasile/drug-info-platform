# Docker Deployment Guide

This guide covers how to run the Drug Information Platform using Docker Compose.

## Quick Start

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd drug-info-platform
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:5432
   - Redis: localhost:6379

## Services Overview

### Core Services

| Service    | Port | Description                    | Dependencies |
|------------|------|--------------------------------|--------------|
| frontend   | 3000 | Next.js web application        | backend      |
| backend    | 4000 | NestJS API server              | postgres, redis |
| postgres   | 5432 | PostgreSQL database            | none         |
| redis      | 6379 | Redis cache and sessions       | none         |
| nginx      | 80   | Reverse proxy (production)     | frontend, backend |

### Service Dependencies

```
nginx (optional) → frontend → backend → postgres, redis
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
POSTGRES_DB=drug_info_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# API Keys (required for AI features)
HUGGINGFACE_API_KEY=your-huggingface-key

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Optional Environment Variables

```bash
# Ports (defaults shown)
FRONTEND_PORT=3000
BACKEND_PORT=4000
POSTGRES_PORT=5432
REDIS_PORT=6379

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

## Development Setup

### Using the Development Script

The `docker-dev.sh` script provides convenient commands:

```bash
# Make it executable
chmod +x docker-dev.sh

# Start all services
./docker-dev.sh start

# Check status
./docker-dev.sh status

# View logs
./docker-dev.sh logs

# Stop services
./docker-dev.sh stop
```

### Manual Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## Production Deployment

### Using Production Override

```bash
# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Include nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### Production Environment Variables

Additional variables for production:

```bash
NODE_ENV=production
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

## Health Checks

All services include comprehensive health checks:

### Health Check Endpoints

- **Frontend**: `GET /api/health`
- **Backend**: `GET /health`
- **Database**: `pg_isready` command
- **Redis**: `redis-cli ping` command

### Monitoring Health

```bash
# Check all service health
./docker-dev.sh status

# Manual health checks
curl http://localhost:3000/api/health
curl http://localhost:4000/health
```

## Data Persistence

### Volumes

| Volume | Purpose | Location |
|--------|---------|----------|
| postgres_data | Database files | `/var/lib/postgresql/data` |
| redis_data | Redis persistence | `/data` |
| backend_logs | Application logs | `/app/logs` |
| nginx_logs | Web server logs | `/var/log/nginx` |

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres drug_info_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres drug_info_db < backup.sql

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
```

## Database Management

### Migrations

```bash
# Run migrations
docker-compose exec backend npm run prisma:migrate:dev

# Generate Prisma client
docker-compose exec backend npm run prisma:generate

# Reset database (development only)
docker-compose exec backend npm run prisma:migrate:reset
```

### Seeding

```bash
# Seed database with sample data
docker-compose exec backend npm run prisma:seed
```

## Troubleshooting

### Common Issues

#### Services Not Starting

1. **Check Docker and Docker Compose versions:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Verify .env file exists and has correct values**

3. **Check port conflicts:**
   ```bash
   lsof -i :3000
   lsof -i :4000
   lsof -i :5432
   lsof -i :6379
   ```

#### Database Connection Issues

1. **Wait for PostgreSQL to be ready:**
   ```bash
   docker-compose logs postgres
   ```

2. **Check database connectivity:**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

#### Backend API Issues

1. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose exec backend env | grep -E "(DATABASE_URL|REDIS_URL)"
   ```

#### Frontend Build Issues

1. **Clear Next.js cache:**
   ```bash
   docker-compose exec frontend rm -rf .next
   docker-compose restart frontend
   ```

2. **Check frontend logs:**
   ```bash
   docker-compose logs frontend
   ```

### Debugging Commands

```bash
# Enter container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# View container resource usage
docker stats

# Inspect service configuration
docker-compose config

# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec frontend ping backend
```

## Performance Optimization

### Resource Limits (Production)

The production configuration includes resource limits:

- **Backend**: 1GB RAM, 1 CPU
- **Frontend**: 512MB RAM, 0.5 CPU
- **PostgreSQL**: 1GB RAM, 0.5 CPU
- **Redis**: 512MB RAM, 0.25 CPU
- **Nginx**: 256MB RAM, 0.25 CPU

### Scaling Services

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer (nginx)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --scale backend=3
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable SSL/TLS** for production deployments
4. **Restrict database access** to application containers only
5. **Use secrets management** for sensitive data in production

## Maintenance

### Log Rotation

Production configuration includes automatic log rotation:
- Max log size: 10MB
- Max log files: 3-5 per service

### Updates

```bash
# Update application code
git pull
docker-compose up -d --build

# Update base images
docker-compose pull
docker-compose up -d
```

### Cleanup

```bash
# Remove unused containers and images
docker system prune

# Complete cleanup (removes volumes)
./docker-dev.sh clean
```

## Support

For issues or questions:
1. Check the logs: `./docker-dev.sh logs`
2. Verify health status: `./docker-dev.sh status`
3. Review this documentation
4. Check the main README.md for application-specific guidance