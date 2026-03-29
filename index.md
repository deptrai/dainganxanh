# Source Code Index — Đại Ngàn Xanh

## Root Files

- **[database_schema.sql](./database_schema.sql)** - Full database schema snapshot
- **[DEPLOYMENT_FIX.md](./DEPLOYMENT_FIX.md)** - Deployment troubleshooting notes
- **[RENDER_DEPLOYMENT_FIX.md](./RENDER_DEPLOYMENT_FIX.md)** - Render.com deployment fix guide

---

## docs/

- **[docs/prd.md](./docs/prd.md)** - Product requirements document
- **[docs/sql-organization.md](./docs/sql-organization.md)** - Database SQL organization guide
- **[docs/userflow.md](./docs/userflow.md)** - User journey and flow diagrams

## email-templates/

- **[email-templates/harvest-ready.html](./email-templates/harvest-ready.html)** - Harvest-ready notification email template

---

## dainganxanh-landing/ (Next.js App)

### Config & Root

- **[dainganxanh-landing/Dockerfile](./dainganxanh-landing/Dockerfile)** - Container build config for deployment
- **[dainganxanh-landing/next.config.js](./dainganxanh-landing/next.config.js)** - Next.js configuration
- **[dainganxanh-landing/tailwind.config.js](./dainganxanh-landing/tailwind.config.js)** - Tailwind CSS theme config
- **[dainganxanh-landing/tsconfig.json](./dainganxanh-landing/tsconfig.json)** - TypeScript compiler options
- **[dainganxanh-landing/postcss.config.js](./dainganxanh-landing/postcss.config.js)** - PostCSS configuration
- **[dainganxanh-landing/jest.config.ts](./dainganxanh-landing/jest.config.ts)** - Jest unit test configuration
- **[dainganxanh-landing/jest.setup.ts](./dainganxanh-landing/jest.setup.ts)** - Jest global test setup
- **[dainganxanh-landing/playwright.config.ts](./dainganxanh-landing/playwright.config.ts)** - Playwright E2E test config
- **[dainganxanh-landing/package.json](./dainganxanh-landing/package.json)** - Project dependencies and scripts

### Debug / Utility Scripts (Root Level)

- **[dainganxanh-landing/check_balance.ts](./dainganxanh-landing/check_balance.ts)** - Check user account balance
- **[dainganxanh-landing/check_email_logs.ts](./dainganxanh-landing/check_email_logs.ts)** - Inspect email sending logs
- **[dainganxanh-landing/check_specific_log.ts](./dainganxanh-landing/check_specific_log.ts)** - Query a specific log entry
- **[dainganxanh-landing/debug_email_logs_insert.ts](./dainganxanh-landing/debug_email_logs_insert.ts)** - Debug email log insertion
- **[dainganxanh-landing/generate_admin_link.ts](./dainganxanh-landing/generate_admin_link.ts)** - Generate admin access links
- **[dainganxanh-landing/generate_existing_link.ts](./dainganxanh-landing/generate_existing_link.ts)** - Generate links for existing users
- **[dainganxanh-landing/generate_links.ts](./dainganxanh-landing/generate_links.ts)** - Bulk referral link generation
- **[dainganxanh-landing/generate_links_retry.ts](./dainganxanh-landing/generate_links_retry.ts)** - Retry-safe link generation
- **[dainganxanh-landing/get_all_users.ts](./dainganxanh-landing/get_all_users.ts)** - Fetch all users from database
- **[dainganxanh-landing/get_otp.ts](./dainganxanh-landing/get_otp.ts)** - Retrieve OTP for testing
- **[dainganxanh-landing/get_test_accounts.ts](./dainganxanh-landing/get_test_accounts.ts)** - List test account credentials
- **[dainganxanh-landing/list_all_logs.ts](./dainganxanh-landing/list_all_logs.ts)** - List all system logs
- **[dainganxanh-landing/seed_withdrawal.ts](./dainganxanh-landing/seed_withdrawal.ts)** - Seed withdrawal test data
- **[dainganxanh-landing/simulate_approval.ts](./dainganxanh-landing/simulate_approval.ts)** - Simulate order approval flow
- **[dainganxanh-landing/simulate_approval_fixed.ts](./dainganxanh-landing/simulate_approval_fixed.ts)** - Fixed version of approval simulation
- **[dainganxanh-landing/test-notification-browser.js](./dainganxanh-landing/test-notification-browser.js)** - Browser notification test script
- **[dainganxanh-landing/test_supabase_auth.ts](./dainganxanh-landing/test_supabase_auth.ts)** - Supabase auth integration test

### src/app/ — Pages (App Router)

- **[src/app/layout.tsx](./dainganxanh-landing/src/app/layout.tsx)** - Root layout with fonts and providers
- **[src/app/page.tsx](./dainganxanh-landing/src/app/page.tsx)** - Landing/home page with hero section
- **[src/app/globals.css](./dainganxanh-landing/src/app/globals.css)** - Global Tailwind CSS styles
- **[src/app/api/share-card/route.tsx](./dainganxanh-landing/src/app/api/share-card/route.tsx)** - OG image share card API route

#### (auth)/
- **[src/app/(auth)/auth/callback/page.tsx](./dainganxanh-landing/src/app/(auth)/auth/callback/page.tsx)** - Supabase auth redirect callback

#### (marketing)/
- **[src/app/(marketing)/layout.tsx](./dainganxanh-landing/src/app/(marketing)/layout.tsx)** - Marketing section layout
- **[src/app/(marketing)/pricing/page.tsx](./dainganxanh-landing/src/app/(marketing)/pricing/page.tsx)** - Package pricing selection page
- **[src/app/(marketing)/quantity/page.tsx](./dainganxanh-landing/src/app/(marketing)/quantity/page.tsx)** - Tree quantity calculator page
- **[src/app/(marketing)/checkout/page.tsx](./dainganxanh-landing/src/app/(marketing)/checkout/page.tsx)** - Payment checkout page
- **[src/app/(marketing)/checkout/success/page.tsx](./dainganxanh-landing/src/app/(marketing)/checkout/success/page.tsx)** - Order success confirmation page
- **[src/app/(marketing)/login/page.tsx](./dainganxanh-landing/src/app/(marketing)/login/page.tsx)** - Phone/email OTP login page
- **[src/app/(marketing)/register/page.tsx](./dainganxanh-landing/src/app/(marketing)/register/page.tsx)** - New user registration page

