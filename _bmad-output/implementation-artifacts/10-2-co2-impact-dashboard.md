# Story 10.2: CO2 Impact Dashboard

Status: ready-for-dev

## Story

As a **tree owner**,
I want to **xem tác động môi trường của tôi theo cách trực quan và cảm xúc**,
so that **tôi cảm thấy proud và muốn mua thêm cây**.

## Acceptance Criteria

1. **Given** user ở dashboard `/crm/my-garden`
   **When** xem section "Tác động môi trường của tôi"
   **Then** hiển thị:
   - Tổng CO2 absorbed (kg/year) từ tất cả orders của user
   - Tương đương impact: "= X chuyến bay Hà Nội - Sài Gòn" hoặc "= Y km lái xe ô tô"
   - Text cảm xúc: "Bạn đang giúp Trái Đất thở dễ hơn mỗi ngày!"

2. **And** biểu đồ CO2 tích lũy animated:
   - Bar chart hoặc area chart
   - Trục X: Thời gian (tháng hoặc năm)
   - Trục Y: CO2 absorbed tích lũy (kg)
   - Animation: smooth transition khi load
   - Màu gradient: Brand green (`#2d6a4f` → `#1e4d2b`)

3. **And** so sánh với average user:
   - Badge/indicator: "Bạn đang làm tốt hơn 67% người dùng!"
   - Hoặc: "Tác động của bạn cao hơn trung bình 25%!"
   - Calculate từ aggregated data (user's total vs avg all users)

4. **And** shareable social card (1200x630):
   - Background: Brand gradient
   - Text: "{userName} đã offset {totalCO2}kg CO2 với Đại Ngàn Xanh"
   - Sub-text: "= {flightEquivalent} chuyến bay tiết kiệm"
   - Logo + CTA: "Trồng cây cùng tôi tại dainganxanh.com.vn"
   - Button "Chia sẻ" → download PNG hoặc copy link

5. **And** mobile responsive:
   - Chart tự động scale trên màn hình nhỏ
   - Impact equivalents hiển thị dạng card stack (vertical)
   - Smooth scroll animation

## Tasks / Subtasks

- [ ] Task 1: Dashboard UI Component (AC: 1, 5)
  - [ ] 1.1 Tạo `src/components/crm/CO2ImpactDashboard.tsx` — main container component
  - [ ] 1.2 Section layout: Header + Impact Stats + Chart + Comparison + Share Button
  - [ ] 1.3 Responsive grid: `lg:grid-cols-2` cho stats, full-width cho chart
  - [ ] 1.4 Icons: `lucide-react` (Plane, Car, TreePine, TrendingUp)
  - [ ] 1.5 Integration: Add to `/crm/my-garden/page.tsx` below PackageCard grid

- [ ] Task 2: CO2 Calculation Server Action (AC: 1)
  - [ ] 2.1 Tạo `src/actions/getCO2Impact.ts`
  - [ ] 2.2 Function: `async getCO2Impact(userId: string)`
  - [ ] 2.3 Query aggregated CO2 từ orders:
    ```sql
    SELECT
      SUM(o.co2_absorbed) as total_co2,
      SUM(o.quantity) as total_trees,
      COUNT(DISTINCT o.id) as total_orders
    FROM orders o
    WHERE o.user_id = :userId
      AND o.status = 'completed'
    ```
  - [ ] 2.4 Calculate equivalents:
    - Flight: `totalCO2 / 200` (200kg CO2 per HAN-SGN flight)
    - Car: `totalCO2 / 0.2` (0.2kg CO2 per km driving)
  - [ ] 2.5 Return interface:
    ```typescript
    interface CO2Impact {
      totalCO2: number
      totalTrees: number
      flightEquivalent: number
      carEquivalent: number
      comparisonPercent: number
    }
    ```

- [ ] Task 3: Time-Series CO2 Chart Data (AC: 2)
  - [ ] 3.1 Function: `async getCO2TimeSeries(userId: string)`
  - [ ] 3.2 Query orders grouped by month:
    ```sql
    SELECT
      DATE_TRUNC('month', o.created_at) as month,
      SUM(o.co2_absorbed) as co2_monthly
    FROM orders o
    WHERE o.user_id = :userId
      AND o.status = 'completed'
    GROUP BY month
    ORDER BY month ASC
    ```
  - [ ] 3.3 Calculate cumulative CO2:
    ```typescript
    const cumulative = data.reduce((acc, curr) => {
      const prev = acc[acc.length - 1]?.total || 0
      acc.push({ month: curr.month, total: prev + curr.co2_monthly })
      return acc
    }, [])
    ```
  - [ ] 3.4 Return array: `{ month: string, co2: number }[]`

- [ ] Task 4: Animated CO2 Chart Component (AC: 2)
  - [ ] 4.1 Tạo `src/components/crm/CO2Chart.tsx`
  - [ ] 4.2 Library: `recharts` (already used in admin analytics)
  - [ ] 4.3 Chart type: `<AreaChart>` với gradient fill
  - [ ] 4.4 Props: `data: { month: string, co2: number }[]`
  - [ ] 4.5 Animation: `<Area animationDuration={1000} />`
  - [ ] 4.6 Styling:
    - Gradient: `url(#co2Gradient)` - green to dark green
    - Stroke: `#2d6a4f`, strokeWidth: 3
    - Tooltip: Show month + CO2 value
  - [ ] 4.7 Responsive: `<ResponsiveContainer width="100%" height={300}>`

- [ ] Task 5: User Comparison Logic (AC: 3)
  - [ ] 5.1 Function: `async getUserComparison(userId: string)`
  - [ ] 5.2 Query average CO2 per user:
    ```sql
    SELECT AVG(total_co2) as avg_co2
    FROM (
      SELECT user_id, SUM(co2_absorbed) as total_co2
      FROM orders
      WHERE status = 'completed'
      GROUP BY user_id
    ) user_totals
    ```
  - [ ] 5.3 Calculate percentile:
    ```sql
    SELECT COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT user_id) FROM orders WHERE status = 'completed')
    FROM (
      SELECT user_id, SUM(co2_absorbed) as total
      FROM orders
      WHERE status = 'completed'
      GROUP BY user_id
      HAVING SUM(co2_absorbed) < :userCO2
    )
    ```
  - [ ] 5.4 Return: `{ percentile: number, aboveAverage: boolean, avgCO2: number }`

- [ ] Task 6: Comparison Badge Component (AC: 3)
  - [ ] 6.1 Tạo `src/components/crm/CO2ComparisonBadge.tsx`
  - [ ] 6.2 Props: `percentile: number, aboveAverage: boolean`
  - [ ] 6.3 Conditional rendering:
    - If `percentile >= 75`: "🌟 Xuất sắc! Bạn đang làm tốt hơn {percentile}% người dùng!"
    - If `percentile >= 50`: "👍 Tốt lắm! Bạn đang làm tốt hơn {percentile}% người dùng!"
    - Else: "💪 Tiếp tục phát huy! Trồng thêm cây để tăng tác động!"
  - [ ] 6.4 Styling: Badge với icon + text, background gradient based on percentile

- [ ] Task 7: Share Card Image Generation (AC: 4)
  - [ ] 7.1 Tạo `supabase/functions/generate-co2-card/index.ts`
  - [ ] 7.2 Pattern: Reuse từ Story 10.1 share card generation
  - [ ] 7.3 Payload:
    ```typescript
    interface CO2CardRequest {
      userId: string
      userName: string
      totalCO2: number
      flightEquivalent: number
    }
    ```
  - [ ] 7.4 Canvas rendering (1200x630):
    - Background: Linear gradient `#2d6a4f` → `#1e4d2b`
    - Title: "{userName} đã offset {totalCO2}kg CO2"
    - Subtitle: "= {flightEquivalent} chuyến bay tiết kiệm"
    - Logo: Đại Ngàn Xanh (overlay from Storage)
    - CTA: "Trồng cây cùng tôi tại dainganxanh.com.vn"
  - [ ] 7.5 Upload to `share-cards` bucket: `co2-impact-{userId}.png`
  - [ ] 7.6 Return public URL

- [ ] Task 8: Share Button Component (AC: 4)
  - [ ] 8.1 Tạo `src/components/crm/ShareCO2Button.tsx`
  - [ ] 8.2 onClick: Call Server Action `generateCO2Card(userId)`
  - [ ] 8.3 Options:
    - Download PNG (browser download)
    - Copy shareable link (clipboard API)
    - Share via Web Share API (mobile)
  - [ ] 8.4 Loading state + success toast
  - [ ] 8.5 Icon: `lucide-react/Share2`

- [ ] Task 9: Integration with Dashboard (AC: 1, 5)
  - [ ] 9.1 Update `/crm/my-garden/page.tsx`
  - [ ] 9.2 Fetch CO2 data server-side:
    ```typescript
    const co2Impact = await getCO2Impact(user.id)
    const co2TimeSeries = await getCO2TimeSeries(user.id)
    const comparison = await getUserComparison(user.id)
    ```
  - [ ] 9.3 Add `<CO2ImpactDashboard>` component below existing PackageCard grid
  - [ ] 9.4 Pass data as props
  - [ ] 9.5 Conditional rendering: Only show if user has orders with status='completed'

- [ ] Task 10: Tests (AC: 1-5)
  - [ ] 10.1 Unit test `src/actions/__tests__/getCO2Impact.test.ts`:
    - Mock Supabase queries
    - Test CO2 calculation logic
    - Test equivalents calculation (flight, car)
    - Test edge cases (no orders, zero CO2)
  - [ ] 10.2 Unit test `src/components/crm/__tests__/CO2Chart.test.tsx`:
    - Mock recharts rendering
    - Test data transformation
    - Test responsive behavior
  - [ ] 10.3 Integration test `src/actions/__tests__/getUserComparison.test.ts`:
    - Mock aggregate queries
    - Test percentile calculation
    - Test comparison logic
  - [ ] 10.4 E2E test `e2e/co2-dashboard.spec.ts`:
    - Navigate to `/crm/my-garden`
    - Verify CO2 stats rendered
    - Verify chart animation
    - Click share button
    - Verify download triggered

## Dev Notes

### Architecture: Dashboard Enhancement Pattern

Story 2-1 đã implement `/crm/my-garden` dashboard với PackageCard grid. Story này **extends** dashboard với CO2 Impact section mới.

```
User visits /crm/my-garden
  → Server-side data fetch (getCO2Impact, getCO2TimeSeries, getUserComparison)
    → Pass data as props to client components
      → <CO2ImpactDashboard> renders stats + chart + share button
        → User clicks share
          → Edge Function generates social card
            → Browser downloads PNG
```

### CO2 Calculation Logic

**Current Implementation (from codebase):**
```typescript
// From PackageCard.tsx and page.tsx
const co2Total = order.co2_absorbed ?? (order.quantity * 20)
```

**Assumptions:**
- Each tree absorbs ~20kg CO2 per year
- `orders.co2_absorbed` field stores calculated value
- Fallback: `quantity * 20` if `co2_absorbed` is null

**For Dashboard:**
- Aggregate all user's orders: `SUM(o.co2_absorbed)` or `SUM(o.quantity * 20)`
- Time-series: Group by month, calculate cumulative sum

### Impact Equivalents

**Flight Equivalent:**
- Hanoi to Saigon flight: ~200kg CO2 per passenger
- Formula: `totalCO2 / 200 = number of flights offset`

**Car Equivalent:**
- Average car: ~0.2kg CO2 per km
- Formula: `totalCO2 / 0.2 = km driven offset`

**Sources:**
- Vietnam Airlines emission data (approximate)
- ICAO Carbon Emissions Calculator

### Chart Library: Recharts

Already used in admin analytics (`src/actions/analytics.ts`):
```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
```

**Chart Configuration:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={co2TimeSeries}>
    <defs>
      <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#1e4d2b" stopOpacity={0.2}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis label={{ value: 'CO2 (kg)', angle: -90, position: 'insideLeft' }} />
    <Tooltip />
    <Area
      type="monotone"
      dataKey="co2"
      stroke="#2d6a4f"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#co2Gradient)"
      animationDuration={1000}
    />
  </AreaChart>
</ResponsiveContainer>
```

### Database Schema: CO2 Data

**Existing Tables:**
```sql
-- orders table (from database_schema.sql)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quantity INTEGER NOT NULL,
  co2_absorbed NUMERIC DEFAULT 0, -- ✅ Already exists!
  status TEXT,
  created_at TIMESTAMPTZ
);

