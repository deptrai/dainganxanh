# Story 4.2: Social Share Pre-populated

Status: ready-for-dev

## Story

As a **user on success screen**,
I want to **1-click share với text/image sẵn**,
so that **share nhanh chóng và đẹp mắt**.

## Acceptance Criteria

1. **Given** ở success screen  
   **When** click "Chia sẻ"  
   **Then** mở share dialog với:
   - Text: "Tôi vừa trồng X cây cho Mẹ Thiên Nhiên 🌳"
   - Image: Generated share card
   - Link: Landing + ref code

2. **And** Web Share API cho native sharing (mobile)

3. **And** Fallback buttons cho desktop: Copy link, Email

4. **And** Share từ dashboard (My Garden) cũng hoạt động

## Tasks / Subtasks

- [ ] Task 1: Share Button Component (AC: 1, 2, 3)
  - [ ] 1.1 Update `components/checkout/ShareButton.tsx` (từ Story 1.7)
  - [ ] 1.2 Web Share API detection
  - [ ] 1.3 Fallback UI cho desktop

- [ ] Task 2: Pre-populated Text (AC: 1)
  - [ ] 2.1 Template: "Tôi vừa trồng {X} cây cho Mẹ Thiên Nhiên 🌳"
  - [ ] 2.2 Include ref link: dainganxanh.com.vn/ref/{code}
  - [ ] 2.3 Vietnamese + emoji optimized

- [ ] Task 3: Share Card Integration (AC: 1)
  - [ ] 3.1 Reuse `/api/share-card` từ Story 1.7
  - [ ] 3.2 Include user name, tree count, CO2
  - [ ] 3.3 OG meta tags cho link preview

- [ ] Task 4: Desktop Fallback (AC: 3)
  - [ ] 4.1 "Copy Link" button với toast confirmation
  - [ ] 4.2 Email share: mailto: với pre-filled subject/body
  - [ ] 4.3 Individual platform buttons: Twitter, LinkedIn

- [ ] Task 5: Dashboard Share (AC: 4)
  - [ ] 5.1 Add share button trên TreeCard
  - [ ] 5.2 Share individual tree progress
  - [ ] 5.3 Different message: "Cây của tôi đã {X} tháng tuổi! 🌲"

- [ ] Task 6: Share Analytics (AC: 1)
  - [ ] 6.1 Track share attempts
  - [ ] 6.2 Track share method (native, copy, email)
  - [ ] 6.3 Mixpanel/GA4 events

## Dev Notes

### Architecture Compliance
- **API:** `/api/share-card` (existing từ Story 1.7)
- **Components:** Reusable ShareButton
- **Analytics:** Mixpanel + GA4

### Web Share API Implementation
```typescript
// components/shared/ShareButton.tsx
const ShareButton = ({ title, text, url, imageUrl }) => {
  const canShare = typeof navigator !== 'undefined' && navigator.share
  
  const handleShare = async () => {
    if (canShare) {
      try {
        // Try sharing with files (image)
        if (navigator.canShare && imageUrl) {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const file = new File([blob], 'share-card.png', { type: 'image/png' })
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text,
              url,
              files: [file]
            })
            return
          }
        }
        
        // Fallback: share without image
        await navigator.share({ title, text, url })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Show fallback modal
      setShowFallback(true)
    }
  }
  
  return <Button onClick={handleShare}>Chia sẻ</Button>
}
```

### Share Messages
```typescript
const SHARE_MESSAGES = {
  purchase: {
    title: 'Đại Ngàn Xanh',
    text: (trees: number) => 
      `Tôi vừa trồng ${trees} cây cho Mẹ Thiên Nhiên 🌳 Mỗi cây hấp thụ 20kg CO2/năm! Tham gia cùng tôi:`,
  },
  progress: {
    title: 'Cây của tôi đang lớn!',
    text: (months: number) => 
      `Cây của tôi đã ${months} tháng tuổi! 🌲 Xem hành trình tại:`,
  },
  harvest: {
    title: 'Thu hoạch trầm hương',
    text: () => 
      `Sau 5 năm chăm sóc, cây trầm hương của tôi đã sẵn sàng thu hoạch! 🎉`,
  }
}
```

### OG Meta Tags (Dynamic)
```typescript
// app/api/og/route.tsx
export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'purchase', 'progress', 'tree'
  const id = searchParams.get('id')
  
  // Dynamic OG image based on type
  return new ImageResponse(...)
}
```

### Analytics Events
```typescript
// Track share events
analytics.track('share_initiated', {
  source: 'success_screen' | 'dashboard' | 'tree_detail',
  method: 'native' | 'copy' | 'email' | 'twitter' | 'linkedin',
  trees: 5,
  ref_code: 'ABC123'
})

analytics.track('share_completed', {
  ...
})
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Routes]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Success-Share]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Social-Sharing]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2]
- [Source: docs/prd.md#FR-21]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/shared/ShareButton.tsx
- src/components/shared/ShareFallbackModal.tsx
- src/components/crm/TreeShareButton.tsx
- src/lib/shareMessages.ts
- src/lib/analytics.ts (update)
