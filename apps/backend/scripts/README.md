# Azure Deployment - Quick Reference

## 🚀 Quick Commands

### Initial Setup
```bash
# 1. Install Azure CLI (if needed)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login
az login

# 3. Set subscription
az account set --subscription "Your Subscription Name"
```

### Deployment
```bash
cd apps/backend/scripts

# Make scripts executable (first time only)
chmod +x *.sh

# Deploy infrastructure (20-30 min)
./deploy-azure-infra.sh

# Run database migrations
./deploy-backend.sh migrate

# Deploy backend code
./deploy-backend.sh deploy
```

### Common Operations
```bash
# View logs
./deploy-backend.sh logs

# Test API
./deploy-backend.sh test

# Show deployment info
./deploy-backend.sh info

# Rollback deployment
./deploy-backend.sh rollback
```

### Resource Management
```bash
# Stop App Service (save costs)
az webapp stop -g systemize-dev-rg -n systemize-dev-api

# Start App Service
az webapp start -g systemize-dev-rg -n systemize-dev-api

# Restart App Service
az webapp restart -g systemize-dev-rg -n systemize-dev-api

# Delete everything
az group delete --name systemize-dev-rg --yes
```

### Debugging
```bash
# Check app status
az webapp show -g systemize-dev-rg -n systemize-dev-api --query "state"

# Stream logs
az webapp log tail -g systemize-dev-rg -n systemize-dev-api

# List environment variables
az webapp config appsettings list -g systemize-dev-rg -n systemize-dev-api -o table

# Check database connection
psql "$(cat azure-resources.txt | grep DATABASE_URL | cut -d= -f2)"
```

## 📍 Important URLs

After deployment, your resources will be at:

- **App Service:** https://systemize-dev-api.azurewebsites.net
- **Health Check:** https://systemize-dev-api.azurewebsites.net/health
- **API Base:** https://systemize-dev-api.azurewebsites.net/api/v1
- **Azure Portal:** https://portal.azure.com

## 💰 Cost Tracking

View costs:
```bash
az consumption usage list --query "[?contains(instanceId, 'systemize-dev')]" -o table
```

Or visit: https://portal.azure.com → Cost Management + Billing

## 🔐 Security Notes

**Files to NEVER commit:**
- `.env` (local credentials)
- `azure-resources.txt` (Azure credentials)
- Any file with passwords or connection strings

These are already in `.gitignore`.

## ⚠️ Before You Start

1. ✅ Azure account created
2. ✅ Credit card added (even for free tier)
3. ✅ Week 1 completed (local database working)
4. ✅ ~2-3 hours available
5. ✅ Budget awareness (~$2/day)

## 📖 Full Documentation

See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for complete step-by-step guide with:
- Detailed explanations
- Troubleshooting
- Learning resources
- Azure Portal navigation
- Cost management tips