-- trees table (from migrations)
CREATE TABLE trees (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  co2_absorbed DECIMAL(10, 2) DEFAULT 0, -- ✅ Also exists
  planted_at TIMESTAMPTZ
);
```

**Query Pattern:**
```sql
-- User's total CO2
SELECT SUM(co2_absorbed) as total_co2
FROM orders
WHERE user_id = :userId
  AND status = 'completed';

-- Time-series (monthly)
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(co2_absorbed) as co2_monthly
FROM orders
WHERE user_id = :userId
  AND status = 'completed'
GROUP BY month
ORDER BY month ASC;

-- Average comparison
SELECT AVG(total_co2) as avg_co2
FROM (
  SELECT user_id, SUM(co2_absorbed) as total_co2
  FROM orders
  WHERE status = 'completed'
  GROUP BY user_id
) user_totals;
```

### Component Structure

```tsx
// src/components/crm/CO2ImpactDashboard.tsx
interface CO2ImpactDashboardProps {
  totalCO2: number
  totalTrees: number
  flightEquivalent: number
  carEquivalent: number
  timeSeries: { month: string, co2: number }[]
  comparison: { percentile: number, aboveAverage: boolean, avgCO2: number }
  userId: string
  userName: string
}

export function CO2ImpactDashboard(props: CO2ImpactDashboardProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-600">
          🌍 Tác động môi trường của tôi
        </h2>
        <ShareCO2Button userId={props.userId} userName={props.userName} />
      </div>

      {/* Impact Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TreePine />}
          label="Tổng CO2 hấp thụ"
          value={`${props.totalCO2} kg/năm`}
        />
        <StatCard
          icon={<Plane />}
          label="Tương đương chuyến bay"
          value={`${props.flightEquivalent} chuyến`}
          subtitle="HAN - SGN"
        />
        <StatCard
          icon={<Car />}
          label="Tương đương lái xe"
          value={`${props.carEquivalent} km`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="So với người dùng khác"
          value={`Top ${100 - props.comparison.percentile}%`}
        />
      </div>

      {/* Emotional Message */}
      <div className="bg-gradient-to-r from-brand-50 to-accent-gold/10 rounded-xl p-6 text-center">
        <p className="text-lg text-brand-700">
          🎉 Bạn đang giúp Trái Đất thở dễ hơn mỗi ngày!
        </p>
      </div>

      {/* CO2 Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-brand-600">
          📊 CO2 tích lũy theo thời gian
        </h3>
        <CO2Chart data={props.timeSeries} />
      </div>

      {/* Comparison Badge */}
      <CO2ComparisonBadge
        percentile={props.comparison.percentile}
        aboveAverage={props.comparison.aboveAverage}
      />
    </section>
  )
}
```

### Dashboard Integration

```tsx
// src/app/crm/my-garden/page.tsx
export default async function MyGardenPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Existing: Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // NEW: Fetch CO2 impact data
  const co2Impact = await getCO2Impact(user.id)
  const co2TimeSeries = await getCO2TimeSeries(user.id)
  const comparison = await getUserComparison(user.id)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Existing: Package Cards Grid */}
      <section>
        <h1 className="text-3xl font-bold mb-6">Vườn của tôi</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders?.map(order => <PackageCard key={order.id} order={order} />)}
        </div>
      </section>

      {/* NEW: CO2 Impact Dashboard */}
      {orders && orders.length > 0 && (
        <CO2ImpactDashboard
          totalCO2={co2Impact.totalCO2}
          totalTrees={co2Impact.totalTrees}
          flightEquivalent={co2Impact.flightEquivalent}
          carEquivalent={co2Impact.carEquivalent}
          timeSeries={co2TimeSeries}
          comparison={comparison}
          userId={user.id}
          userName={user.user_metadata?.full_name || 'Người trồng cây'}
        />
      )}
    </div>
  )
}
```

### Share Card Generation Pattern

Reuse from Story 10.1 (certificate share card):
```typescript
// supabase/functions/generate-co2-card/index.ts
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.6/mod.ts'