#### crm/ — User Portal
- **[src/app/crm/layout.tsx](./dainganxanh-landing/src/app/crm/layout.tsx)** - CRM portal layout with header
- **[src/app/crm/dashboard/page.tsx](./dainganxanh-landing/src/app/crm/dashboard/page.tsx)** - User dashboard overview
- **[src/app/crm/my-garden/page.tsx](./dainganxanh-landing/src/app/crm/my-garden/page.tsx)** - My garden with tree packages
- **[src/app/crm/my-garden/[orderId]/page.tsx](./dainganxanh-landing/src/app/crm/my-garden/[orderId]/page.tsx)** - Tree package detail view
- **[src/app/crm/my-garden/[orderId]/harvest/page.tsx](./dainganxanh-landing/src/app/crm/my-garden/[orderId]/harvest/page.tsx)** - Harvest decision page
- **[src/app/crm/my-garden/[orderId]/harvest/loading.tsx](./dainganxanh-landing/src/app/crm/my-garden/[orderId]/harvest/loading.tsx)** - Harvest loading skeleton
- **[src/app/crm/referrals/page.tsx](./dainganxanh-landing/src/app/crm/referrals/page.tsx)** - Referral program and commissions

#### crm/admin/ — Admin Dashboard
- **[src/app/crm/admin/layout.tsx](./dainganxanh-landing/src/app/crm/admin/layout.tsx)** - Admin section layout with sidebar
- **[src/app/crm/admin/page.tsx](./dainganxanh-landing/src/app/crm/admin/page.tsx)** - Admin main dashboard overview
- **[src/app/crm/admin/orders/page.tsx](./dainganxanh-landing/src/app/crm/admin/orders/page.tsx)** - Order management table
- **[src/app/crm/admin/lots/page.tsx](./dainganxanh-landing/src/app/crm/admin/lots/page.tsx)** - Lot/land parcel management
- **[src/app/crm/admin/trees/page.tsx](./dainganxanh-landing/src/app/crm/admin/trees/page.tsx)** - Tree health status management
- **[src/app/crm/admin/checklist/page.tsx](./dainganxanh-landing/src/app/crm/admin/checklist/page.tsx)** - Field operations checklist
- **[src/app/crm/admin/photos/upload/page.tsx](./dainganxanh-landing/src/app/crm/admin/photos/upload/page.tsx)** - Photo upload with GPS tagging
- **[src/app/crm/admin/analytics/page.tsx](./dainganxanh-landing/src/app/crm/admin/analytics/page.tsx)** - Analytics and reporting dashboard
- **[src/app/crm/admin/print-queue/page.tsx](./dainganxanh-landing/src/app/crm/admin/print-queue/page.tsx)** - Contract print queue management
- **[src/app/crm/admin/withdrawals/page.tsx](./dainganxanh-landing/src/app/crm/admin/withdrawals/page.tsx)** - Referral withdrawal approvals
- **[src/app/crm/admin/settings/page.tsx](./dainganxanh-landing/src/app/crm/admin/settings/page.tsx)** - Admin profile and system settings

### src/actions/ — Server Actions

- **[src/actions/admin-settings.ts](./dainganxanh-landing/src/actions/admin-settings.ts)** - Admin profile and preferences mutations
- **[src/actions/adminOrders.ts](./dainganxanh-landing/src/actions/adminOrders.ts)** - Order verification and management
- **[src/actions/analytics.ts](./dainganxanh-landing/src/actions/analytics.ts)** - Analytics data fetching actions
- **[src/actions/assignOrderToLot.ts](./dainganxanh-landing/src/actions/assignOrderToLot.ts)** - Assign orders to land lots
- **[src/actions/dev-auth.ts](./dainganxanh-landing/src/actions/dev-auth.ts)** - Dev-only OTP bypass for testing
- **[src/actions/fieldChecklist.ts](./dainganxanh-landing/src/actions/fieldChecklist.ts)** - Field checklist CRUD operations
- **[src/actions/lots.ts](./dainganxanh-landing/src/actions/lots.ts)** - Lot creation and management
- **[src/actions/photoUpload.ts](./dainganxanh-landing/src/actions/photoUpload.ts)** - Photo upload with GPS metadata
- **[src/actions/printQueue.ts](./dainganxanh-landing/src/actions/printQueue.ts)** - Print queue operations
- **[src/actions/referrals.ts](./dainganxanh-landing/src/actions/referrals.ts)** - Referral link and commission logic
- **[src/actions/system-settings.ts](./dainganxanh-landing/src/actions/system-settings.ts)** - System configuration mutations
- **[src/actions/treeHealth.ts](./dainganxanh-landing/src/actions/treeHealth.ts)** - Tree health status updates
- **[src/actions/withdrawals.ts](./dainganxanh-landing/src/actions/withdrawals.ts)** - Withdrawal request processing

#### src/actions/__tests__/
- **[src/actions/__tests__/analytics.test.ts](./dainganxanh-landing/src/actions/__tests__/analytics.test.ts)** - Analytics action unit tests
- **[src/actions/__tests__/assignOrderToLot.test.ts](./dainganxanh-landing/src/actions/__tests__/assignOrderToLot.test.ts)** - Lot assignment unit tests
- **[src/actions/__tests__/fieldChecklist.test.ts](./dainganxanh-landing/src/actions/__tests__/fieldChecklist.test.ts)** - Field checklist unit tests
- **[src/actions/__tests__/printQueue.test.ts](./dainganxanh-landing/src/actions/__tests__/printQueue.test.ts)** - Print queue unit tests
- **[src/actions/__tests__/referrals.test.ts](./dainganxanh-landing/src/actions/__tests__/referrals.test.ts)** - Referral action unit tests
- **[src/actions/__tests__/treeHealth.test.ts](./dainganxanh-landing/src/actions/__tests__/treeHealth.test.ts)** - Tree health unit tests
- **[src/actions/__tests__/withdrawals.test.ts](./dainganxanh-landing/src/actions/__tests__/withdrawals.test.ts)** - Withdrawal action unit tests

