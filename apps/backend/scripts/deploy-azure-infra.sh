#!/bin/bash

# ============================================================================
# Azure Infrastructure Deployment Script
# Creates all Azure resources needed for Systemize backend
# ============================================================================

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION - Customize these values
# ============================================================================

# Basic Configuration
RESOURCE_GROUP="systemize-dev-rg"
LOCATION="centralus"  # Options: eastus, westus2, centralus, etc.
PROJECT_NAME="systemize"
ENVIRONMENT="dev"

# Naming Convention: systemize-dev-*
POSTGRES_SERVER="${PROJECT_NAME}-${ENVIRONMENT}-postgres"
REDIS_CACHE="${PROJECT_NAME}-${ENVIRONMENT}-redis"
APP_SERVICE_PLAN="${PROJECT_NAME}-${ENVIRONMENT}-plan"
APP_SERVICE="${PROJECT_NAME}-${ENVIRONMENT}-api"

# Database Configuration
DB_ADMIN_USER="systemizeadmin"
DB_NAME="systemize_production"
DB_SKU="Standard_B1ms"  # Burstable, cost-effective for dev/test

# Redis Configuration
REDIS_SKU="Basic"
REDIS_VM_SIZE="C0"  # 250MB cache

# App Service Configuration
APP_SERVICE_SKU="B1"  # Basic tier - good for dev/test

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
# PRE-FLIGHT CHECKS
# ============================================================================

print_section "Pre-flight Checks"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi
print_success "Azure CLI installed"

# Check if logged in
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure"
    echo "Run: az login"
    exit 1
fi

ACCOUNT_NAME=$(az account show --query "name" -o tsv)
print_success "Logged in as: $ACCOUNT_NAME"

# Show subscription
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)
print_info "Using subscription: $SUBSCRIPTION_ID"