serve(async (req) => {
  const { userId, userName, totalCO2, flightEquivalent } = await req.json()

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #2d6a4f, #1e4d2b)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Helvetica',
      }}>
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>🌳 Đại Ngàn Xanh</h1>
        <p style={{ fontSize: 36, fontWeight: 'bold' }}>{userName}</p>
        <p style={{ fontSize: 64, color: '#FFD700', margin: '20px 0' }}>
          {totalCO2}kg CO2
        </p>
        <p style={{ fontSize: 28, opacity: 0.9 }}>
          = {flightEquivalent} chuyến bay tiết kiệm
        </p>
        <p style={{ fontSize: 20, marginTop: 40, opacity: 0.8 }}>
          Trồng cây cùng tôi tại dainganxanh.com.vn
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  )
})
```

### Previous Story Intelligence

**From Story 2-1 (My Garden Dashboard):**
- ✅ Dashboard route: `/crm/my-garden/page.tsx`
- ✅ Server-side data fetching pattern with Supabase
- ✅ PackageCard grid layout established
- ✅ Responsive design: `md:grid-cols-2 lg:grid-cols-3`
- 📍 Add CO2 section below PackageCard grid
- 🎨 Follow existing spacing: `space-y-8` for sections

**From Story 3-7 (Admin Analytics):**
- ✅ Recharts library already integrated
- ✅ Chart patterns: AreaChart, BarChart, PieChart
- ✅ CO2 aggregation logic: `carbonData?.reduce((sum, tree) => sum + (tree.co2_absorbed || 0), 0)`
- ⚠️ Watch for: Chart responsiveness on mobile
- 📊 Reuse chart styling patterns

**From Story 10.1 (Certificate Download):**
- ✅ Share card generation pattern with Edge Function
- ✅ Supabase Storage `share-cards` bucket
- ✅ Image generation: Use `ImageResponse` from Deno
- 🎨 Brand gradient and styling established

**From Recent Commits:**
- Pattern: Server Actions for data, client components for interactivity
- Trend: Emotional messaging in UX ("Bạn đang giúp Trái Đất...")
- Style: Card-based layout with gradient accents

### Architecture Guardrails

1. **MUST use Server Components** for data fetching (`/crm/my-garden/page.tsx` is RSC)
2. **MUST use Server Actions** for CO2 calculations (keep business logic server-side)
3. **MUST follow RLS policies** — all queries auto-filter by `auth.uid()`
4. **MUST aggregate CO2 from orders** — NOT from trees (orders.co2_absorbed is source of truth)
5. **MUST handle zero state** — show placeholder if user has no completed orders
6. **MUST use existing chart library** — Recharts (already in package.json)
7. **MUST make responsive** — Dashboard viewed on mobile 60%+ of time
8. **MUST animate chart** — Use `animationDuration` for smooth load

### Library & Framework Requirements

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `recharts` | ^2.14.1 | Chart rendering | Already installed, used in admin analytics |
| `lucide-react` | 0.562.0 | Icons | Already installed |
| `@supabase/supabase-js` | 2.90.1 | Database queries | Already installed |
| `next` | 16.1.1 | Framework | RSC + Server Actions |

### File Structure Requirements

```
supabase/functions/
  └── generate-co2-card/
      └── index.ts           # Edge Function for social card

