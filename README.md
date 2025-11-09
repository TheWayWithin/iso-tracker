# ISO Tracker

**Evidence-based analysis platform for interstellar objects**

> Track interstellar visitors. Decide if we're alone.

## About

ISO Tracker is the world's first evidence-based analysis platform dedicated exclusively to interstellar objects (ISOs). We help people evaluate "alien vs natural" claims through amateur-accessible frameworks, combining real-time tracking, evidence-based analysis, and community discussion so anyone can meaningfully participate in humanity's search for alien life.

### Core Features

- **Evidence Framework Dashboard**: Compare Community Sentiment vs Scientific Consensus
- **Real-Time ISO Tracking**: 2D sky map with NASA Horizons API integration
- **Educational Content**: 20+ modules across 4 content pillars
- **Community Platform**: In-app discussions and peer validation
- **Progressive Web App**: Installable, offline-capable, <3s load time

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account (for database)
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/jamiewatters/iso-tracker.git
cd iso-tracker

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe keys

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
/iso-tracker
  /apps
    /web              # Next.js PWA (main application)
  /packages
    /database         # Supabase schemas, migrations, types
    /ui               # Shared React components
    /utils            # Shared utilities
  /docs               # Documentation
  /scripts            # Deployment scripts
```

## Development

### Available Commands

```bash
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Lint all packages
pnpm type-check     # TypeScript type checking
pnpm test           # Run tests
pnpm db:migrate     # Run database migrations
pnpm db:seed        # Seed database with test data
```

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments**: Stripe Checkout & Billing
- **Hosting**: Vercel
- **Data**: NASA JPL Horizons API

## Documentation

- [Setup Guide](./docs/setup.md) - Complete local development setup
- [Architecture](./docs/architecture.md) - System design and technical decisions
- [API Documentation](./docs/api-design.md) - API endpoints and specifications
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project

## Deployment

### Environments

- **Development**: Local development with Supabase dev project
- **Staging**: `staging.iso-tracker.app` (auto-deploy from `staging` branch)
- **Production**: `iso-tracker.app` (auto-deploy from `main` branch)

### Deployment Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Develop and commit changes
3. Push and create PR to `staging` branch
4. Staging auto-deploys for testing
5. After QA, merge `staging` → `main` for production deploy

## License

MIT License - see [LICENSE](./LICENSE) file

## Contact

- Website: [iso-tracker.app](https://iso-tracker.app)
- Email: support@iso-tracker.app
- Twitter: [@isotracker](https://twitter.com/isotracker)

---

**See the evidence. Weigh the expert takes. Cast your view—alien or natural?**
