# Systemize

A gamified productivity platform that transforms disorganized middle schoolers into systematically organized students through positive reinforcement, intelligent reminders, and habit formation techniques.

## 📋 Documentation

- [Product Specification](./PRODUCT_SPEC.md)
- [Technical Specification](./TECHNICAL_SPEC.md)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **Docker Desktop**: For local PostgreSQL and Redis
- **Azure CLI**: For Azure deployments
- **Git**: With proper line ending configuration

### Windows Users

**Highly recommended to use WSL2 (Windows Subsystem for Linux):**

```powershell
# In PowerShell (Admin)
wsl --install -d Ubuntu-22.04
```

Clone and develop in WSL2 for best performance:
```bash
# In WSL2
cd ~
mkdir -p projects
cd projects
git clone <your-repo-url>
cd systemize
```

### Initial Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start local services (PostgreSQL + Redis)
docker compose up -d

# Verify services are running
docker compose ps

# Run database migrations (after backend is set up)
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check

# Run tests
pnpm test

# Build for production
pnpm build
```

## 🏗️ Project Structure

```
systemize/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express backend
├── packages/
│   ├── shared/           # Shared types & validators
│   └── config/           # Shared configurations
├── docs/                 # Documentation
├── .github/              # GitHub Actions workflows
└── docker-compose.yml    # Local development services
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js 20, Express, TypeScript, Prisma
- **Database**: PostgreSQL 15 (Azure)
- **Cache**: Redis 7 (Azure)
- **Auth**: Azure AD B2C
- **Hosting**: Azure Static Web Apps + Azure App Service
- **Monitoring**: Azure Application Insights

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm type-check` | Run TypeScript checks |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean all build artifacts |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |

## 🔧 VS Code Setup

Install recommended extensions when prompted, or manually:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension vscodevim.vim
```

## 🐳 Docker Services

Start local development services:

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart
```

Services:
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🌐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Never commit `.env.local` - it's in `.gitignore`.

## 🚢 Deployment

Deployment to Azure is automated via GitHub Actions.

```bash
# Login to Azure
az login

# Deploy frontend (Azure Static Web Apps)
# Automatic on push to main

# Deploy backend (Azure App Service)
# Automatic on push to main
```

## 🤝 Contributing

This is currently a personal project. Contributions guidelines TBD.

## 📄 License

MIT

## 📧 Contact

For questions or feedback, please open an issue.

---

**Built with ❤️ for systematic learning**