src/
  ├── actions/
  │   ├── getCO2Impact.ts           # Aggregate CO2 stats
  │   ├── getCO2TimeSeries.ts       # Time-series data
  │   ├── getUserComparison.ts      # Percentile calculation
  │   ├── generateCO2Card.ts        # Trigger card generation
  │   └── __tests__/
  │       ├── getCO2Impact.test.ts
  │       ├── getCO2TimeSeries.test.ts
  │       └── getUserComparison.test.ts
  ├── components/crm/
  │   ├── CO2ImpactDashboard.tsx    # Main container
  │   ├── CO2Chart.tsx              # Recharts area chart
  │   ├── CO2ComparisonBadge.tsx    # Percentile badge
  │   ├── ShareCO2Button.tsx        # Share action button
  │   └── __tests__/
  │       ├── CO2Chart.test.tsx
  │       └── CO2ComparisonBadge.test.tsx
  └── app/crm/my-garden/
      └── page.tsx                  # MODIFY: Add CO2 section

e2e/
  └── co2-dashboard.spec.ts
```

### Testing Requirements

- Unit tests: `jest` + `@testing-library/react` (already configured)
- E2E tests: `playwright` (already configured)
- Coverage target: 80%+ for Server Actions
- Mock Supabase queries in unit tests
- Test chart rendering with mock data
- Test responsive behavior (mobile viewport)

### Brand Colors & Styling

From UX spec and codebase:
```css
/* Primary Brand */
--brand-500: #2d6a4f  /* Forest Green */
--brand-600: #1e4d2b  /* Dark Green */
--brand-50: #f0f8f4   /* Light Green Background */