### src/components/ — React Components

#### components/ (shared)
- **[src/components/AuthCallbackHandler.tsx](./dainganxanh-landing/src/components/AuthCallbackHandler.tsx)** - Auth redirect and session handler
- **[src/components/AuthNavLink.tsx](./dainganxanh-landing/src/components/AuthNavLink.tsx)** - Nav link aware of auth state
- **[src/components/MotionWrapper.tsx](./dainganxanh-landing/src/components/MotionWrapper.tsx)** - Framer Motion animation wrappers
- **[src/components/ReferralTracker.tsx](./dainganxanh-landing/src/components/ReferralTracker.tsx)** - Tracks referral link clicks

#### components/admin/
- **[src/components/admin/AdminShell.tsx](./dainganxanh-landing/src/components/admin/AdminShell.tsx)** - Admin page shell with sidebar
- **[src/components/admin/AdminSidebar.tsx](./dainganxanh-landing/src/components/admin/AdminSidebar.tsx)** - Admin navigation sidebar
- **[src/components/admin/ChecklistItem.tsx](./dainganxanh-landing/src/components/admin/ChecklistItem.tsx)** - Single checklist task item
- **[src/components/admin/ChecklistProgress.tsx](./dainganxanh-landing/src/components/admin/ChecklistProgress.tsx)** - Checklist completion progress bar
- **[src/components/admin/ContractActions.tsx](./dainganxanh-landing/src/components/admin/ContractActions.tsx)** - Contract generate/print actions
- **[src/components/admin/ConversionFunnel.tsx](./dainganxanh-landing/src/components/admin/ConversionFunnel.tsx)** - Sales conversion funnel chart
- **[src/components/admin/CreateLotForm.tsx](./dainganxanh-landing/src/components/admin/CreateLotForm.tsx)** - Form to create new land lot
- **[src/components/admin/EditLotForm.tsx](./dainganxanh-landing/src/components/admin/EditLotForm.tsx)** - Form to edit existing lot
- **[src/components/admin/ExportButton.tsx](./dainganxanh-landing/src/components/admin/ExportButton.tsx)** - Export data to CSV/Excel
- **[src/components/admin/GPSPreview.tsx](./dainganxanh-landing/src/components/admin/GPSPreview.tsx)** - GPS coordinates map preview
- **[src/components/admin/KPICard.tsx](./dainganxanh-landing/src/components/admin/KPICard.tsx)** - KPI metric card widget
- **[src/components/admin/LotAssignmentModal.tsx](./dainganxanh-landing/src/components/admin/LotAssignmentModal.tsx)** - Modal for assigning order to lot
- **[src/components/admin/MiniMap.tsx](./dainganxanh-landing/src/components/admin/MiniMap.tsx)** - Small lot location map
- **[src/components/admin/OrderFilters.tsx](./dainganxanh-landing/src/components/admin/OrderFilters.tsx)** - Order list search and filters
- **[src/components/admin/OrderTable.tsx](./dainganxanh-landing/src/components/admin/OrderTable.tsx)** - Admin order data table
- **[src/components/admin/PhotoUploader.tsx](./dainganxanh-landing/src/components/admin/PhotoUploader.tsx)** - Photo upload with GPS extraction
- **[src/components/admin/PlantingChart.tsx](./dainganxanh-landing/src/components/admin/PlantingChart.tsx)** - Tree planting progress chart
- **[src/components/admin/QuarterSelector.tsx](./dainganxanh-landing/src/components/admin/QuarterSelector.tsx)** - Quarterly period selector
- **[src/components/admin/ReplacementTaskList.tsx](./dainganxanh-landing/src/components/admin/ReplacementTaskList.tsx)** - Dead tree replacement task list
- **[src/components/admin/RevenueChart.tsx](./dainganxanh-landing/src/components/admin/RevenueChart.tsx)** - Revenue over time chart
- **[src/components/admin/TreeHealthHistory.tsx](./dainganxanh-landing/src/components/admin/TreeHealthHistory.tsx)** - Tree health log history
- **[src/components/admin/TreeHealthModal.tsx](./dainganxanh-landing/src/components/admin/TreeHealthModal.tsx)** - Modal to update tree health
- **[src/components/admin/VerifyOrderButton.tsx](./dainganxanh-landing/src/components/admin/VerifyOrderButton.tsx)** - Button to verify payment
- **[src/components/admin/WithdrawalsList.tsx](./dainganxanh-landing/src/components/admin/WithdrawalsList.tsx)** - Pending withdrawals list

##### components/admin/settings/
- **[src/components/admin/settings/EmailTemplatesList.tsx](./dainganxanh-landing/src/components/admin/settings/EmailTemplatesList.tsx)** - Email template management
- **[src/components/admin/settings/NotificationToggles.tsx](./dainganxanh-landing/src/components/admin/settings/NotificationToggles.tsx)** - Notification enable/disable toggles
- **[src/components/admin/settings/PasswordChangeForm.tsx](./dainganxanh-landing/src/components/admin/settings/PasswordChangeForm.tsx)** - Admin password change form
- **[src/components/admin/settings/ProfileSettings.tsx](./dainganxanh-landing/src/components/admin/settings/ProfileSettings.tsx)** - Admin profile settings form
- **[src/components/admin/settings/SystemConfigForm.tsx](./dainganxanh-landing/src/components/admin/settings/SystemConfigForm.tsx)** - System-wide configuration form

