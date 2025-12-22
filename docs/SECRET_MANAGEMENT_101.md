# Secret Management 101: Azure Cloud Best Practices

**Last Updated:** December 22, 2025
**Audience:** Developers new to cloud secret management

---

## Table of Contents

1. [Overview](#overview)
2. [Local Development: Getting JWT Tokens](#local-development-getting-jwt-tokens)
3. [The Golden Rule: Never Commit Secrets](#the-golden-rule-never-commit-secrets)
4. [Understanding .env Files](#understanding-env-files)
5. [Production Secret Management: Two Approaches](#production-secret-management-two-approaches)
6. [The Complete Workflow: Dev to Production](#the-complete-workflow-dev-to-production)
7. [Real-World Examples](#real-world-examples)
8. [Common Mistakes & How to Avoid Them](#common-mistakes--how-to-avoid-them)
9. [Quick Reference](#quick-reference)

---

## Overview

### The Problem

Your application needs secrets (passwords, API keys, tokens) to work, but these secrets must:
- ✅ Never appear in Git
- ✅ Be different for dev/staging/production
- ✅ Be rotatable without code changes
- ✅ Be accessible only to authorized applications

### The Solution

Use environment variables + secure secret storage, with secrets injected at runtime.

---

## Local Development: Getting JWT Tokens

### For Testing Protected Endpoints

Since authentication isn't fully implemented yet, you need test JWT tokens to call protected API endpoints.

### Quick Token Generation

**Option 1: Use the Helper Script (Recommended)**

```bash
cd apps/backend
pnpm gentoken
```

This generates a valid JWT token for 24 hours. Copy and paste it into `api.http`:

```http
@authToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Option 2: Node.js REPL**

```bash
node
```

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com', provider: 'google' },
  'test-secret-key-for-testing-only',
  { expiresIn: '1h' }
);
console.log(token);
```

**Option 3: After Auth Implementation (Future)**

1. Send login request via `api.http`
2. Copy JWT from response
3. Use in subsequent requests

---

## The Golden Rule: Never Commit Secrets

### ⚠️ CRITICAL: Files That Must NEVER Be In Git

❌ `.env`
❌ `.env.local`
❌ `.env.production`
❌ Any file containing real credentials
❌ Configuration files with hardcoded secrets

### ✅ Files That SHOULD Be In Git

✅ `.env.example` - Template with placeholder values
✅ `.gitignore` - Must include `.env*`
✅ Code that READS `process.env.*`
✅ Documentation about what secrets are needed

### Verify Your Setup

```bash
# Check if .env is ignored
cd apps/backend
git status

# If .env appears, fix immediately:
echo ".env" >> .gitignore
git rm --cached .env  # Remove from git (keeps local file)
git add .gitignore
git commit -m "Ensure .env is ignored"
```

---

## Understanding .env Files

### What Are They?

`.env` files store environment-specific configuration as key-value pairs:

```bash
# .env file (NEVER commit this!)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="super-secret-production-key-xyz123"
AZURE_CLIENT_SECRET="real-azure-secret-abc456"
```

### The Two Files You Need

#### 1. `.env.example` (Checked into Git)

```bash
# .env.example
# Template for environment variables
# Copy to .env and fill in real values

# Server
NODE_ENV=development
PORT=3001

# Database (Fill in your connection string)
DATABASE_URL=""

# JWT (Generate a strong secret)
JWT_SECRET=""

# Azure AD B2C (Get from Azure Portal)
AZURE_AD_B2C_CLIENT_SECRET=""
```

**Purpose:**
- Shows what variables are needed
- Documents expected format
- Used as template for new developers

#### 2. `.env` (NOT in Git - Created by Developers)

```bash
# .env (Created from .env.example)
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://myuser:mypass@localhost:5432/systemize"
JWT_SECRET="my-local-dev-secret-123"
AZURE_AD_B2C_CLIENT_SECRET="dev-client-secret-456"
```

**Purpose:**
- Your local configuration
- Contains real secrets for your local environment
- Stays on your machine only

### How Your Code Uses Them

```typescript
// src/config/env.ts
import dotenv from 'dotenv';

// Loads .env file into process.env
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
  // ...
};
```

### Developer Workflow

```
1. Clone repository
   ├─ Git has: .env.example ✅
   └─ Git does NOT have: .env ❌

2. Create your .env
   $ cp .env.example .env

3. Fill in real values
   - Ask team for dev credentials
   - Or use your own local values

4. Run app
   $ pnpm dev
   - App reads from .env
   - Secrets stay local
```

---

## Production Secret Management: Two Approaches

### Approach 1: Azure App Service Configuration (Simpler)

**Best For:** MVP, small teams, quick deployments

#### How It Works

```
┌─────────────────────┐
│ Your Code           │ → Reads: process.env.JWT_SECRET
└─────────────────────┘
         ↑
         │ Azure automatically injects environment variables
         │
┌─────────────────────────────────┐
│ Azure App Service Configuration │
│                                  │
│ Application Settings:            │
│ JWT_SECRET = "prod-secret-xyz"  │
│ DATABASE_URL = "postgres://..." │
└─────────────────────────────────┘
         ↑
         │ You manually configure (one-time setup)
         │
┌─────────────────────┐
│ Azure Portal        │
└─────────────────────┘
```

#### Setup Steps

**1. Deploy Your Code (No Secrets)**
```bash
# Your code is deployed with NO hardcoded secrets
# Just the code that READS process.env
```

**2. Configure Secrets in Azure Portal**
```
1. Go to: portal.azure.com
2. Navigate to: App Services → your-app-name
3. Click: Configuration → Application settings
4. Click: "+ New application setting"
5. Add each secret:
   Name: JWT_SECRET
   Value: actualProductionSecretHere123!
6. Click: Save
7. App automatically restarts with new environment variables
```

**3. Your Code Works Automatically**
```typescript
// Same code works everywhere!
const secret = process.env.JWT_SECRET;

// Locally: Reads from .env file
// Azure: Reads from App Service Configuration
// Your code doesn't know the difference!
```

#### Pros & Cons

✅ **Pros:**
- Simple to set up (5 minutes)
- No code changes needed
- Free (included with App Service)
- Good enough for most projects

❌ **Cons:**
- No secret rotation automation
- Limited audit trail
- All developers with portal access can see secrets
- No centralized secret management

---

### Approach 2: Azure Key Vault + Managed Identity (More Secure)

**Best For:** Production systems, compliance requirements, large teams

#### How It Works

```
┌─────────────┐                            ┌──────────────────┐
│ Your Code   │ ─── "Give me JWT_SECRET" → │ Azure Key Vault  │
└─────────────┘                            │ (Secure Storage) │
       ↑                                    └──────────────────┘
       │                                             ↑
       │ "Who are you?"                             │
       │                                             │
       │ Presents Identity                          │
       │                                             │
┌──────────────────────┐                            │
│ Managed Identity     │ ─── "I'm app XYZ" ────────┘
│ (App's Passport)     │     "Here's my proof"
└──────────────────────┘
       ↑
       │ Azure creates & manages automatically
       │
┌──────────────────────┐
│ Azure App Service    │
│ (Your running app)   │
└──────────────────────┘
```

#### What is Managed Identity?

Think of it as an **automatic passport** for your application:
- Azure creates it automatically for your app
- No passwords or keys to manage
- Only your specific app can use this identity
- Azure handles authentication behind the scenes
- If app is deleted, identity is automatically deleted

**Traditional Auth (OLD WAY):**
```
App → Needs username + password → Key Vault
❌ Problem: Where do you store the password? (Chicken & egg!)
```

**Managed Identity (NEW WAY):**
```
App → Uses Azure-managed identity → Key Vault
✅ No credentials to manage!
✅ Azure handles everything automatically!
```

#### Setup Steps

**1. Create Key Vault**
```bash
# Via Azure CLI
az keyvault create \
  --name systemize-keyvault \
  --resource-group systemize-rg \
  --location eastus
```

**2. Store Secrets in Key Vault**
```bash
# Add secrets
az keyvault secret set \
  --vault-name systemize-keyvault \
  --name JWT-SECRET \
  --value "your-actual-production-secret"

az keyvault secret set \
  --vault-name systemize-keyvault \
  --name DATABASE-PASSWORD \
  --value "your-db-password"
```

**3. Enable Managed Identity on Your App**
```bash
# Azure creates a special identity for your app
az webapp identity assign \
  --name systemize-api \
  --resource-group systemize-rg

# Output includes:
# - principalId: abc-123-def-456 (Your app's identity)
# - tenantId: xyz-789
```

**4. Grant App Permission to Read Secrets**
```bash
# "Key Vault, let this app read secrets"
az keyvault set-policy \
  --name systemize-keyvault \
  --object-id <principalId-from-step-3> \
  --secret-permissions get list
```

**5. Update Your Code to Use Key Vault**

```typescript
// src/config/secrets.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export async function loadSecrets() {
  if (process.env.NODE_ENV === 'production') {
    // Production: Fetch from Key Vault
    const vaultUrl = process.env.KEY_VAULT_URL!; // Non-secret URL
    const credential = new DefaultAzureCredential(); // Uses Managed Identity
    const client = new SecretClient(vaultUrl, credential);

    const [jwtSecret, dbPassword] = await Promise.all([
      client.getSecret('JWT-SECRET'),
      client.getSecret('DATABASE-PASSWORD'),
    ]);

    return {
      jwtSecret: jwtSecret.value,
      dbPassword: dbPassword.value,
    };
  } else {
    // Local: Use .env file
    return {
      jwtSecret: process.env.JWT_SECRET!,
      dbPassword: process.env.DATABASE_PASSWORD!,
    };
  }
}

// src/config/env.ts
import { loadSecrets } from './secrets';

const secrets = await loadSecrets();

export const config = {
  jwtSecret: secrets.jwtSecret,
  databasePassword: secrets.dbPassword,
  // ...
};
```

**6. Configure App Service**
```
Azure Portal → App Service → Configuration
Add only non-secret config:
- KEY_VAULT_URL = https://systemize-keyvault.vault.azure.net
- NODE_ENV = production
```

#### The Magic: How DefaultAzureCredential Works

```typescript
const credential = new DefaultAzureCredential();
```

This single line tries authentication methods in order:

**When Running Locally:**
1. Environment variables (Azure CLI auth)
2. VS Code Azure extension
3. Azure CLI login (`az login`)
4. Falls back to local .env

**When Running in Azure:**
1. Managed Identity (automatic!)
2. No credentials needed
3. Just works!

#### Pros & Cons

✅ **Pros:**
- Maximum security
- Centralized secret management
- Full audit trail (who accessed what, when)
- Secret rotation without app restart
- Secrets never visible in portal
- Compliance-friendly (SOC2, HIPAA, etc.)

❌ **Cons:**
- More complex setup (30-60 minutes)
- Requires Azure SDK in code
- Small cost (~$0.03 per 10,000 operations)
- Overkill for simple projects

---

## The Complete Workflow: Dev to Production

### Phase 1: Local Development

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR MACHINE                                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Clone repo                                               │
│    ├─ Has: .env.example ✅                                 │
│    └─ Missing: .env (expected)                             │
│                                                              │
│ 2. Create .env                                              │
│    $ cp .env.example .env                                   │
│    $ nano .env  # Fill in local dev values                 │
│                                                              │
│ 3. Run application                                          │
│    $ pnpm dev                                               │
│    - dotenv.config() reads .env file                       │
│    - App works with local secrets                          │
│                                                              │
│ 4. Git status                                               │
│    $ git status                                             │
│    - .env NOT shown (gitignored) ✅                        │
│    - Code changes shown ✅                                 │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Push to Repository

```
┌─────────────────────────────────────────────────────────────┐
│ GITHUB REPOSITORY                                            │
├─────────────────────────────────────────────────────────────┤
│ What Gets Committed:                                        │
│ ✅ src/config/env.ts (code that READS process.env)        │
│ ✅ .env.example (template, no real values)                │
│ ✅ .gitignore (includes .env)                             │
│ ✅ All application code                                    │
│                                                              │
│ What Does NOT Get Committed:                                │
│ ❌ .env (blocked by .gitignore)                           │
│ ❌ Any files with real secrets                            │
│                                                              │
│ Result: Repository is safe to be public!                   │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: CI/CD Build

```
┌─────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS / AZURE DEVOPS                               │
├─────────────────────────────────────────────────────────────┤
│ Build Process:                                              │
│ 1. Checkout code from repository                           │
│ 2. Install dependencies                                     │
│ 3. Run tests (uses test secrets from GitHub Secrets)      │
│ 4. Build TypeScript → JavaScript                          │
│ 5. Create deployment artifact                              │
│                                                              │
│ What's Included in Artifact:                                │
│ ✅ Compiled JavaScript (dist/)                            │
│ ✅ package.json                                            │
│ ✅ node_modules (if needed)                               │
│ ❌ NO secrets!                                             │
│ ❌ NO .env file!                                           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Deploy to Azure

```
┌─────────────────────────────────────────────────────────────┐
│ AZURE APP SERVICE                                            │
├─────────────────────────────────────────────────────────────┤
│ Deployment:                                                  │
│ 1. Artifact deployed to App Service                         │
│ 2. Code contains NO secrets                                 │
│ 3. App starts...                                            │
│                                                              │
│ Wait! How does it get secrets?                              │
│ ↓                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: You Configure Production Secrets (One-Time)

```
┌─────────────────────────────────────────────────────────────┐
│ AZURE PORTAL (ONE-TIME MANUAL SETUP)                        │
├─────────────────────────────────────────────────────────────┤
│ You (DevOps Engineer):                                      │
│ 1. Navigate to: App Service → Configuration                │
│ 2. Add Application Settings:                                │
│    - JWT_SECRET = <generate strong secret>                 │
│    - DATABASE_URL = <production database>                  │
│    - AZURE_CLIENT_SECRET = <from Azure AD>                 │
│ 3. Click: Save                                              │
│ 4. App automatically restarts                               │
│                                                              │
│ Azure stores these encrypted and injects them into          │
│ process.env when your app starts!                           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 6: App Runs in Production

```
┌─────────────────────────────────────────────────────────────┐
│ RUNNING APPLICATION IN AZURE                                │
├─────────────────────────────────────────────────────────────┤
│ Startup Sequence:                                           │
│ 1. Azure reads Application Settings                        │
│ 2. Azure sets environment variables:                        │
│    - process.env.JWT_SECRET = "prod-secret-xyz"           │
│    - process.env.DATABASE_URL = "postgres://prod..."      │
│ 3. Azure starts: node dist/index.js                        │
│ 4. Your code runs:                                          │
│    import { config } from './config/env';                  │
│    console.log(config.jwtSecret); // "prod-secret-xyz"    │
│                                                              │
│ Your Code's Perspective:                                    │
│ - Reads process.env.JWT_SECRET                             │
│ - Doesn't know if it came from .env or Azure               │
│ - Works exactly the same as locally!                        │
│ - No code changes needed! ✅                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-World Examples

### Example 1: JWT Secret

**Bad (Hardcoded):**
```typescript
// ❌ NEVER DO THIS
const jwt = require('jsonwebtoken');
const token = jwt.sign(payload, 'my-secret-key-123');
```

**Good (Environment Variable):**
```typescript
// ✅ Correct way
import { config } from './config/env';
const token = jwt.sign(payload, config.jwtSecret);
```

**Local (.env):**
```bash
JWT_SECRET="local-dev-secret-for-testing"
```

**Production (Azure App Service Config):**
```
Name: JWT_SECRET
Value: PrOd_S3cr3t_G3n3r4t3d_By_1P4ssW0rd!
```

### Example 2: Database Connection

**Bad (Hardcoded):**
```typescript
// ❌ NEVER DO THIS
const client = new Client({
  host: 'localhost',
  user: 'myuser',
  password: 'mypassword123',
  database: 'systemize'
});
```

**Good (Environment Variable):**
```typescript
// ✅ Correct way
import { config } from './config/env';
const client = new Client({
  connectionString: config.databaseUrl
});
```

**Local (.env):**
```bash
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/systemize_dev"
```

**Production (Azure App Service Config):**
```
Name: DATABASE_URL
Value: postgresql://produser:c0mpl3xP4ss@systemize-db.postgres.database.azure.com:5432/systemize?ssl=true
```

### Example 3: Multiple Environments

```typescript
// src/config/env.ts
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  // Different values per environment
  jwtSecret: process.env.JWT_SECRET || 'dev-default',

  // Fallback for local dev
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/systemize_dev',

  // Optional features
  azureInsightsKey: process.env.APPINSIGHTS_INSTRUMENTATION_KEY,
};
```

**Behavior:**
- **Local:** Uses fallback values if .env is missing
- **Staging:** Uses staging secrets from App Service
- **Production:** Uses production secrets from App Service

---

## Common Mistakes & How to Avoid Them

### Mistake 1: Committing .env File

```bash
# ❌ Bad
$ git add .
$ git commit -m "Add config"
# .env is now in git history forever!

# ✅ Good - Check first
$ git status
# Make sure .env is NOT listed

# If you accidentally committed .env:
$ git rm --cached .env
$ git commit -m "Remove .env from git"
# Note: It's still in history! Use git-filter-branch if needed
```

### Mistake 2: Putting Production Secrets in .env.example

```bash
# ❌ Bad - .env.example
JWT_SECRET="actual-production-secret-abc123"

# ✅ Good - .env.example
JWT_SECRET="your-secret-here"
# or
JWT_SECRET=""
```

### Mistake 3: Sharing .env Via Slack/Email

```
❌ "Hey team, here's our .env file: [attachment]"
✅ "Hey team, copy .env.example and I'll share secrets securely via 1Password/Azure Key Vault"
```

### Mistake 4: Same Secrets for Dev and Production

```bash
# ❌ Bad - Same everywhere
JWT_SECRET="simple-secret"

# ✅ Good - Different per environment
# Local:       "dev-secret-for-testing-only"
# Staging:     "staging-secret-xyz789"
# Production:  "Pr0d_c0mPl3x_S3cr3t_!@#$"
```

### Mistake 5: Not Rotating Secrets

```
✅ Best Practice:
- Rotate secrets every 90 days
- Rotate immediately if compromised
- Use Key Vault for automatic rotation
```

### Mistake 6: Granting Too Much Access

```bash
# ❌ Bad - All developers can see all secrets
# Everyone has Azure Portal owner role

# ✅ Good - Principle of least privilege
# Developers: Can deploy, can't see production secrets
# DevOps: Can manage secrets
# App: Uses Managed Identity (no human access)
```

---

## Quick Reference

### Local Development Checklist

```bash
# 1. Clone repo
git clone <repo-url>
cd apps/backend

# 2. Create .env from template
cp .env.example .env

# 3. Fill in local dev values
nano .env

# 4. Verify .env is gitignored
git status  # Should NOT show .env

# 5. Run app
pnpm dev

# 6. Generate test JWT token
pnpm token
```

### Azure App Service Setup Checklist

```bash
# 1. Create App Service (if not exists)
az webapp create --name systemize-api --resource-group systemize-rg

# 2. Add secrets via Portal
# Portal → App Service → Configuration → Application settings

# 3. Deploy code (via GitHub Actions or manually)
az webapp deploy ...

# 4. Verify secrets are loaded
az webapp config appsettings list --name systemize-api
```

### Azure Key Vault Setup Checklist

```bash
# 1. Create Key Vault
az keyvault create --name systemize-kv --resource-group systemize-rg

# 2. Add secrets
az keyvault secret set --vault-name systemize-kv --name JWT-SECRET --value "xyz"

# 3. Enable Managed Identity on App
az webapp identity assign --name systemize-api --resource-group systemize-rg

# 4. Grant permissions
az keyvault set-policy --name systemize-kv --object-id <app-principal-id> --secret-permissions get list

# 5. Update code to use Key Vault SDK
# (See Approach 2 section above)
```

### Environment Variables Cheat Sheet

| Variable | Local (.env) | Azure Portal | Key Vault |
|----------|--------------|--------------|-----------|
| `NODE_ENV` | development | production | - |
| `JWT_SECRET` | dev-secret | prod-secret-xyz | JWT-SECRET |
| `DATABASE_URL` | localhost | Azure DB URL | DB-URL |
| `AZURE_CLIENT_SECRET` | dev-client-id | prod-client-id | CLIENT-SECRET |

### Security Best Practices Summary

✅ **DO:**
- Use environment variables for all secrets
- Keep .env out of git (.gitignore)
- Use different secrets per environment
- Rotate secrets regularly
- Use Managed Identity when possible
- Audit secret access
- Use Key Vault for production

❌ **DON'T:**
- Commit .env to git
- Hardcode secrets in code
- Share secrets via email/Slack
- Use the same secrets everywhere
- Give everyone portal access
- Log secrets in application logs
- Store secrets in plaintext files

---

## Additional Resources

### Official Documentation
- [Azure Key Vault Overview](https://learn.microsoft.com/en-us/azure/key-vault/general/overview)
- [Azure Managed Identity](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [App Service Configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-common)
- [dotenv Package](https://www.npmjs.com/package/dotenv)

### Tools
- [1Password](https://1password.com/) - Team secret sharing
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) - Command-line management
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets

### Further Reading
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [The Twelve-Factor App: Config](https://12factor.net/config)

---

**Remember:** When in doubt, ask yourself: "If this repo was public tomorrow, would we be okay?" If the answer is no, you have secrets to secure!

**Last Updated:** December 22, 2025
