#!/bin/bash

# ============================================================================
# Backend Deployment Script
# Deploys Systemize backend to Azure App Service
# ============================================================================

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION
# ============================================================================

# Load resource details from infrastructure script output
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_FILE="${BACKEND_DIR}/azure-resources.txt"

if [ -f "$RESOURCES_FILE" ]; then
    source "$RESOURCES_FILE"
else
    echo "Error: azure-resources.txt not found at $RESOURCES_FILE"
    echo "Run deploy-azure-infra.sh first to create Azure resources"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# COMMAND HANDLING
# ============================================================================

COMMAND=${1:-deploy}

case $COMMAND in
    migrate)
        print_section "Running Database Migrations on Azure"
        
        # Temporarily allow local IP to connect to PostgreSQL
        print_info "Getting your public IP..."
        MY_IP=$(curl -s https://api.ipify.org)
        print_success "Your IP: $MY_IP"
        
        print_info "Adding firewall rule to PostgreSQL..."
        az postgres flexible-server firewall-rule create \
            --resource-group "$RESOURCE_GROUP" \
            --name "$POSTGRES_SERVER" \
            --rule-name "TempDeploymentRule" \
            --start-ip-address "$MY_IP" \
            --end-ip-address "$MY_IP" \
            > /dev/null 2>&1 || print_warning "Firewall rule may already exist"
        
        print_success "Firewall rule added"
        print_warning "Waiting 30 seconds for firewall rule to take effect..."
        sleep 30
        
        # Run migrations
        print_info "Running Prisma migrations..."
        export DATABASE_URL="$DATABASE_URL"
        pnpm prisma migrate deploy
        print_success "Migrations completed"
        
        # Optionally seed the database
        read -p "Do you want to seed the database with test data? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Seeding database..."
            pnpm prisma:seed
            print_success "Database seeded"
        fi
        
        # Remove temporary firewall rule
        print_info "Removing temporary firewall rule..."
        az postgres flexible-server firewall-rule delete \
            --resource-group "$RESOURCE_GROUP" \
            --name "$POSTGRES_SERVER" \
            --rule-name "TempDeploymentRule" \
            --yes \
            > /dev/null 2>&1 || print_warning "Could not remove firewall rule"
        
        print_success "Migration complete!"
        ;;
        
    deploy)
        print_section "Deploying Backend to Azure App Service"
        
        # Pre-flight checks
        print_info "Checking prerequisites..."
        
        if [ ! -d "${BACKEND_DIR}/node_modules" ]; then
            print_error "Dependencies not installed"
            echo "Run: cd apps/backend && pnpm install"
            exit 1
        fi
        
        # Build the project
        print_info "Building TypeScript project..."
        pnpm build
        print_success "Build completed"
        
        # Generate Prisma Client
        print_info "Generating Prisma Client..."
        pnpm prisma:generate
        print_success "Prisma Client generated"
        
        # Create deployment package
        print_info "Creating deployment package..."
        
        # Create a temporary directory for deployment
        DEPLOY_DIR=$(mktemp -d)
        print_info "Temporary directory: $DEPLOY_DIR"
        
        # Copy necessary files
        cp -r dist "$DEPLOY_DIR/"
        cp -r node_modules "$DEPLOY_DIR/"
        cp -r prisma "$DEPLOY_DIR/"
        cp package.json "$DEPLOY_DIR/"
        cp pnpm-lock.yaml "$DEPLOY_DIR/" || true
        
        # Create .deployment file for Azure
        cat > "$DEPLOY_DIR/.deployment" << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = false
EOF
        
        print_success "Deployment package created"
        
        # Deploy to Azure
        print_info "Deploying to Azure App Service..."
        print_warning "This may take 3-5 minutes..."
        
        cd "$DEPLOY_DIR"
        zip -r deployment.zip . > /dev/null
        
        az webapp deployment source config-zip \
            --resource-group "$RESOURCE_GROUP" \
            --name "$APP_SERVICE" \
            --src deployment.zip
        
        cd - > /dev/null
        
        # Cleanup
        rm -rf "$DEPLOY_DIR"
        print_success "Deployment complete!"
        
        # Restart the app service
        print_info "Restarting App Service..."
        az webapp restart \
            --resource-group "$RESOURCE_GROUP" \
            --name "$APP_SERVICE" \
            > /dev/null
        print_success "App Service restarted"
        
        # Wait a bit for the app to start
        print_warning "Waiting 30 seconds for app to start..."
        sleep 30
        
        # Test the deployment
        print_info "Testing deployment..."
        APP_URL="https://${APP_SERVICE}.azurewebsites.net"
        
        if curl -s -f "${APP_URL}/health" > /dev/null; then
            print_success "Health check passed!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎉 Deployment Successful!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "API URL:        $APP_URL"
            echo "Health Check:   ${APP_URL}/health"
            echo "API Base:       ${APP_URL}/api/v1"
            echo ""
            echo "View logs:      az webapp log tail -g $RESOURCE_GROUP -n $APP_SERVICE"
            echo "Stream logs:    az webapp log tail -g $RESOURCE_GROUP -n $APP_SERVICE --provider http"
            echo ""
        else
            print_warning "Health check failed - app may still be starting"
            echo "Check logs: az webapp log tail -g $RESOURCE_GROUP -n $APP_SERVICE"
        fi
        ;;
        
    logs)
        print_section "Streaming App Service Logs"
        az webapp log tail \
            --resource-group "$RESOURCE_GROUP" \
            --name "$APP_SERVICE"
        ;;
        
    test)
        print_section "Testing Deployed API"
        APP_URL="https://${APP_SERVICE}.azurewebsites.net"
        
        echo "Testing health endpoint..."
        curl -s "${APP_URL}/health" | jq || curl -s "${APP_URL}/health"
        echo ""
        
        echo "Testing API v1 root..."
        curl -s "${APP_URL}/api/v1" | jq || curl -s "${APP_URL}/api/v1"
        echo ""
        ;;
        
    rollback)
        print_section "Rolling Back Deployment"
        print_warning "This will restart the app with the previous deployment"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            az webapp deployment list \
                --resource-group "$RESOURCE_GROUP" \
                --name "$APP_SERVICE" \
                --query "[1].id" -o tsv | \
            xargs -I {} az webapp deployment restore \
                --resource-group "$RESOURCE_GROUP" \
                --name "$APP_SERVICE" \
                --ids {}
            print_success "Rollback initiated"
        fi
        ;;
        
    info)
        print_section "Deployment Information"
        echo "Resource Group:     $RESOURCE_GROUP"
        echo "App Service:        $APP_SERVICE"
        echo "URL:                https://${APP_SERVICE}.azurewebsites.net"
        echo ""
        echo "Database:"
        echo "  Server:           $POSTGRES_SERVER"
        echo "  Database:         $DB_NAME"
        echo ""
        echo "Redis:"
        echo "  Cache:            $REDIS_CACHE"
        echo ""
        ;;
        
    *)
        echo "Usage: $0 {migrate|deploy|logs|test|rollback|info}"
        echo ""
        echo "Commands:"
        echo "  migrate   - Run database migrations on Azure PostgreSQL"
        echo "  deploy    - Build and deploy backend to Azure App Service"
        echo "  logs      - Stream application logs"
        echo "  test      - Test deployed API endpoints"
        echo "  rollback  - Rollback to previous deployment"
        echo "  info      - Show deployment information"
        exit 1
        ;;
esac
