# Agent Context Document

## Mission Overview
**Mission Code**: SPRINT-7-ORBITAL-VIZ
**Started**: 2025-11-17
**Current Phase**: Sprint 7 - Orbital Visualization & NASA API Integration
**Overall Status**: IN_PROGRESS (Sprint 6 Complete & MVP Live, Sprint 7 Starting)

## Mission Objectives
Primary objectives for Sprint 7:
- [ ] Phase 7.1: NASA Horizons API Integration (2 hours)
- [ ] Phase 7.2: Ephemeris Data Table Component (1 hour)
- [ ] Phase 7.3: 2D Orbital Visualization (2-3 hours)
- [ ] Phase 7.4: Data Pipeline & Performance Optimization (0.5 hours)
- [ ] Phase 7.5: UI/UX Polish (0.5 hours)
- [ ] Phase 7.6: Testing & QA (1 hour)
- [ ] Deploy to production at https://www.isotracker.org
- [ ] Verify users can visualize orbital trajectories of interstellar objects

## Critical Constraints
Important limitations and requirements to maintain:
- **MUST NOT deviate from foundation documents or PRD**
- Solo founder with AI-assisted development
- Bootstrap budget: $500/month infrastructure
- PWA-first architecture (no native mobile apps in MVP)
- Launch target: 3I/ATLAS observation window (Q4 2025)
- Security-first development (never compromise security for convenience)
- Root cause analysis mandatory before implementing fixes
- Follow Critical Software Development Principles from CLAUDE.md

## Accumulated Findings

### Phase 0: Strategic Planning
**Agent**: coordinator
**Status**: In Progress
**Key Decisions**:
- Mission type: MVP Development - comprehensive implementation planning
- Primary input: Product Requirements Document at foundation/prds/Product-Requirements-Document.md
- Supporting context: Complete foundation folder
- Deliverable: project-plan.md with complete implementation roadmap

**Critical Information**:
- Product: ISO Tracker - Evidence-based analysis platform for interstellar objects
- Target: Spectator → Debater lifecycle (10% conversion target)
- Pricing: Event Pass ($4.99/mo) + Evidence Analyst ($19/mo or $199/yr)
- Tech Stack: PWA (React/Next.js), Firebase/Supabase backend, NASA JPL Horizons API
- Launch Strategy: 3I/ATLAS event-driven acquisition