##### components/admin/__tests__/
- **[src/components/admin/__tests__/ChecklistItem.test.tsx](./dainganxanh-landing/src/components/admin/__tests__/ChecklistItem.test.tsx)** - ChecklistItem component tests
- **[src/components/admin/__tests__/ChecklistProgress.test.tsx](./dainganxanh-landing/src/components/admin/__tests__/ChecklistProgress.test.tsx)** - ChecklistProgress component tests
- **[src/components/admin/__tests__/OrderTable.test.tsx](./dainganxanh-landing/src/components/admin/__tests__/OrderTable.test.tsx)** - OrderTable component tests
- **[src/components/admin/__tests__/QuarterSelector.test.tsx](./dainganxanh-landing/src/components/admin/__tests__/QuarterSelector.test.tsx)** - QuarterSelector component tests
- **[src/components/admin/__tests__/VerifyOrderButton.test.tsx](./dainganxanh-landing/src/components/admin/__tests__/VerifyOrderButton.test.tsx)** - VerifyOrderButton component tests

#### components/auth/
- **[src/components/auth/OTPInput.tsx](./dainganxanh-landing/src/components/auth/OTPInput.tsx)** - OTP digit input component
- **[src/components/auth/PhoneEmailInput.tsx](./dainganxanh-landing/src/components/auth/PhoneEmailInput.tsx)** - Phone/email login input

#### components/checkout/
- **[src/components/checkout/BankingPayment.tsx](./dainganxanh-landing/src/components/checkout/BankingPayment.tsx)** - Bank transfer payment details
- **[src/components/checkout/PaymentMethodSelector.tsx](./dainganxanh-landing/src/components/checkout/PaymentMethodSelector.tsx)** - Payment method selection UI
- **[src/components/checkout/PriceSummary.tsx](./dainganxanh-landing/src/components/checkout/PriceSummary.tsx)** - Order price summary
- **[src/components/checkout/QuantityErrorBoundary.tsx](./dainganxanh-landing/src/components/checkout/QuantityErrorBoundary.tsx)** - Error boundary for quantity selector
- **[src/components/checkout/QuantitySelector.tsx](./dainganxanh-landing/src/components/checkout/QuantitySelector.tsx)** - Tree quantity selector with pricing
- **[src/components/checkout/ShareCardPreview.tsx](./dainganxanh-landing/src/components/checkout/ShareCardPreview.tsx)** - Social share card preview
- **[src/components/checkout/SuccessAnimation.tsx](./dainganxanh-landing/src/components/checkout/SuccessAnimation.tsx)** - Purchase success animation

#### components/crm/
- **[src/components/crm/EmptyGarden.tsx](./dainganxanh-landing/src/components/crm/EmptyGarden.tsx)** - Empty state for new garden
- **[src/components/crm/GrowthMetrics.tsx](./dainganxanh-landing/src/components/crm/GrowthMetrics.tsx)** - Tree growth metrics display
- **[src/components/crm/HarvestBadge.tsx](./dainganxanh-landing/src/components/crm/HarvestBadge.tsx)** - Harvest status badge
- **[src/components/crm/LotMap.tsx](./dainganxanh-landing/src/components/crm/LotMap.tsx)** - User's lot location map
- **[src/components/crm/MyGardenHeader.tsx](./dainganxanh-landing/src/components/crm/MyGardenHeader.tsx)** - My garden page header
- **[src/components/crm/NotificationBell.tsx](./dainganxanh-landing/src/components/crm/NotificationBell.tsx)** - Notification bell with unread count
- **[src/components/crm/PackageCard.tsx](./dainganxanh-landing/src/components/crm/PackageCard.tsx)** - User tree package card
- **[src/components/crm/PackageDetailHeader.tsx](./dainganxanh-landing/src/components/crm/PackageDetailHeader.tsx)** - Package detail page header
- **[src/components/crm/PackageGrid.tsx](./dainganxanh-landing/src/components/crm/PackageGrid.tsx)** - Grid of user's packages
- **[src/components/crm/PhotoGallery.tsx](./dainganxanh-landing/src/components/crm/PhotoGallery.tsx)** - Tree photo gallery with GPS
- **[src/components/crm/QuarterlyReports.tsx](./dainganxanh-landing/src/components/crm/QuarterlyReports.tsx)** - Quarterly update reports
- **[src/components/crm/ReferralLink.tsx](./dainganxanh-landing/src/components/crm/ReferralLink.tsx)** - Referral link copy/share UI
- **[src/components/crm/ReferralQRCode.tsx](./dainganxanh-landing/src/components/crm/ReferralQRCode.tsx)** - QR code for referral link
- **[src/components/crm/ReferralStats.tsx](./dainganxanh-landing/src/components/crm/ReferralStats.tsx)** - Referral earnings statistics
- **[src/components/crm/TreeCard.tsx](./dainganxanh-landing/src/components/crm/TreeCard.tsx)** - Individual tree status card
- **[src/components/crm/TreeGrid.tsx](./dainganxanh-landing/src/components/crm/TreeGrid.tsx)** - Grid layout of tree cards
- **[src/components/crm/TreeShareButton.tsx](./dainganxanh-landing/src/components/crm/TreeShareButton.tsx)** - Share individual tree button
- **[src/components/crm/TreeSortFilter.tsx](./dainganxanh-landing/src/components/crm/TreeSortFilter.tsx)** - Tree list sort and filter
- **[src/components/crm/TreeTimeline.tsx](./dainganxanh-landing/src/components/crm/TreeTimeline.tsx)** - Tree growth timeline
- **[src/components/crm/WithdrawalButton.tsx](./dainganxanh-landing/src/components/crm/WithdrawalButton.tsx)** - Trigger withdrawal request button
- **[src/components/crm/WithdrawalForm.tsx](./dainganxanh-landing/src/components/crm/WithdrawalForm.tsx)** - Withdrawal amount form

