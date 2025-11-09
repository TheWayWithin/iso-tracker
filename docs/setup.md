# ISO Tracker - Local Development Setup Guide

Complete step-by-step guide for setting up ISO Tracker development environment on macOS.

**Estimated Time**: 30 minutes

---

## Prerequisites

Before starting, ensure you have:

- macOS (this guide is Mac-specific)
- Terminal application
- Admin access to install software
- GitHub account
- Supabase account (free tier)
- Stripe account (test mode)

---

## Step 1: Install Package Manager (Homebrew)

If you don't have Homebrew installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Verify installation:
```bash
brew --version
```

---

## Step 2: Install Node.js 18+ via fnm

We use `fnm` (Fast Node Manager) for Node.js version management:

```bash
# Install fnm
brew install fnm

# Add to shell profile (for zsh)
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc

# Install Node.js 18
fnm install 18
fnm use 18

# Verify
node --version  # Should show v18.x.x
```

---

## Step 3: Install pnpm

pnpm is our package manager (faster than npm, more efficient than yarn):

```bash
# Install pnpm
brew install pnpm

# Verify
pnpm --version  # Should show 8.x.x
```

---

## Step 4: Install Git & GitHub CLI

```bash
# Install Git
brew install git

# Install GitHub CLI
brew install gh

# Authenticate with GitHub
gh auth login
# Follow prompts: choose GitHub.com, HTTPS, authenticate via browser
```

---

## Step 5: Install PostgreSQL Client (for Supabase)

```bash
# Install PostgreSQL 15
brew install postgresql@15

# Install Postico (GUI client, optional but recommended)
brew install --cask postico
```

---

## Step 6: Clone Repository

```bash
# Clone the repository
git clone https://github.com/TheWayWithin/iso-tracker.git
cd iso-tracker

# Verify you're on main branch
git branch
```

---

## Step 7: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will install dependencies for:
# - Root workspace
# - apps/web (Next.js)
# - packages/database
# - packages/ui
# - packages/utils
```

**Expected Output**:
```
Packages: +XXX
Packages are hard linked from the content-addressable store to the virtual store.
  Content-addressable store is at: ~/.pnpm-store
  Virtual store is at:             node_modules/.pnpm
```

---

## Step 8: Configure Environment Variables

### 8a. Create Supabase Projects

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project:
   - **Name**: `iso-tracker-dev`
   - **Database Password**: (generate strong password, save it!)
   - **Region**: Choose closest to you
   - Wait 2-3 minutes for provisioning

3. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL**: `https://xxxxx.supabase.co`
   - Copy **anon public key**: `eyJhbGc...`
   - Copy **service_role key** (click "Reveal" button)

### 8b. Create Local Environment File

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your preferred editor
nano .env.local  # or code .env.local, vim .env.local, etc.
```

### 8c. Fill in Environment Variables

Replace placeholders with your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY-HERE

# Stripe Configuration (use test mode keys for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR-KEY-HERE
STRIPE_SECRET_KEY=sk_test_YOUR-KEY-HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR-SECRET-HERE

# NASA Horizons API (no key required, use as-is)
NASA_HORIZONS_API_URL=https://ssd.jpl.nasa.gov/api/horizons.api

# Environment
NODE_ENV=development
```

**Get Stripe Test Keys**:
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle to **Test Mode** (switch in top-left)
3. Go to **Developers** → **API keys**
4. Copy **Publishable key** and **Secret key**

---

## Step 9: Install Supabase CLI (Optional but Recommended)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Verify
supabase --version
```

### Link to Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR-PROJECT-REF
# Get project ref from Supabase dashboard URL: app.supabase.com/project/YOUR-PROJECT-REF
```

---

## Step 10: Start Development Server

```bash
# From repository root
pnpm dev

# This runs: next dev (starts on port 3000)
```

**Expected Output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

### Open in Browser

Go to [http://localhost:3000](http://localhost:3000)

You should see the ISO Tracker landing page (or a default Next.js page if not yet built).

---

## Step 11: Verify Database Connection

### Test Supabase Connection

Create a test file: `apps/web/test-supabase.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  const { data, error } = await supabase.from('_test').select('*').limit(1);
  if (error && error.code === 'PGRST116') {
    console.log('✅ Supabase connection successful (table not found error is expected)');
  } else if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connection successful');
  }
}

testConnection();
```

Run test:
```bash
cd apps/web
node test-supabase.js
```

---

## Step 12: Run Database Migrations (When Available)

Once database schemas are created:

```bash
# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

---

## Common Issues & Troubleshooting

### Issue: `pnpm: command not found`

**Solution**: Reinstall pnpm or check PATH
```bash
brew reinstall pnpm
echo $PATH  # Should include /opt/homebrew/bin
```

### Issue: `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Solution**: Environment variables not loaded
1. Ensure `.env.local` exists in repository root
2. Restart development server: `Ctrl+C`, then `pnpm dev`
3. Check file has correct variable names (no typos)

### Issue: Port 3000 already in use

**Solution**: Kill process or use different port
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
pnpm dev -- --port 3001
```

### Issue: Supabase connection fails

**Solution**: Verify credentials
1. Check Supabase dashboard: Project is running (not paused)
2. Verify URL and keys are correct (no extra spaces)
3. Check firewall isn't blocking Supabase domain

### Issue: `Cannot find module 'next'`

**Solution**: Dependencies not installed
```bash
# Remove node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Start dev server
pnpm dev

# 4. Make changes, test locally

# 5. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin your-branch-name
```

### Creating a New Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/my-feature-name

# Work on feature...

# Push to GitHub
git push origin feature/my-feature-name

# Create PR on GitHub
gh pr create --title "Add my feature" --body "Description"
```

---

## Next Steps

After successful setup:

1. **Read Architecture Documentation**: `docs/architecture.md` (when created)
2. **Review Project Plan**: `project-plan.md` for development roadmap
3. **Check Tasks**: See Phase 1 tasks in project-plan.md
4. **Join Discord**: (Link to be added) for team communication

---

## Verification Checklist

Before considering setup complete, verify:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm 8+ installed (`pnpm --version`)
- [ ] Repository cloned
- [ ] Dependencies installed (`node_modules` exists)
- [ ] `.env.local` created with Supabase keys
- [ ] Development server starts (`pnpm dev`)
- [ ] Can access http://localhost:3000
- [ ] Supabase connection test passes
- [ ] GitHub authentication configured (`gh auth status`)

---

## Getting Help

If you encounter issues not covered here:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Search GitHub issues: https://github.com/TheWayWithin/iso-tracker/issues
3. Ask in Discord: (Link TBD)
4. Create new issue: https://github.com/TheWayWithin/iso-tracker/issues/new

---

**Setup complete! You're ready to build ISO Tracker. 🚀**
