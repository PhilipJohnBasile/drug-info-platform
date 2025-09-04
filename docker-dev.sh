#!/bin/bash

# Drug Information Platform Docker Development Script
# Usage: ./docker-dev.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your actual values before continuing."
            print_warning "Especially set your HUGGINGFACE_API_KEY."
            exit 1
        else
            print_error ".env.example file not found. Cannot create .env file."
            exit 1
        fi
    fi
}

# Function to wait for service to be healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy\|Up"; then
            print_success "$service is healthy!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $service not ready yet..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to become healthy within timeout"
    return 1
}

# Start all services
start() {
    print_status "Starting Drug Information Platform..."
    check_docker
    check_env
    
    print_status "Building and starting containers..."
    docker-compose up -d --build
    
    print_status "Waiting for services to be ready..."
    wait_for_service postgres
    wait_for_service redis
    wait_for_service backend
    wait_for_service frontend
    
    print_success "All services are running!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:4000"
    print_status "Database: localhost:5432"
    print_status "Redis: localhost:6379"
    
    print_status "Use 'docker-compose logs -f' to view logs"
    print_status "Use './docker-dev.sh logs' for formatted logs"
}

# Stop all services
stop() {
    print_status "Stopping Drug Information Platform..."
    docker-compose down
    print_success "All services stopped!"
}

# Restart all services
restart() {
    print_status "Restarting Drug Information Platform..."
    stop
    start
}

# Show logs
logs() {
    if [ -z "$2" ]; then
        docker-compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100 "$2"
    fi
}

# Show service status
status() {
    print_status "Drug Information Platform Status:"
    docker-compose ps
    
    echo ""
    print_status "Health Check Results:"
    
    # Check frontend health
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    # Check backend health
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
    fi
    
    # Check postgres
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL: Healthy"
    else
        print_error "PostgreSQL: Unhealthy"
    fi
    
    # Check redis
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis: Healthy"
    else
        print_error "Redis: Unhealthy"
    fi
}

# Clean up everything
clean() {
    print_warning "This will remove all containers, volumes, and data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Run database migrations
migrate() {
    print_status "Running database migrations..."
    docker-compose exec backend npm run prisma:migrate:dev
    print_success "Migrations completed!"
}

# Seed the database
seed() {
    print_status "Seeding database with sample FDA drug data..."
    print_status "This will take 2-3 minutes as each drug is processed with AI enhancement..."
    docker-compose exec backend npm run seed
    print_success "Database seeded with 6 demo drug pages!"
    print_status "Visit http://localhost:3000 to see the demo"
}

# Show help
help() {
    echo "Drug Information Platform Docker Development Script"
    echo ""
    echo "Usage: ./docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    Start all services"
    echo "  stop     Stop all services" 
    echo "  restart  Restart all services"
    echo "  status   Show service status and health"
    echo "  logs     Show logs for all services (or specify service name)"
    echo "  clean    Remove all containers, volumes, and data"
    echo "  migrate  Run database migrations"
    echo "  seed     Seed the database"
    echo "  help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-dev.sh start"
    echo "  ./docker-dev.sh logs backend"
    echo "  ./docker-dev.sh status"
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    help|--help|-h)
        help
        ;;
    *)
        if [ -z "$1" ]; then
            help
        else
            print_error "Unknown command: $1"
            help
            exit 1
        fi
        ;;
esac