# Database Package

Supabase database schemas, migrations, and TypeScript types for ISO Tracker.

## Structure

```
/database
  /migrations    # SQL migration files
  /seeds         # Test data scripts
  /types         # TypeScript types generated from schema
  schema.sql     # Complete database schema
```

## Usage

```bash
# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```
