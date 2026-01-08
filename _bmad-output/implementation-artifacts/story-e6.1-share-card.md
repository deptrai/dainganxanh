# Story E6.1: Share Card Generation

Status: ready-for-dev

## Story

As a **tree owner**,
I want **tạo share card đẹp sau khi mua**,
so that **tôi có thể khoe lên social media và invite bạn bè**.

## Acceptance Criteria

1. Sau khi thanh toán thành công, hiển thị Share Card preview
2. Card có design đẹp với:
   - User name hoặc "Người gieo hạt"
   - Số cây đã mua
   - CO2 impact estimate
   - Branding Đại Ngàn Xanh
   - Beautiful gradient background
3. 1-click share to Facebook (Web Share API fallback)
4. Pre-populated share text với hashtags
5. Include referral link trong share
6. Card có thể download dưới dạng PNG
7. Share page với OG meta tags cho Facebook preview

## Tasks / Subtasks

- [ ] Task 1: Backend - Image generation (AC: #2, #6)
  - [ ] Subtask 1.1: Verify ShareCardGeneratorService SVG template
  - [ ] Subtask 1.2: Add sharp for SVG → PNG conversion
  - [ ] Subtask 1.3: Upload PNG to S3
  - [ ] Subtask 1.4: Return signed URL

- [ ] Task 2: Backend - Share endpoints (AC: #7)
  - [ ] Subtask 2.1: Verify /share-card/svg endpoint
  - [ ] Subtask 2.2: Verify /share-card/data endpoint
  - [ ] Subtask 2.3: Verify /share-card/page/:id với OG tags

- [ ] Task 3: Frontend - Success page integration (AC: #1)
  - [ ] Subtask 3.1: After payment success, show share card
  - [ ] Subtask 3.2: Preview card component
  - [ ] Subtask 3.3: Animate card reveal

- [ ] Task 4: Frontend - Share buttons (AC: #3, #4)
  - [ ] Subtask 4.1: Web Share API button
  - [ ] Subtask 4.2: Facebook share fallback
  - [ ] Subtask 4.3: Copy link button
  - [ ] Subtask 4.4: Pre-fill share text

- [ ] Task 5: Referral integration (AC: #5)
  - [ ] Subtask 5.1: Generate/fetch user referral code
  - [ ] Subtask 5.2: Append ref param to share URL
  - [ ] Subtask 5.3: Track share events

- [ ] Task 6: Download (AC: #6)
  - [ ] Subtask 6.1: Download PNG button
  - [ ] Subtask 6.2: Loading state during generation
  - [ ] Subtask 6.3: File naming: dainganxanh-share-{orderId}.png

- [ ] Task 7: Testing (AC: #1-7)
  - [ ] Subtask 7.1: Test share on mobile
  - [ ] Subtask 7.2: Verify Facebook OG preview
  - [ ] Subtask 7.3: Test edge cases (long names, many trees)

## Dev Notes

### Architecture Patterns
- SVG generated server-side for consistency
- PNG conversion với sharp (fast)
- Web Share API for native share (Safari/Chrome mobile)
- Fallback to Facebook SDK

### Source Tree Components
- ShareCardGeneratorService: `share-card/services/`
- ShareCardController: `share-card/controllers/`
- Twenty Storage: `engine/core-modules/file-storage/`

### Design Reference (UX Design 2.5)
- Wireframe: See UX Design Section 2.5 Success Screen + Share Card
- Card content: Name, trees, CO2, branding
- Background: `--dgnx-gradient-forest`
- Animation: Tree growing Lottie (3s)
- SVG → PNG conversion with sharp
- OG meta tags for Facebook preview

### Testing Standards
- Test OG tags với Facebook Debugger
- Test Web Share API on mobile Safari
- Test download on various devices

### References
- [Architecture: ADR-03 Module Structure](file:///_bmad-output/planning-artifacts/architecture.md#adr-03-backend-module-structure)
- [UX Design: Section 2.5 Success Screen](file:///_bmad-output/planning-artifacts/ux-design.md)
- [Backend: share-card-generator.service.ts](file:///d/packages/twenty-server/src/modules/dainganxanh/share-card/services/share-card-generator.service.ts)
- [Backend: share-card.controller.ts](file:///d/packages/twenty-server/src/modules/dainganxanh/share-card/controllers/share-card.controller.ts)
- [Web Share API docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
