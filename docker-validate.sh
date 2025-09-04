#!/bin/bash

# Docker Compose Validation Script
# This script validates that 'docker-compose up' works correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[VALIDATION]${NC} $1"
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

# Function to check if a service is healthy
check_service_health() {
    local service=$1
    local max_attempts=60
    local attempt=1
    
    print_status "Checking $service health..."
    
    while [ $attempt -le $max_attempts ]; do
        local status=$(docker-compose ps --format json | jq -r --arg service "$service" '.[] | select(.Service == $service) | .Health // .State')
        
        if [[ "$status" == "healthy" || "$status" == "running" ]]; then
            print_success "$service is healthy!"
            return 0
        elif [[ "$status" == "unhealthy" ]]; then
            print_error "$service is unhealthy!"
            docker-compose logs --tail=20 "$service"
            return 1
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            print_status "Attempt $attempt/$max_attempts - $service status: $status"
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to become healthy within timeout"
    docker-compose logs --tail=50 "$service"
    return 1
}

# Function to test endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local service_name=$3
    local max_attempts=12
    local attempt=1
    
    print_status "Testing $service_name endpoint: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
            print_success "$service_name endpoint is responding correctly"
            return 0
        fi
        
        if [ $((attempt % 4)) -eq 0 ]; then
            print_status "Attempt $attempt/$max_attempts - waiting for $service_name to respond..."
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name endpoint failed to respond correctly"
    return 1
}

# Main validation function
validate_deployment() {
    print_status "Starting Docker Compose validation..."
    
    # Check prerequisites
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        return 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed"
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed - using alternative health checks"
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, using .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            print_error ".env.example not found"
            return 1
        fi
    fi
    
    print_status "Starting services..."
    docker-compose up -d --build
    
    print_status "Waiting for services to initialize..."
    sleep 30
    
    # Check service health
    local services=("postgres" "redis" "backend" "frontend")
    for service in "${services[@]}"; do
        if ! check_service_health "$service"; then
            print_error "Service $service failed health check"
            return 1
        fi
    done
    
    # Test endpoints
    print_status "Testing application endpoints..."
    
    # Test frontend health
    if ! test_endpoint "http://localhost:3000/api/health" 200 "Frontend"; then
        return 1
    fi
    
    # Test backend health
    if ! test_endpoint "http://localhost:4000/health" 200 "Backend"; then
        return 1
    fi
    
    # Test frontend main page
    if ! test_endpoint "http://localhost:3000" 200 "Frontend Main Page"; then
        return 1
    fi
    
    # Test backend API documentation (if available)
    test_endpoint "http://localhost:4000/api" 200 "Backend API" || print_warning "Backend API docs not available"
    
    # Test database connectivity (indirect)
    print_status "Testing database connectivity..."
    if docker-compose exec -T postgres pg_isready -U postgres -d drug_info_db; then
        print_success "Database is accessible"
    else
        print_error "Database connectivity test failed"
        return 1
    fi
    
    # Test Redis connectivity
    print_status "Testing Redis connectivity..."
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is accessible"
    else
        print_error "Redis connectivity test failed"
        return 1
    fi
    
    print_success "All validation tests passed!"
    print_status "Application is ready at:"
    print_status "  Frontend: http://localhost:3000"
    print_status "  Backend:  http://localhost:4000"
    print_status "  Health:   http://localhost:3000/api/health"
    
    return 0
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    docker-compose down
}

# Parse command line arguments
case "$1" in
    --cleanup)
        cleanup
        exit 0
        ;;
    --help|-h)
        echo "Docker Compose Validation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --cleanup    Stop and remove containers"
        echo "  --help, -h   Show this help message"
        echo ""
        echo "This script validates that 'docker-compose up' works correctly"
        echo "by starting all services and testing their health endpoints."
        exit 0
        ;;
esac

# Trap to cleanup on exit
trap cleanup EXIT

# Run validation
if validate_deployment; then
    print_success "Docker Compose validation completed successfully!"
    print_status "Services are running and healthy. Use 'docker-compose down' to stop."
    
    # Don't cleanup on success - let services continue running
    trap - EXIT
    exit 0
else
    print_error "Docker Compose validation failed!"
    print_status "Check the logs above for details."
    print_status "Services will be stopped automatically."
    exit 1
fi