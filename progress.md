# Progress Log - ISO Tracker MVP

**Mission**: MVP-ISO-TRACKER-001 - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Last Updated**: 2025-11-23
**Archive**: See `progress-archive-2025-11-21.md` for detailed Sprint 1-9 history

---

## 📊 Current Status

**Active Sprint**: None (Sprint 13 Complete)
**Last Completed**: Sprint 13 ✅ (Nov 23, 2025)
**Production Site**: https://www.isotracker.org
**Last Deployment**: Pending (Sprint 13 - ISO Following & Notifications)

---

## 📋 Sprint Summary

| Sprint | Focus | Status | Date |
|--------|-------|--------|------|
| 1-6 | MVP Foundation | ✅ Complete | Nov 9-17 |
| 7 | Orbital Visualization & NASA API | ✅ Complete | Nov 19 |
| 8 | Observation Planning & Visibility | ✅ Complete | Nov 22 |
| 9 | Landing Page Realignment | ✅ Complete | Nov 22 |
| 10 | The Loeb Scale | ✅ Complete | Nov 22 |
| 11 | Community Arguments & Voting | ✅ Complete | Nov 23 |
| 12 | Evidence Tab & Comments | ✅ Complete | Nov 23 |
| 13 | ISO Following & Notifications | ✅ Complete | Nov 23 |

**Full details**: See `progress-archive-2025-11-21.md`

---

## 🎓 Lessons Learned & Patterns

### Pattern #1: Incomplete Commit Scope
**Frequency**: High | **Impact**: Critical

**Recognition Signs**:
- User says "this was fixed in dev"
- Issues reappear after deployment
- Only partial files committed

**Prevention**:
1. Use `grep -r [pattern] apps/web/` to find ALL instances
2. Check related components (list view AND detail view)
3. Verify all files committed before marking complete

### Pattern #2: File Persistence Bug
**Frequency**: Rare | **Impact**: Critical

**Recognition Signs**:
- Agent reports "files created successfully"
- Post-completion: 0 files exist on filesystem

**Prevention**:
1. Prefer coordinator direct Write tool over Task delegation
2. Verify EVERY file with `ls -lh` immediately after creation
3. Document verification timestamps in progress.md

### Pattern #3: Lost Features (Uncommitted Work)
**Frequency**: Medium | **Impact**: Critical

**Recognition Signs**:
- Feature worked before but missing now
- No git history of feature

**Prevention**:
1. Commit immediately after implementing any feature
2. Never rely on "I'll commit this later"
3. Verify feature exists in git log before claiming completion

---

## 🎯 Next Steps

### Sprint 14 - Stripe Payments (NEXT)
Critical monetization feature:
- Stripe checkout integration
- Webhook handling
- Subscription management

### Sprint 15 - User Profile & Polish (PLANNED)
- User profile pages
- 3i-atlas.live email capture backend
- Final polish and QA

---

## 📋 Sprint 13 Changelog (Nov 23, 2025)

### Deliverables Created
- `apps/web/components/isos/ISODetailHeader.tsx` - Client component with Follow button
- `apps/web/app/api/iso/[id]/follow/route.ts` - Follow/unfollow API endpoints
- `apps/web/app/api/user/following/route.ts` - User following list API

### Files Modified
- `apps/web/app/iso-objects/[id]/page.tsx` - Integrated ISODetailHeader
- `apps/web/components/isos/FollowButton.tsx` - Enhanced with API integration, follow count

### Pre-Existing Infrastructure (Discovered During Sprint)
Much of Sprint 13 infrastructure was already implemented:
- `apps/web/app/settings/notifications/page.tsx` - Full notification preferences UI
- `apps/web/app/api/notifications/preferences/route.ts` - GET/PATCH API
- `apps/web/app/api/notifications/unsubscribe/route.ts` - Unsubscribe flow
- `apps/web/app/api/cron/observation-windows/route.ts` - Observation window cron
- `apps/web/lib/notifications/helpers.ts` - Rate limiting, preferences
- `apps/web/lib/emails/send.ts` - Resend integration
- `apps/web/lib/emails/templates/*.tsx` - Email templates
- Database schema: `iso_follows`, `notification_preferences`, `notification_queue`, `notification_rate_limits`

---

## 📚 References

- **Detailed History**: `progress-archive-2025-11-21.md`
- **Project Plan**: `project-plan.md`
- **Post-Mortem**: `post-mortem-dev-prod-mismatch.md`
- **CLAUDE.md**: File Persistence Bug & Safeguards section

---

**Last Updated**: 2025-11-23
**Next Review**: Sprint 14 kickoff