##### components/crm/__tests__/
- **[src/components/crm/__tests__/EmptyGarden.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/EmptyGarden.test.tsx)** - EmptyGarden component tests
- **[src/components/crm/__tests__/HarvestBadge.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/HarvestBadge.test.tsx)** - HarvestBadge component tests
- **[src/components/crm/__tests__/NotificationBell.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/NotificationBell.test.tsx)** - NotificationBell component tests
- **[src/components/crm/__tests__/TreeCard.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/TreeCard.test.tsx)** - TreeCard component tests
- **[src/components/crm/__tests__/TreeGrid.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/TreeGrid.test.tsx)** - TreeGrid component tests
- **[src/components/crm/__tests__/TreeTimeline.test.tsx](./dainganxanh-landing/src/components/crm/__tests__/TreeTimeline.test.tsx)** - TreeTimeline component tests

#### components/layout/
- **[src/components/layout/CRMHeader.tsx](./dainganxanh-landing/src/components/layout/CRMHeader.tsx)** - CRM portal top header
- **[src/components/layout/MarketingHeader.tsx](./dainganxanh-landing/src/components/layout/MarketingHeader.tsx)** - Marketing pages top header
- **[src/components/layout/UserHeader.tsx](./dainganxanh-landing/src/components/layout/UserHeader.tsx)** - Authenticated user header

#### components/marketing/
- **[src/components/marketing/PackageCard.tsx](./dainganxanh-landing/src/components/marketing/PackageCard.tsx)** - Marketing package pricing card
- **[src/components/marketing/VideoButton.tsx](./dainganxanh-landing/src/components/marketing/VideoButton.tsx)** - Video play button trigger
- **[src/components/marketing/VideoModal.tsx](./dainganxanh-landing/src/components/marketing/VideoModal.tsx)** - Full-screen video modal

#### components/shared/
- **[src/components/shared/ShareButton.tsx](./dainganxanh-landing/src/components/shared/ShareButton.tsx)** - Generic social share button
- **[src/components/shared/__tests__/ShareButton.test.tsx](./dainganxanh-landing/src/components/shared/__tests__/ShareButton.test.tsx)** - ShareButton component tests

### src/hooks/ — Custom React Hooks

- **[src/hooks/use-toast.ts](./dainganxanh-landing/src/hooks/use-toast.ts)** - Toast notification hook
- **[src/hooks/useAdminOrders.ts](./dainganxanh-landing/src/hooks/useAdminOrders.ts)** - Admin orders data fetching hook
- **[src/hooks/useAuth.ts](./dainganxanh-landing/src/hooks/useAuth.ts)** - Authentication state hook
- **[src/hooks/useDebounce.ts](./dainganxanh-landing/src/hooks/useDebounce.ts)** - Input debounce hook
- **[src/hooks/usePriceCalculator.ts](./dainganxanh-landing/src/hooks/usePriceCalculator.ts)** - Tree quantity price calculator hook

### src/lib/ — Libraries & Utilities

- **[src/lib/constants.ts](./dainganxanh-landing/src/lib/constants.ts)** - Package pricing and app constants
- **[src/lib/utils.ts](./dainganxanh-landing/src/lib/utils.ts)** - Tailwind class merge utility
- **[src/lib/auth-helpers.ts](./dainganxanh-landing/src/lib/auth-helpers.ts)** - Supabase auth helper functions
- **[src/lib/shareMessages.ts](./dainganxanh-landing/src/lib/shareMessages.ts)** - Social share message templates
- **[src/lib/imageProcessing.ts](./dainganxanh-landing/src/lib/imageProcessing.ts)** - EXIF extraction and image compression
- **[src/lib/supabase.ts](./dainganxanh-landing/src/lib/supabase.ts)** - Supabase client singleton

#### src/lib/supabase/
- **[src/lib/supabase/client.ts](./dainganxanh-landing/src/lib/supabase/client.ts)** - Browser Supabase client
- **[src/lib/supabase/server.ts](./dainganxanh-landing/src/lib/supabase/server.ts)** - Server-side Supabase client
- **[src/lib/supabase/realtime.ts](./dainganxanh-landing/src/lib/supabase/realtime.ts)** - Realtime subscription helpers
- **[src/lib/supabase/__tests__/realtime.test.ts](./dainganxanh-landing/src/lib/supabase/__tests__/realtime.test.ts)** - Realtime subscription tests

#### src/lib/analytics/
- **[src/lib/analytics/tracking.ts](./dainganxanh-landing/src/lib/analytics/tracking.ts)** - Analytics event tracking helpers

#### src/lib/utils/
- **[src/lib/utils/treeCode.ts](./dainganxanh-landing/src/lib/utils/treeCode.ts)** - Tree code generation utility
- **[src/lib/utils/__tests__/treeCode.test.ts](./dainganxanh-landing/src/lib/utils/__tests__/treeCode.test.ts)** - Tree code utility tests

#### src/lib/__tests__/
- **[src/lib/__tests__/imageProcessing.test.ts](./dainganxanh-landing/src/lib/__tests__/imageProcessing.test.ts)** - Image processing unit tests
- **[src/lib/__tests__/shareMessages.test.ts](./dainganxanh-landing/src/lib/__tests__/shareMessages.test.ts)** - Share message template tests

### src/middleware.ts

- **[src/middleware.ts](./dainganxanh-landing/src/middleware.ts)** - Auth guard middleware for protected routes

### e2e/

- **[e2e/notification-flow.spec.ts](./dainganxanh-landing/e2e/notification-flow.spec.ts)** - E2E test for notification flow

### scripts/ — Migration & Admin Scripts