**Outputs Created**:
- agent-context.md (this file)
- handoff-notes.md (for agent communication)
- progress.md (changelog and learning repository)
- project-plan.md (12-month implementation roadmap)
- PHASE-0-STATUS.md (Phase 0 tracking and instructions)
- GitHub repository (https://github.com/TheWayWithin/iso-tracker)
- architecture.md (35,000+ word technical architecture document)
- evidence-repository.md (artifacts and decision tracking)

## Technical Context

### Architecture Decisions (FINALIZED)
**Core Technology Stack**:
- **Frontend**: Next.js 14 (App Router with React Server Components)
- **Backend**: **Supabase** (PostgreSQL + Auth + Realtime + Edge Functions) ✅ CHOSEN
- **Payments**: **Stripe** (Checkout + Billing + Webhooks) ✅ CHOSEN
- **Hosting**: **Vercel** (Edge deployment, preview environments) ✅ CHOSEN
- **Data Source**: NASA JPL Horizons API (astronomical context)
- **Community**: Discord API (tier-based access, Phase 1-2)
- **AR**: A-Frame + AR.js (web-based AR, Phase 4)

### Architecture Principles
**Security-First** (Non-Negotiable):
- Row-Level Security (RLS) on ALL database tables
- Content Security Policy with nonces (no unsafe-inline)
- Stripe webhook signature verification
- Defense in depth: Database → API → Client

**Performance-First**:
- React Server Components (~40% JS reduction)
- Incremental Static Regeneration (ISR)
- Materialized views for expensive queries (3000ms → <100ms)
- Multi-layer caching (Browser, CDN, Database, Client)

**Evidence-First**:
- Evidence Assessment Framework is PRIMARY feature (not just tracking)
- 3-tier rubric system (Chain of Custody, Witness Credibility, Technical Analysis)
- Community vs Scientific Consensus tracking
- Materialized view for consensus calculation

### Database Architecture
**Core Tables** (7 total):
- `users` - Extended Supabase auth.users
- `subscriptions` - Tier, status, Stripe integration
- `isos` - UAP sighting events
- `evidence` - Evidence linked to ISOs
- `evidence_assessments` - Heart of platform (3-tier rubric, JSONB scores)
- `consensus_snapshot` - Materialized view for performance
- `news_articles` - Community-contributed content

**Critical Features**:
- RLS policies enforce subscription tier access
- JSONB for flexible assessment criteria (evolves over time)
- Materialized view refreshes on assessment insert (CONCURRENTLY)
- Geographic indexes for location-based queries
- Immutable assessments (soft-delete only for audit trail)

### Implementation Patterns
- Evidence-first framework: Amateur-accessible methodology
- Lifecycle integration: Event hooks (acquisition) + ongoing retention
- Community-driven content: Network effects through user contributions
- Educational modules: Retention strategy between ISO events

## Known Issues & Blockers

### Active Issues
None currently - mission just initiated

### Resolved Issues
None yet

## Dependencies & Integrations

### External Dependencies
- NASA JPL Horizons API: Ephemeris data for ISO tracking
- Stripe/Gumroad: Payment processing
- Discord: Community platform integration
- Firebase/Supabase: Backend infrastructure

### Internal Dependencies
- Strategic planning must complete before architecture design
- Architecture design must complete before development environment setup
- GitHub repository must exist before code development begins

## Next Steps Queue
Priority-ordered tasks for Sprint 7:
1. 🔵 **CURRENT**: Phase 7.1 - NASA Horizons API Integration
2. **Next**: Phase 7.2 - Ephemeris Data Table Component
3. **Next**: Phase 7.3 - 2D Orbital Visualization (Canvas API)
4. **Next**: Phase 7.4 - Data Pipeline & Performance
5. **Next**: Phase 7.5 - UI/UX Polish
6. **Next**: Phase 7.6 - Testing & QA
7. **Final**: Deploy to production

## Risk Register
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Spectator → Debater conversion <10% | Medium | High | Evidence framework tutorial, aggressive onboarding optimization |
| Solo founder burnout | Medium | High | Sustainable 2-3hr daily workflow, AI automation, community leverage |
| Limited ISO detections | Low | Medium | Educational content, historical deep dives, diversified revenue |
| Data accuracy issues | Low | High | NASA API (authoritative), academic advisor review, peer validation |
| Competitor fast-follow | High | Medium | Category ownership, rapid feature dev, community lock-in |

## Performance Metrics
- Mission start: 2025-11-09
- Target completion: project-plan.md within 24 hours
- Phase 0 estimated time: 2-4 hours

## Handoff History
Record of all agent handoffs in this mission:

### 2025-11-09 11:45 - Architecture Complete (architect → developer)
**Agent**: architect (via coordinator Task delegation)
**Deliverables**:
- architecture.md (35,000+ words)
- Updated handoff-notes.md with developer onboarding
- Updated evidence-repository.md with architectural decisions

**Key Findings**:
- Security-first architecture with RLS on all tables
- Evidence Assessment Framework as PRIMARY feature
- Materialized view for consensus (performance optimization)
- Complete database schema with ERD and RLS policy examples
- API specifications with security and validation patterns
- 6 ADRs documenting key architectural decisions

**Handoff Notes**:
- Developer ready to start Phase 1 implementation
- All technical decisions documented with rationale
- Critical warnings and gotchas documented in handoff-notes.md
- 10-week Phase 1 timeline with clear priorities

### 2025-11-09 11:00 - GitHub Repository Setup (operator)
**Agent**: operator (automated via coordinator)
**Deliverables**:
- GitHub repository: https://github.com/TheWayWithin/iso-tracker
- Monorepo structure with /apps/web and /packages
- CI/CD workflow (.github/workflows/ci.yml)
- Complete documentation (README, setup guide, status report)

**Key Findings**:
- Monorepo enables code sharing between packages
- pnpm workspaces for package management
- GitHub Actions CI validates PRs (lint, type-check, build)
- Setup guide reduces onboarding time to 30 minutes

### 2025-11-09 10:30 - Project Plan Creation (coordinator)
**Agent**: coordinator (direct implementation after strategist failure)
**Deliverables**: project-plan.md with 12-month implementation roadmap

**Key Findings**:
- 4 phases: Phase 0 (Environment), Phase 1 (Core MVP), Phase 2 (Education), Phase 3 (Community), Phase 4 (Advanced)
- Technology stack decisions: Supabase, Stripe, Vercel
- Phase 0 includes 6 tasks (1 complete, 5 manual setup required)
- Clear task ownership and success criteria

### 2025-11-09 10:00 - Mission initiated by coordinator
**Agent**: coordinator
**Actions**:
- Context preservation initialized
- Foundation documents loaded
- Ready for strategic planning delegation

---
*This document is continuously updated throughout the mission. Each agent must read this before starting their task and update it with their findings before completing their work.*