/* Accent */
--accent-gold: #FFD700  /* Gold for highlights */

/* Gradients */
.co2-gradient {
  background: linear-gradient(135deg, #2d6a4f, #1e4d2b);
}
```

### Emotional Messaging

Key principle: Make users feel **proud** and **motivated** to buy more trees.

**Examples:**
- ✅ "Bạn đang giúp Trái Đất thở dễ hơn mỗi ngày!"
- ✅ "🌟 Xuất sắc! Bạn đang làm tốt hơn 67% người dùng!"
- ✅ "Tác động của bạn cao hơn trung bình 25%!"
- ❌ "Your CO2 offset: 240kg" (too technical, not emotional)

### Mobile Considerations

Dashboard is primarily mobile (60%+ traffic):
- Chart: Use `<ResponsiveContainer>` to auto-scale
- Stats grid: `md:grid-cols-2 lg:grid-cols-4` → vertical stack on mobile
- Share button: Use Web Share API for native share sheet
- Font sizes: Use responsive units (`text-lg` → `text-2xl lg:text-3xl`)

### Performance

- Server Actions: Run on Vercel Edge (~50ms response)
- Chart animation: 1s duration (smooth but not slow)
- Share card generation: ~2s (Edge Function)
- Cache consideration: CO2 data changes rarely → consider `revalidate` tag

### Project Context Reference

See `docs/project-context.md` for:
- Code review standards (prefer minimal diffs)
- Testing approach (TDD workflow)
- Git workflow (feature branches, PR process)
- Deployment process (Vercel + Supabase)

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
