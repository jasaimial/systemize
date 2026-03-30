# Week 2: Deploy Basic Backend to Azure - Execution Guide

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Completed Week 1 (Local database working)
- ✅ Azure account ([Create free account](https://azure.microsoft.com/free/))
- ✅ Azure CLI installed ([Install guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- ✅ Credit card for Azure (required even for free tier)
- ✅ ~2-3 hours of time

---

## 💰 Cost Awareness

**Estimated Monthly Costs (Development Environment):**
- PostgreSQL Flexible Server (Burstable B1ms): ~$12-30/month
- Redis Cache (Basic C0, 250MB): ~$15/month  
- App Service (Basic B1): ~$13/month
- **Total: ~$40-60/month**

**Free Tier Credits:**
- New Azure accounts get $200 credit for 30 days
- This deployment will consume ~$2/day from your credits

**To minimize costs:**
- Stop resources when not in use (nights/weekends)
- Delete resources after testing if needed
- Use "az group delete" to remove everything at once

---

## 🚀 Execution Steps

### Step 1: Install and Configure Azure CLI (10 min)

#### 1.1 Install Azure CLI

**On Ubuntu/Debian:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**On macOS:**
```bash
brew install azure-cli
```

**Verify installation:**
```bash
az --version
```

Expected output: `azure-cli 2.x.x` or higher

#### 1.2 Login to Azure

```bash
az login
```

This will:
1. Open your browser
2. Prompt you to sign in to your Microsoft account
3. Show your subscriptions in the terminal

**Select the correct subscription:**
```bash
# List all subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

---

### Step 2: Customize Deployment Configuration (5 min)

Edit the infrastructure script before running it:

```bash
cd apps/backend/scripts
nano deploy-azure-infra.sh  # or use your preferred editor
```

**Key variables to review/change (lines 14-26):**

```bash
RESOURCE_GROUP="systemize-dev-rg"          # Keep or rename
LOCATION="centralus"                        # Change to nearest region
# DB_ADMIN_PASSWORD is prompted at runtime (or set via env var)
```

**Recommended Azure regions (by proximity):**
- East US: `eastus` (Virginia)
- West US: `westus2` (Washington)
- Central US: `centralus` (Iowa)
- Europe: `westeurope` (Netherlands)

**Choose location closest to you for lower latency.**

**⚠️ IMPORTANT: Change the database password!**
- Must be 8-128 characters
- Must contain: uppercase, lowercase, numbers
- Avoid special characters that need escaping

---

### Step 3: Make Scripts Executable (30 sec)

```bash
cd apps/backend/scripts
chmod +x deploy-azure-infra.sh
chmod +x deploy-backend.sh
```

---

### Step 4: Run Infrastructure Deployment (20-30 min)

```bash
cd apps/backend/scripts
./deploy-azure-infra.sh
```

**What happens:**

1. **Pre-flight checks** (30 sec)
   - Verifies Azure CLI installed
   - Checks you're logged in
   - Shows subscription info
   - Asks for confirmation

2. **Resource Group creation** (10 sec)
   - Container for all resources
   - Tagged with project and environment

3. **PostgreSQL Flexible Server** (5-10 min)
   - Creates database server
   - Creates database
   - Configures SSL
   - Sets up firewall (allows all IPs for now)

4. **Redis Cache** (10-15 min) ⏱️ **LONGEST STEP**
   - Creates Basic C0 cache
   - Enables SSL-only connections
   - Generates access keys

5. **App Service Plan** (30 sec)
   - Linux-based hosting plan
   - Basic B1 tier (1 core, 1.75GB RAM)

6. **App Service (Web App)** (1 min)
   - Node.js 20 runtime
   - HTTPS-only enabled

7. **Configure App Settings** (30 sec)
   - Environment variables
   - Connection strings
   - JWT secret (auto-generated)

**Expected Output:**
```
========================================
Deployment Complete! 🎉
========================================

Resource Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resource Group:     systemize-dev-rg
Location:           eastus

PostgreSQL Server:  systemize-dev-postgres
  Host:             systemize-dev-postgres.postgres.database.azure.com
  Database:         systemize_production
  Admin User:       systemizeadmin

Redis Cache:        systemize-dev-redis
  Host:             systemize-dev-redis.redis.cache.windows.net
  Port:             6380

App Service:        systemize-dev-api
  URL:              https://systemize-dev-api.azurewebsites.net
  Plan:             systemize-dev-plan (B1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Connection details saved to: azure-resources.txt
```

**⚠️ IMPORTANT:** The script creates `azure-resources.txt` with all connection strings and passwords. **DO NOT commit this file to git!** (Already in .gitignore)

---

### Step 5: Explore Azure Portal (10-15 min) 📚 **LEARNING TIME**

While resources are being created (especially Redis), explore the Azure Portal:

1. **Open Azure Portal:** https://portal.azure.com

2. **Navigate to Resource Group:**
   - Search for "systemize-dev-rg" in top search bar
   - Click on the resource group
   - See all resources listed

3. **Explore PostgreSQL Server:**
   - Click on "systemize-dev-postgres"
   - Check "Databases" blade - see your database
   - Check "Networking" - see firewall rules (allows all for now)
   - Check "Monitoring" - metrics will appear later

4. **Explore Redis Cache:**
   - Click on "systemize-dev-redis"
   - Check "Overview" - see status, hostname
   - Check "Console" - try Redis commands (PING, SET, GET)
   - Check "Access keys" - see primary/secondary keys

5. **Explore App Service:**
   - Click on "systemize-dev-api"
   - Check "Overview" - see URL, status
   - Check "Configuration" - see all environment variables
   - Check "Deployment Center" - will show deployments later
   - Check "Log stream" - will show logs after deployment

**Take screenshots or notes - this is your infrastructure!**

---

### Step 6: Run Database Migrations (5 min)

Now that PostgreSQL is ready, create the schema:

```bash
cd apps/backend/scripts
./deploy-backend.sh migrate
```

**What happens:**
1. Gets your public IP address
2. Adds temporary firewall rule to PostgreSQL
3. Runs `prisma migrate deploy` against Azure database
4. Optionally seeds test data (you'll be prompted)
5. Removes temporary firewall rule

**Expected Output:**
```
========================================
Running Database Migrations on Azure
========================================

ℹ Getting your public IP...
✓ Your IP: 123.45.67.89
ℹ Adding firewall rule to PostgreSQL...
✓ Firewall rule added
⚠ Waiting 30 seconds for firewall rule to take effect...
ℹ Running Prisma migrations...

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "systemize_production"

2 migrations found in prisma/migrations

Applying migration `20251222223906_init`
The following migration(s) have been applied:

migrations/
  └─ 20251222223906_init/
    └─ migration.sql

✓ Migrations completed

Do you want to seed the database with test data? (y/N):
```

**Recommendation:** Say "y" to seed test data - gives you something to work with.

**Verify in Azure Portal:**
1. Go to PostgreSQL Server in portal
2. Click "Connect" then "Query editor"
3. Login with admin credentials
4. Run: `SELECT * FROM "User";`
5. See test user!

---

### Step 7: Deploy Backend Code (10-15 min)

Now deploy your Express backend to Azure:

```bash
cd apps/backend/scripts
./deploy-backend.sh deploy
```

**What happens:**
1. Checks prerequisites (node_modules, etc.)
2. Builds TypeScript (`pnpm build`)
3. Generates Prisma Client
4. Creates deployment package (dist/ + node_modules/)
5. Zips everything
6. Uploads to Azure App Service
7. Restarts the app
8. Tests health endpoint

**Expected Output:**
```
========================================
Deploying Backend to Azure App Service
========================================

ℹ Checking prerequisites...
ℹ Building TypeScript project...
✓ Build completed
ℹ Generating Prisma Client...
✓ Prisma Client generated
ℹ Creating deployment package...
✓ Deployment package created
ℹ Deploying to Azure App Service...
⚠ This may take 3-5 minutes...

Getting scm site credentials for zip deployment
Starting zip deployment...
Deployment endpoint responded with status code 202

✓ Deployment complete!
ℹ Restarting App Service...
✓ App Service restarted
⚠ Waiting 30 seconds for app to start...
ℹ Testing deployment...
✓ Health check passed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Deployment Successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API URL:        https://systemize-dev-api.azurewebsites.net
Health Check:   https://systemize-dev-api.azurewebsites.net/health
API Base:       https://systemize-dev-api.azurewebsites.net/api/v1
```

---

### Step 8: Test the Deployed API (5 min)

**Test health endpoint:**
```bash
curl https://systemize-dev-api.azurewebsites.net/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T...",
  "uptime": 123.45,
  "environment": "production"
}
```

**Test API root:**
```bash
curl https://systemize-dev-api.azurewebsites.net/api/v1
```

**Test auth endpoint (should return 401):**
```bash
curl https://systemize-dev-api.azurewebsites.net/api/v1/auth/me
```

**Or use the helper script:**
```bash
./deploy-backend.sh test
```

**Test in browser:**
Open: https://systemize-dev-api.azurewebsites.net/health

---

### Step 9: View Application Logs (5 min) 📚 **LEARNING TIME**

**Stream logs in real-time:**
```bash
./deploy-backend.sh logs
```

Or directly with Azure CLI:
```bash
az webapp log tail \
  --resource-group systemize-dev-rg \
  --name systemize-dev-api
```

**View logs in Azure Portal:**
1. Go to App Service in portal
2. Click "Log stream" in left menu
3. See real-time logs
4. Try making API requests and watch logs appear

**Enable detailed logging:**
```bash
az webapp log config \
  --resource-group systemize-dev-rg \
  --name systemize-dev-api \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem
```

---

## 🎯 Verification Checklist

- [ ] All Azure resources created (5 resources in portal)
- [ ] Infrastructure script completed successfully
- [ ] `azure-resources.txt` file exists (and is in .gitignore)
- [ ] Database migrations ran successfully
- [ ] Backend deployed to App Service
- [ ] Health endpoint returns 200 OK
- [ ] Can see logs in Azure Portal
- [ ] Can view database in Prisma Studio (connect to Azure DB)

---

## 🔧 Troubleshooting

### Issue: "Deployment endpoint responded with status code 409"
**Cause:** Previous deployment still in progress
**Solution:**
```bash
# Wait 2 minutes and try again
sleep 120
./deploy-backend.sh deploy
```

### Issue: "Health check failed"
**Possible causes:**
1. App still starting (wait 1-2 minutes)
2. Environment variables not set correctly
3. Database connection failed

**Debug steps:**
```bash
# Check app status
az webapp show -g systemize-dev-rg -n systemize-dev-api --query "state"

# View logs
./deploy-backend.sh logs

# Check environment variables
az webapp config appsettings list \
  -g systemize-dev-rg \
  -n systemize-dev-api \
  --query "[].{name:name, value:value}" -o table
```

### Issue: "Migration failed - connection refused"
**Cause:** Firewall rule not applied yet
**Solution:**
```bash
# Wait 60 seconds and try again
sleep 60
./deploy-backend.sh migrate
```

### Issue: "az command not found"
**Solution:**
```bash
# Reinstall Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Reload shell
source ~/.bashrc
```

### Issue: "Redis connection failed"
**Cause:** Redis takes 10-15 minutes to provision
**Solution:** Wait for Redis status to be "Running" in Azure Portal

### Issue: "Build failed - TypeScript errors"
**Solution:**
```bash
# Check errors
pnpm build

# Fix locally first, then redeploy
./deploy-backend.sh deploy
```

---

## 🧹 Cleanup & Cost Management

### Stop resources (save costs overnight/weekends):

**Stop App Service (saves ~$13/month when stopped):**
```bash
az webapp stop -g systemize-dev-rg -n systemize-dev-api
```

**Start it again:**
```bash
az webapp start -g systemize-dev-rg -n systemize-dev-api
```

**Note:** PostgreSQL and Redis still incur charges when stopped.

### Delete everything (when done testing):

```bash
az group delete --name systemize-dev-rg --yes --no-wait
```

**⚠️ WARNING:** This deletes ALL resources including databases! No undo!

### View current costs:

```bash
# View resource group costs
az consumption usage list \
  --start-date 2025-12-01 \
  --end-date 2025-12-31 \
  --query "[?contains(instanceId, 'systemize-dev')]" \
  -o table
```

Or check: https://portal.azure.com → Cost Management + Billing

---

## 📊 What's Now Working

After completing these steps, you have:

✅ **Production-ready infrastructure** in Azure
✅ **PostgreSQL database** with schema and test data
✅ **Redis cache** ready for sessions/rate limiting
✅ **App Service** running your Express backend
✅ **HTTPS endpoint** accessible from anywhere
✅ **Logging** configured and viewable
✅ **Environment variables** securely stored in Azure
✅ **Database migrations** automated via script

---

## 🔜 Next Steps (Week 3-4)

Now that your backend is deployed:

1. **Update frontend** to call Azure API instead of localhost
2. **Implement Azure AD B2C** authentication (replace JWT mock)
3. **Add Azure Key Vault** for secret management
4. **Set up Application Insights** for monitoring
5. **Configure custom domain** (optional)
6. **Set up CI/CD** with GitHub Actions (automate deployments)

---

## 📚 Learning Resources

**Azure Portal Navigation:**
- Dashboard: Overview of all resources
- Resource Groups: Logical containers
- Cost Management: Track spending
- Monitor: Metrics and alerts

**Key Azure Concepts:**
- **Resource Group:** Container for related resources
- **App Service Plan:** Compute resources (CPU, memory)
- **App Service:** Your application instance
- **Connection String:** How apps connect to databases
- **Application Settings:** Environment variables in Azure

**Useful Azure CLI Commands:**
```bash
# List all resources in a group
az resource list -g systemize-dev-rg -o table

# Get App Service URL
az webapp show -g systemize-dev-rg -n systemize-dev-api --query "defaultHostName" -o tsv

# Restart app
az webapp restart -g systemize-dev-rg -n systemize-dev-api

# View deployment history
az webapp deployment list -g systemize-dev-rg -n systemize-dev-api -o table

# Download logs
az webapp log download -g systemize-dev-rg -n systemize-dev-api
```

---

## ⏱️ Time Breakdown

- **Setup & Login:** 10 min
- **Infrastructure Deployment:** 20-30 min (mostly waiting)
- **Portal Exploration:** 10-15 min
- **Database Migration:** 5 min
- **Backend Deployment:** 10-15 min
- **Testing & Verification:** 5-10 min
- **Learning & Exploration:** 60-90 min

**Total: 2-3 hours**

---

## 🎉 Success Criteria

You've successfully completed Week 2 when:

✅ You can access `https://systemize-dev-api.azurewebsites.net/health`
✅ You can view logs in Azure Portal
✅ Database has tables and test data
✅ You understand how to deploy updates
✅ You know how to troubleshoot issues
✅ You're comfortable navigating Azure Portal

---

**Ready? Start with Step 1! 🚀**

If you hit any issues not covered here, check logs first, then ask for help!