- **[scripts/add-test-contract-urls.mjs](./dainganxanh-landing/scripts/add-test-contract-urls.mjs)** - Add test contract URLs to orders
- **[scripts/add-test-contract-urls.sql](./dainganxanh-landing/scripts/add-test-contract-urls.sql)** - SQL for test contract URLs
- **[scripts/apply-contract-url-migration-complete.mjs](./dainganxanh-landing/scripts/apply-contract-url-migration-complete.mjs)** - Full contract URL migration
- **[scripts/apply-contract-url-migration-pg.mjs](./dainganxanh-landing/scripts/apply-contract-url-migration-pg.mjs)** - PostgreSQL contract URL migration
- **[scripts/apply-contract-url-migration.mjs](./dainganxanh-landing/scripts/apply-contract-url-migration.mjs)** - Apply contract URL schema change
- **[scripts/apply-health-migrations.ts](./dainganxanh-landing/scripts/apply-health-migrations.ts)** - Apply tree health migrations
- **[scripts/apply-migration-via-api.mjs](./dainganxanh-landing/scripts/apply-migration-via-api.mjs)** - Apply migration via REST API
- **[scripts/apply-migration-via-rpc.mjs](./dainganxanh-landing/scripts/apply-migration-via-rpc.mjs)** - Apply migration via Supabase RPC
- **[scripts/apply-migration.ts](./dainganxanh-landing/scripts/apply-migration.ts)** - Generic migration runner
- **[scripts/apply-print-queue-migration.mjs](./dainganxanh-landing/scripts/apply-print-queue-migration.mjs)** - Apply print queue schema
- **[scripts/apply_admin_preferences_migration.ts](./dainganxanh-landing/scripts/apply_admin_preferences_migration.ts)** - Apply admin preferences schema
- **[scripts/check-referral-conversion.mjs](./dainganxanh-landing/scripts/check-referral-conversion.mjs)** - Inspect referral conversion rates
- **[scripts/create-contracts-bucket.ts](./dainganxanh-landing/scripts/create-contracts-bucket.ts)** - Create Supabase contracts storage bucket
- **[scripts/debug-referral-flow.mjs](./dainganxanh-landing/scripts/debug-referral-flow.mjs)** - Debug referral tracking flow
- **[scripts/inspect_users_table.ts](./dainganxanh-landing/scripts/inspect_users_table.ts)** - Inspect users table schema
- **[scripts/test-referral-flow.mjs](./dainganxanh-landing/scripts/test-referral-flow.mjs)** - Test full referral flow

### dainganxanh-landing/docs/

- **[docs/supabase-otp-setup.md](./dainganxanh-landing/docs/supabase-otp-setup.md)** - Supabase OTP configuration guide
- **[docs/supabase-setup-guide.md](./dainganxanh-landing/docs/supabase-setup-guide.md)** - Full Supabase project setup guide
- **[docs/troubleshooting-database-error.md](./dainganxanh-landing/docs/troubleshooting-database-error.md)** - Database error troubleshooting

### dainganxanh-landing/email-templates/

- **[email-templates/order-confirmation.html](./dainganxanh-landing/email-templates/order-confirmation.html)** - Order confirmation email template

### public/

- **[public/dashboard-mockup.png](./dainganxanh-landing/public/dashboard-mockup.png)** - Dashboard UI mockup image
- **[public/dummy_proof.png](./dainganxanh-landing/public/dummy_proof.png)** - Dummy payment proof image
- **[public/dummy_proof.svg](./dainganxanh-landing/public/dummy_proof.svg)** - Dummy payment proof SVG
- **[public/hero-forest.png](./dainganxanh-landing/public/hero-forest.png)** - Hero section forest image
- **[public/sapling-hands.png](./dainganxanh-landing/public/sapling-hands.png)** - Sapling in hands hero image

---

## supabase/

### supabase/functions/ — Edge Functions

- **[supabase/functions/checklist-reminder/index.ts](./supabase/functions/checklist-reminder/index.ts)** - Send checklist reminder notifications
- **[supabase/functions/generate-contract/index.ts](./supabase/functions/generate-contract/index.ts)** - Generate PDF contracts for orders
- **[supabase/functions/generate-contract/fonts.ts](./supabase/functions/generate-contract/fonts.ts)** - Font loading for PDF generation
- **[supabase/functions/notify-tree-health/index.ts](./supabase/functions/notify-tree-health/index.ts)** - Notify users of tree health updates
- **[supabase/functions/notify-tree-update/index.ts](./supabase/functions/notify-tree-update/index.ts)** - Notify users of tree status changes
- **[supabase/functions/process-payment/index.ts](./supabase/functions/process-payment/index.ts)** - Process and confirm payments
- **[supabase/functions/send-email/index.ts](./supabase/functions/send-email/index.ts)** - Generic email sending function
- **[supabase/functions/send-quarterly-update/index.ts](./supabase/functions/send-quarterly-update/index.ts)** - Send quarterly tree update emails
- **[supabase/functions/send-tree-assignment-email/index.ts](./supabase/functions/send-tree-assignment-email/index.ts)** - Email when tree lot is assigned
- **[supabase/functions/send-withdrawal-email/index.ts](./supabase/functions/send-withdrawal-email/index.ts)** - Email on withdrawal approval
- **[supabase/functions/README.md](./supabase/functions/README.md)** - Edge functions overview and usage

### supabase/migrations/ — SQL Migrations