# Confirm before proceeding
echo ""
print_warning "This script will create the following resources:"
echo "  • Resource Group: $RESOURCE_GROUP ($LOCATION)"
echo "  • PostgreSQL Server: $POSTGRES_SERVER"
echo "  • Redis Cache: $REDIS_CACHE"
echo "  • App Service Plan: $APP_SERVICE_PLAN ($APP_SERVICE_SKU)"
echo "  • App Service: $APP_SERVICE"
echo ""
print_warning "Estimated monthly cost: ~\$40-60 USD"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Prompt for database password if not set via environment variable
if [ -z "$DB_ADMIN_PASSWORD" ]; then
    echo ""
    print_info "Database admin password not set."
    print_info "Requirements: 8-128 chars, must include uppercase, lowercase, and numbers."
    echo ""
    while true; do
        read -s -p "Enter database admin password: " DB_ADMIN_PASSWORD
        echo
        read -s -p "Confirm password: " DB_ADMIN_PASSWORD_CONFIRM
        echo
        if [ "$DB_ADMIN_PASSWORD" = "$DB_ADMIN_PASSWORD_CONFIRM" ]; then
            if [ ${#DB_ADMIN_PASSWORD} -ge 8 ]; then
                break
            else
                print_error "Password must be at least 8 characters"
            fi
        else
            print_error "Passwords do not match. Try again."
        fi
    done
    print_success "Password set"
else
    print_info "Using DB_ADMIN_PASSWORD from environment variable"
fi

# ============================================================================
# STEP 1: CREATE RESOURCE GROUP
# ============================================================================

print_section "Step 1: Creating Resource Group"

if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    print_warning "Resource group already exists: $RESOURCE_GROUP"
else
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags project="systemize" environment="$ENVIRONMENT"
    print_success "Resource group created: $RESOURCE_GROUP"
fi

# ============================================================================
# STEP 2: CREATE POSTGRESQL FLEXIBLE SERVER
# ============================================================================

print_section "Step 2: Creating PostgreSQL Flexible Server"
print_info "This may take 5-10 minutes..."

if az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" &> /dev/null; then
    print_warning "PostgreSQL server already exists: $POSTGRES_SERVER"
else
    az postgres flexible-server create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$POSTGRES_SERVER" \
        --location "$LOCATION" \
        --admin-user "$DB_ADMIN_USER" \
        --admin-password "$DB_ADMIN_PASSWORD" \
        --sku-name "$DB_SKU" \
        --tier Burstable \
        --storage-size 32 \
        --version 15 \
        --public-access None \
        --tags project="systemize" environment="$ENVIRONMENT"

    print_success "PostgreSQL server created: $POSTGRES_SERVER"
fi

# Add firewall rule to allow current IP
print_info "Adding firewall rule for your IP..."
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --rule-name "AllowDeployerIP" \
    --start-ip-address "$MY_IP" \
    --end-ip-address "$MY_IP" \
    > /dev/null 2>&1 || print_warning "Firewall rule may already exist"

# Allow Azure services to access
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --rule-name "AllowAzureServices" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0" \
    > /dev/null 2>&1 || print_warning "Azure services rule may already exist"
print_success "Firewall rules configured (your IP + Azure services only)"

# Create database
print_info "Creating database: $DB_NAME"
if az postgres flexible-server db show --resource-group "$RESOURCE_GROUP" --server-name "$POSTGRES_SERVER" --database-name "$DB_NAME" &> /dev/null; then
    print_warning "Database already exists: $DB_NAME"
else
    az postgres flexible-server db create \
        --resource-group "$RESOURCE_GROUP" \
        --server-name "$POSTGRES_SERVER" \
        --database-name "$DB_NAME"
    print_success "Database created: $DB_NAME"
fi

# Get PostgreSQL connection string
POSTGRES_HOST="${POSTGRES_SERVER}.postgres.database.azure.com"
DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${POSTGRES_HOST}:5432/${DB_NAME}?sslmode=require"
print_success "PostgreSQL connection string ready"

# ============================================================================
# STEP 3: CREATE REDIS CACHE
# ============================================================================

print_section "Step 3: Creating Redis Cache"
print_info "This may take 10-15 minutes..."

if az redis show --resource-group "$RESOURCE_GROUP" --name "$REDIS_CACHE" &> /dev/null; then
    print_warning "Redis cache already exists: $REDIS_CACHE"
else
    az redis create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$REDIS_CACHE" \
        --location "$LOCATION" \
        --sku "$REDIS_SKU" \
        --vm-size "$REDIS_VM_SIZE" \
        --enable-non-ssl-port false \
        --tags project="systemize" environment="$ENVIRONMENT"

    print_success "Redis cache created: $REDIS_CACHE"
fi

# Get Redis connection details
print_info "Fetching Redis connection details..."
REDIS_HOST=$(az redis show --resource-group "$RESOURCE_GROUP" --name "$REDIS_CACHE" --query "hostName" -o tsv)
REDIS_PORT=$(az redis show --resource-group "$RESOURCE_GROUP" --name "$REDIS_CACHE" --query "sslPort" -o tsv)
REDIS_KEY=$(az redis list-keys --resource-group "$RESOURCE_GROUP" --name "$REDIS_CACHE" --query "primaryKey" -o tsv)
REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_HOST}:${REDIS_PORT}"
print_success "Redis connection string ready"

# ============================================================================
# STEP 4: CREATE APP SERVICE PLAN
# ============================================================================

print_section "Step 4: Creating App Service Plan"

if az appservice plan show --resource-group "$RESOURCE_GROUP" --name "$APP_SERVICE_PLAN" &> /dev/null; then
    print_warning "App Service Plan already exists: $APP_SERVICE_PLAN"
else
    az appservice plan create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$APP_SERVICE_PLAN" \
        --location "$LOCATION" \
        --sku "$APP_SERVICE_SKU" \
        --is-linux \
        --tags project="systemize" environment="$ENVIRONMENT"

    print_success "App Service Plan created: $APP_SERVICE_PLAN"
fi

# ============================================================================
# STEP 5: CREATE APP SERVICE (WEB APP)
# ============================================================================

print_section "Step 5: Creating App Service"

if az webapp show --resource-group "$RESOURCE_GROUP" --name "$APP_SERVICE" &> /dev/null; then
    print_warning "App Service already exists: $APP_SERVICE"
else
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_SERVICE_PLAN" \
        --name "$APP_SERVICE" \
        --runtime "NODE:20-lts" \
        --tags project="systemize" environment="$ENVIRONMENT"

    print_success "App Service created: $APP_SERVICE"
fi

# ============================================================================
# STEP 6: CONFIGURE APP SERVICE SETTINGS
# ============================================================================

print_section "Step 6: Configuring App Service Settings"

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set application settings
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE" \
    --settings \
        NODE_ENV="production" \
        PORT="8080" \
        API_VERSION="v1" \
        DATABASE_URL="$DATABASE_URL" \
        REDIS_URL="$REDIS_URL" \
        JWT_SECRET="$JWT_SECRET" \
        JWT_EXPIRES_IN="15m" \
        JWT_REFRESH_EXPIRES_IN="7d" \
        FRONTEND_URL="https://systemize-frontend-placeholder.azurestaticapps.net" \
        RATE_LIMIT_WINDOW_MS="900000" \
        RATE_LIMIT_MAX_REQUESTS="100" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
        WEBSITE_NODE_DEFAULT_VERSION="~20" \
    > /dev/null

print_success "App Service settings configured"

# Configure startup command
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE" \
    --startup-file "node dist/index.js" \
    > /dev/null

print_success "Startup command configured"

# Enable HTTPS only
az webapp update \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE" \
    --https-only true \
    > /dev/null

print_success "HTTPS-only enabled"

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

print_section "Deployment Complete! 🎉"

echo ""
echo "Resource Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resource Group:     $RESOURCE_GROUP"
echo "Location:           $LOCATION"
echo ""
echo "PostgreSQL Server:  $POSTGRES_SERVER"
echo "  Host:             $POSTGRES_HOST"
echo "  Database:         $DB_NAME"
echo "  Admin User:       $DB_ADMIN_USER"
echo ""
echo "Redis Cache:        $REDIS_CACHE"
echo "  Host:             $REDIS_HOST"
echo "  Port:             $REDIS_PORT"
echo ""
echo "App Service:        $APP_SERVICE"
echo "  URL:              https://${APP_SERVICE}.azurewebsites.net"
echo "  Plan:             $APP_SERVICE_PLAN ($APP_SERVICE_SKU)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Next Steps:"
echo "1. Run database migrations: ./scripts/deploy-backend.sh migrate"
echo "2. Deploy backend code: ./scripts/deploy-backend.sh deploy"
echo "3. Test the API: curl https://${APP_SERVICE}.azurewebsites.net/health"
echo ""

# Save connection details to file (in backend root, where .gitignore covers it)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${BACKEND_DIR}/azure-resources.txt"
cat > "$OUTPUT_FILE" << EOF
# Azure Resources - Created $(date)
# ============================================================================

RESOURCE_GROUP=$RESOURCE_GROUP
LOCATION=$LOCATION

# PostgreSQL
POSTGRES_SERVER=$POSTGRES_SERVER
POSTGRES_HOST=$POSTGRES_HOST
DB_ADMIN_USER=$DB_ADMIN_USER
DB_ADMIN_PASSWORD=$DB_ADMIN_PASSWORD
DB_NAME=$DB_NAME
DATABASE_URL=$DATABASE_URL

# Redis
REDIS_CACHE=$REDIS_CACHE
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_URL=$REDIS_URL

# App Service
APP_SERVICE_PLAN=$APP_SERVICE_PLAN
APP_SERVICE=$APP_SERVICE
APP_SERVICE_URL=https://${APP_SERVICE}.azurewebsites.net

# JWT
JWT_SECRET=$JWT_SECRET
EOF

print_success "Connection details saved to: $OUTPUT_FILE"
print_warning "Keep this file secure! It contains sensitive credentials."
echo ""
