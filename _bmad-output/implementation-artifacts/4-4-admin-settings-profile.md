# Story 4-4: Admin Settings - Profile Tab (Phase 1)

**Story Key**: 4-4-admin-settings-profile  
**Epic**: 4 - Admin Dashboard Features  
**Priority**: Medium  
**Status**: ready-for-dev  
**Estimated Effort**: 2-3 days

---

## Story

**As an** Admin user  
**I want to** manage my profile and notification preferences in the Settings page  
**So that** I can update my information and control how I receive notifications

---

## Acceptance Criteria

### AC1: View Current Profile
```gherkin
GIVEN I am logged in as an admin
WHEN I navigate to Settings > Profile tab
THEN I should see my current profile information:
  - Full name
  - Email address
  - Role
  - Last login timestamp
```

### AC2: Update Profile Information
```gherkin
GIVEN I am on the Profile tab
WHEN I click "Edit Profile"
AND I update my full name
AND I click "Save Changes"
THEN my profile should be updated
AND I should see a success message
AND the changes should persist after page refresh
```

### AC3: Change Password
```gherkin
GIVEN I am on the Profile tab
WHEN I click "Change Password"
AND I enter my current password
AND I enter a new password (min 8 chars, 1 uppercase, 1 number)
AND I confirm the new password
AND I click "Update Password"
THEN my password should be changed
AND I should receive a confirmation email
AND I should see a success message
```

### AC4: Manage Notification Preferences
```gherkin
GIVEN I am on the Profile tab
WHEN I navigate to "Notification Preferences"
THEN I should see toggles for:
  - Email notifications for new orders
  - Email notifications for withdrawal requests
  - Email notifications for system alerts
  - In-app notification sound
AND I can toggle each preference on/off
AND changes should save automatically
```

---

## Tasks/Subtasks

### Task 1: Database Schema
- [x] Create `admin_preferences` table migration
- [x] Add RLS policies for admin_preferences table
- [ ] Test migration on remote Supabase (requires manual SQL execution)

### Task 2: Profile Settings Component
- [x] Create `ProfileSettings.tsx` component
- [x] Implement profile view with current user data
- [x] Add "Edit Profile" form with full_name field
- [x] Add form validation (required fields)
- [x] Implement save functionality

### Task 3: Password Change Component
- [x] Create `PasswordChangeForm.tsx` component
- [x] Add password strength validation (min 8 chars, 1 uppercase, 1 number)
- [x] Implement password confirmation matching
- [x] Add current password verification
- [x] Integrate with Supabase Auth password update

### Task 4: Notification Preferences Component
- [x] Create `NotificationToggles.tsx` component
- [x] Implement toggles for email notifications (orders, withdrawals, alerts)
- [x] Implement toggle for in-app sound
- [x] Add auto-save functionality on toggle change
- [x] Load preferences from `admin_preferences` table

### Task 5: Server Actions
- [x] Create `getAdminProfile` server action
- [x] Create `updateAdminProfile` server action
- [x] Create `changePassword` server action
- [x] Create `getNotificationPreferences` server action
- [x] Create `updateNotificationPreferences` server action

### Task 6: Integration & Testing
- [x] Replace "Coming Soon" placeholder with real components
- [ ] Test profile update flow end-to-end (requires DB migration)
- [ ] Test password change flow (requires DB migration)
- [ ] Test notification preferences persistence (requires DB migration)
- [ ] Add unit tests for components
- [ ] Add integration tests for server actions

---

## Dev Notes

### Current Implementation
- Settings page exists at `/crm/admin/settings/page.tsx`
- Three tabs: Profile, System, Notifications (all showing "Coming Soon")
- Need to replace Profile tab placeholder with functional components

### Technical Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database)
- **Forms**: React Hook Form + Zod validation
- **State**: React hooks (useState, useEffect)

### Database Schema
```sql
CREATE TABLE admin_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email_notifications JSONB DEFAULT '{"orders": true, "withdrawals": true, "alerts": true}',
  in_app_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Architecture Patterns
- Use Server Actions for data mutations (following existing pattern in `withdrawals.ts`)
- Use `createServerClient` for authenticated requests
- Store preferences in dedicated `admin_preferences` table
- Password changes use Supabase Auth API (`supabase.auth.updateUser`)

### Security Considerations
- Verify admin role before allowing profile updates
- Require current password for password changes
- Use Supabase RLS policies to restrict access to own preferences
- Sanitize all user inputs

---

## Dev Agent Record

### Implementation Plan
1. Created database migration for `admin_preferences` table with RLS policies
2. Implemented 5 server actions in `admin-settings.ts` for profile and preferences management
3. Built 3 React components: ProfileSettings, PasswordChangeForm, NotificationToggles
4. Integrated components into Settings page Profile tab
5. Verified UI rendering correctly on localhost:3001

### Debug Log
- Local Supabase not running, skipped local migration testing
- Remote Supabase connection string issue with `db push` command
- Created migration script but env vars not loading correctly
- UI components render correctly, showing expected "Failed to load" errors without DB connection

### Completion Notes
✅ **Completed:**
- All 3 components implemented with proper loading/error states
- Server actions with admin role verification and RLS policy support
- Password validation with strength indicator
- Auto-save notification preferences
- Clean UI integration replacing "Coming Soon" placeholder

⚠️ **Pending:**
- Migration needs to be applied to remote Supabase manually via SQL Editor
- End-to-end testing requires DB migration completion
- Unit and integration tests not yet written

---

## File List

### Created Files
- `supabase/migrations/20260114_create_admin_preferences.sql` - Database migration
- `src/actions/admin-settings.ts` - Server actions for profile and preferences
- `src/components/admin/settings/ProfileSettings.tsx` - Profile view/edit component
- `src/components/admin/settings/PasswordChangeForm.tsx` - Password change component
- `src/components/admin/settings/NotificationToggles.tsx` - Notification preferences component
- `scripts/apply_admin_preferences_migration.ts` - Migration helper script

### Modified Files
- `src/app/crm/admin/settings/page.tsx` - Integrated new components into Profile tab

---

## Change Log
- 2026-01-14 20:00: Story created for Profile Settings implementation (Phase 1)
- 2026-01-14 20:15: Completed implementation of all components and server actions
- 2026-01-14 20:20: UI verified working, pending DB migration on remote Supabase

---

## Status
in-progress (pending DB migration and E2E testing)