- **[supabase/migrations/20260110000000_create_users_table.sql](./supabase/migrations/20260110000000_create_users_table.sql)** - Create users table
- **[supabase/migrations/20260110010000_disable_trigger_temp.sql](./supabase/migrations/20260110010000_disable_trigger_temp.sql)** - Temporarily disable auth trigger
- **[supabase/migrations/20260110020000_fix_trigger.sql](./supabase/migrations/20260110020000_fix_trigger.sql)** - Fix user creation trigger
- **[supabase/migrations/20260111_create_orders_table.sql](./supabase/migrations/20260111_create_orders_table.sql)** - Create orders table
- **[supabase/migrations/20260111_create_lots_and_tree_photos.sql](./supabase/migrations/20260111_create_lots_and_tree_photos.sql)** - Create lots and tree photos tables
- **[supabase/migrations/20260111_create_notifications_table.sql](./supabase/migrations/20260111_create_notifications_table.sql)** - Create notifications table
- **[supabase/migrations/20260111_fix_notifications_rls.sql](./supabase/migrations/20260111_fix_notifications_rls.sql)** - Fix notifications RLS policies
- **[supabase/migrations/20260111_package_based_garden.sql](./supabase/migrations/20260111_package_based_garden.sql)** - Package-based garden schema
- **[supabase/migrations/20260112_create_trees_table.sql](./supabase/migrations/20260112_create_trees_table.sql)** - Create individual trees table
- **[supabase/migrations/20260112_add_assigned_status.sql](./supabase/migrations/20260112_add_assigned_status.sql)** - Add assigned status to orders
- **[supabase/migrations/20260112_add_lots_planted_field.sql](./supabase/migrations/20260112_add_lots_planted_field.sql)** - Add planted date to lots
- **[supabase/migrations/20260112_add_trees_rls_policies.sql](./supabase/migrations/20260112_add_trees_rls_policies.sql)** - Add RLS policies for trees
- **[supabase/migrations/20260112_fix_service_role_policies.sql](./supabase/migrations/20260112_fix_service_role_policies.sql)** - Fix service role permissions
- **[supabase/migrations/20260112_fix_trees_table_schema.sql](./supabase/migrations/20260112_fix_trees_table_schema.sql)** - Fix trees table schema issues
- **[supabase/migrations/20260113_add_contract_url_to_orders.sql](./supabase/migrations/20260113_add_contract_url_to_orders.sql)** - Add contract URL column to orders
- **[supabase/migrations/20260113_add_gps_to_tree_photos.sql](./supabase/migrations/20260113_add_gps_to_tree_photos.sql)** - Add GPS coordinates to photos
- **[supabase/migrations/20260113_add_tree_health_status.sql](./supabase/migrations/20260113_add_tree_health_status.sql)** - Add health status to trees
- **[supabase/migrations/20260113_add_tree_id_to_tree_photos.sql](./supabase/migrations/20260113_add_tree_id_to_tree_photos.sql)** - Link photos to tree records
- **[supabase/migrations/20260113_create_contracts_bucket.sql](./supabase/migrations/20260113_create_contracts_bucket.sql)** - Create contracts storage bucket
- **[supabase/migrations/20260113_create_follow_up_tasks.sql](./supabase/migrations/20260113_create_follow_up_tasks.sql)** - Create follow-up tasks table
- **[supabase/migrations/20260113_create_print_queue.sql](./supabase/migrations/20260113_create_print_queue.sql)** - Create print queue table
- **[supabase/migrations/20260113_create_replacement_tasks.sql](./supabase/migrations/20260113_create_replacement_tasks.sql)** - Create replacement tasks table
- **[supabase/migrations/20260113_create_tree_health_logs.sql](./supabase/migrations/20260113_create_tree_health_logs.sql)** - Create tree health logs table
- **[supabase/migrations/20260114154744_create_withdrawals_table.sql](./supabase/migrations/20260114154744_create_withdrawals_table.sql)** - Create withdrawals table
- **[supabase/migrations/20260114_add_referred_by_to_orders.sql](./supabase/migrations/20260114_add_referred_by_to_orders.sql)** - Add referrer tracking to orders
- **[supabase/migrations/20260114_add_trees_update_policy.sql](./supabase/migrations/20260114_add_trees_update_policy.sql)** - Add update policy for trees
- **[supabase/migrations/20260114_create_admin_preferences.sql](./supabase/migrations/20260114_create_admin_preferences.sql)** - Create admin preferences table
- **[supabase/migrations/20260114_create_email_templates.sql](./supabase/migrations/20260114_create_email_templates.sql)** - Create email templates table
- **[supabase/migrations/20260114_create_field_checklists.sql](./supabase/migrations/20260114_create_field_checklists.sql)** - Create field checklists table
- **[supabase/migrations/20260114_create_referral_clicks.sql](./supabase/migrations/20260114_create_referral_clicks.sql)** - Create referral click tracking table
- **[supabase/migrations/20260114_create_system_config.sql](./supabase/migrations/20260114_create_system_config.sql)** - Create system configuration table
- **[supabase/migrations/20260115_add_role_column_to_users.sql](./supabase/migrations/20260115_add_role_column_to_users.sql)** - Add role column to users
- **[supabase/migrations/APPLY_STORY_4_5_MIGRATIONS.sql](./supabase/migrations/APPLY_STORY_4_5_MIGRATIONS.sql)** - Batch migration for stories 4-5
- **[supabase/migrations/README.md](./supabase/migrations/README.md)** - Migration order and guidelines

### supabase/tests/

- **[supabase/tests/quick-test.sql](./supabase/tests/quick-test.sql)** - Quick database sanity checks
- **[supabase/tests/seed-notification-test-data.sql](./supabase/tests/seed-notification-test-data.sql)** - Seed data for notification tests
- **[supabase/tests/test-notification-e2e.sql](./supabase/tests/test-notification-e2e.sql)** - E2E notification test SQL
- **[supabase/tests/test-notification-manual.sql](./supabase/tests/test-notification-manual.sql)** - Manual notification test SQL
- **[supabase/tests/test-notification-system.sql](./supabase/tests/test-notification-system.sql)** - Notification system integration test

### supabase/webhooks/

- **[supabase/webhooks/tree-health-notification.sql](./supabase/webhooks/tree-health-notification.sql)** - Webhook trigger for health updates
- **[supabase/webhooks/tree-photo-notification.sql](./supabase/webhooks/tree-photo-notification.sql)** - Webhook trigger for photo uploads

---

## _bmad-output/ — Planning & Implementation Artifacts

### _bmad-output/planning-artifacts/

