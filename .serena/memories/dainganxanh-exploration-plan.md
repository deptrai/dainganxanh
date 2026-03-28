# Đại Ngàn Xanh Codebase Exploration Plan

## Objective
Comprehensive exploration of existing implementations for:
1. **Epic 1 - User Acquisition Flow**: Landing page, hero, success pages, video player, share functionality
2. **Epic 2 - Tree Tracking**: Dashboard, tree components, garden views, harvest system
3. **Database Schema**: Supabase tables, migrations, relationships
4. **Existing Patterns**: UI libraries, components, utilities

## Exploration Phases

### Phase 1: Structure Discovery
- [ ] List project directory structure: `/src/app`, `/src/components`, `/supabase`
- [ ] Identify all Next.js routes and layout files
- [ ] Locate Supabase migration files (already found: 50 files from 20260110-20260326)
- [ ] Find configuration files (tsconfig, next.config, tailwind.config)

### Phase 2: Epic 1 - User Acquisition Flow
- [ ] Marketing layout: `/src/app/(marketing)/layout.tsx`
- [ ] Hero/Landing page: `/src/app/(marketing)/page.tsx`
- [ ] Video player components: Search for video-related components
- [ ] Share functionality: Look for social share, referral share, link copy
- [ ] Success/Confirmation pages: Post-purchase, post-signup pages
- [ ] CTA buttons and conversion tracking

### Phase 3: Epic 2 - Tree Tracking
- [ ] Dashboard structure: `/src/app/crm/dashboard/`, `/src/app/crm/trees/`
- [ ] Tree components: Tree card, tree detail, tree list, tree health
- [ ] Garden/Dashboard views: User's garden, tree collection, harvest views
- [ ] Harvest system: Harvest pages, harvest tracking, harvest rewards
- [ ] Tree status displays and health indicators

### Phase 4: Database Schema Analysis
- [ ] users_table: User registration, profile, metadata
- [ ] orders_table: Purchase/payment tracking
- [ ] trees_table: Tree data, ownership, species
- [ ] lots and tree_photos: Photo storage, lot organization
- [ ] tree_health_logs: Health monitoring over time
- [ ] field_checklists: Task tracking for farmers
- [ ] referral_clicks: Referral system metrics
- [ ] casso_transactions: Payment gateway integration
- [ ] posts_table: Blog/content system

### Phase 5: UI/Component Patterns
- [ ] Check package.json for UI libraries (shadcn/ui, Tailwind, etc.)
- [ ] Identify common component patterns
- [ ] List utility functions and hooks
- [ ] Check styling approach (CSS modules, Tailwind, etc.)
- [ ] Review authentication/authorization patterns

### Phase 6: Summary & Gap Analysis
- [ ] Document what's implemented vs. missing
- [ ] Identify code reuse opportunities
- [ ] Note architectural patterns and decisions
- [ ] List all dependencies and versions

## Status
Starting exploration...