- **[_bmad-output/planning-artifacts/architecture.md](./_bmad-output/planning-artifacts/architecture.md)** - System architecture document
- **[_bmad-output/planning-artifacts/epics.md](./_bmad-output/planning-artifacts/epics.md)** - Epics and user stories
- **[_bmad-output/planning-artifacts/ux-design-specification.md](./_bmad-output/planning-artifacts/ux-design-specification.md)** - UX design specification
- **[_bmad-output/planning-artifacts/wireframes.md](./_bmad-output/planning-artifacts/wireframes.md)** - Wireframe descriptions

### _bmad-output/implementation-artifacts/

- **[_bmad-output/implementation-artifacts/1-1-landing-page-hero-video.md](./_bmad-output/implementation-artifacts/1-1-landing-page-hero-video.md)** - Story: landing page hero with video
- **[_bmad-output/implementation-artifacts/1-2-package-selection.md](./_bmad-output/implementation-artifacts/1-2-package-selection.md)** - Story: package selection UI
- **[_bmad-output/implementation-artifacts/1-3-quantity-price-calculator.md](./_bmad-output/implementation-artifacts/1-3-quantity-price-calculator.md)** - Story: quantity/price calculator
- **[_bmad-output/implementation-artifacts/1-4-quick-registration-otp.md](./_bmad-output/implementation-artifacts/1-4-quick-registration-otp.md)** - Story: OTP registration flow
- **[_bmad-output/implementation-artifacts/1-5-returning-user-login.md](./_bmad-output/implementation-artifacts/1-5-returning-user-login.md)** - Story: returning user login
- **[_bmad-output/implementation-artifacts/1-6-payment-gateway.md](./_bmad-output/implementation-artifacts/1-6-payment-gateway.md)** - Story: payment gateway integration
- **[_bmad-output/implementation-artifacts/1-7-success-animation-share.md](./_bmad-output/implementation-artifacts/1-7-success-animation-share.md)** - Story: success animation and share
- **[_bmad-output/implementation-artifacts/1-8-email-confirmation-contract.md](./_bmad-output/implementation-artifacts/1-8-email-confirmation-contract.md)** - Story: email confirmation and contract
- **[_bmad-output/implementation-artifacts/2-1-my-garden-dashboard.md](./_bmad-output/implementation-artifacts/2-1-my-garden-dashboard.md)** - Story: my garden dashboard
- **[_bmad-output/implementation-artifacts/2-2-tree-detail-view.md](./_bmad-output/implementation-artifacts/2-2-tree-detail-view.md)** - Story: tree detail view
- **[_bmad-output/implementation-artifacts/2-3-quarterly-notifications.md](./_bmad-output/implementation-artifacts/2-3-quarterly-notifications.md)** - Story: quarterly notifications
- **[_bmad-output/implementation-artifacts/2-4-timeline-placeholder.md](./_bmad-output/implementation-artifacts/2-4-timeline-placeholder.md)** - Story: timeline placeholder
- **[_bmad-output/implementation-artifacts/2-5-harvest-notification.md](./_bmad-output/implementation-artifacts/2-5-harvest-notification.md)** - Story: harvest notification
- **[_bmad-output/implementation-artifacts/2-6-harvest-sell-back.md](./_bmad-output/implementation-artifacts/2-6-harvest-sell-back.md)** - Story: harvest sell-back option
- **[_bmad-output/implementation-artifacts/2-7-harvest-keep-growing.md](./_bmad-output/implementation-artifacts/2-7-harvest-keep-growing.md)** - Story: harvest keep-growing option
- **[_bmad-output/implementation-artifacts/2-8-harvest-receive-product.md](./_bmad-output/implementation-artifacts/2-8-harvest-receive-product.md)** - Story: harvest receive product
- **[_bmad-output/implementation-artifacts/3-1-order-management-dashboard.md](./_bmad-output/implementation-artifacts/3-1-order-management-dashboard.md)** - Story: admin order management
- **[_bmad-output/implementation-artifacts/3-2-tree-lot-assignment.md](./_bmad-output/implementation-artifacts/3-2-tree-lot-assignment.md)** - Story: tree lot assignment
- **[_bmad-output/implementation-artifacts/3-3-contract-printing.md](./_bmad-output/implementation-artifacts/3-3-contract-printing.md)** - Story: contract printing
- **[_bmad-output/implementation-artifacts/3-4-field-operations-checklist.md](./_bmad-output/implementation-artifacts/3-4-field-operations-checklist.md)** - Story: field operations checklist
- **[_bmad-output/implementation-artifacts/3-5-photo-upload-gps.md](./_bmad-output/implementation-artifacts/3-5-photo-upload-gps.md)** - Story: photo upload with GPS
- **[_bmad-output/implementation-artifacts/3-6-tree-health-status.md](./_bmad-output/implementation-artifacts/3-6-tree-health-status.md)** - Story: tree health status
- **[_bmad-output/implementation-artifacts/3-7-analytics-reporting.md](./_bmad-output/implementation-artifacts/3-7-analytics-reporting.md)** - Story: analytics and reporting
- **[_bmad-output/implementation-artifacts/4-1-referral-link-generation.md](./_bmad-output/implementation-artifacts/4-1-referral-link-generation.md)** - Story: referral link generation
- **[_bmad-output/implementation-artifacts/4-2-social-share-prepopulated.md](./_bmad-output/implementation-artifacts/4-2-social-share-prepopulated.md)** - Story: social share pre-populated
- **[_bmad-output/implementation-artifacts/4-3-referral-commission-withdrawal.md](./_bmad-output/implementation-artifacts/4-3-referral-commission-withdrawal.md)** - Story: referral commission withdrawal
- **[_bmad-output/implementation-artifacts/4-4-admin-settings-profile.md](./_bmad-output/implementation-artifacts/4-4-admin-settings-profile.md)** - Story: admin profile settings
- **[_bmad-output/implementation-artifacts/4-5-admin-settings-system.md](./_bmad-output/implementation-artifacts/4-5-admin-settings-system.md)** - Story: admin system settings
- **[_bmad-output/implementation-artifacts/sprint-status.yaml](./_bmad-output/implementation-artifacts/sprint-status.yaml)** - Current sprint status tracking
