# Insights Tab v2 — Complete Revamp Plan

## Context

The current insights tab is a flat feed of homogeneous cards with a basic gauge. Every insight gets the same visual treatment regardless of importance. There's no hierarchy, no rich data visualization, and no progressive disclosure. We're replacing it with a **7-section financial intelligence dashboard** that feels like Spotify Wrapped meets Bloomberg meets Apple Health — built with the craft of Airbnb and the systems rigor of Google infrastructure.

**Working backward**: Design the UI first, then build the backend to feed it.

---

## The New Insights Tab (7 Sections)

```
┌─────────────────────────────────┐
│     ● Financial Health Score    │  ← Animated ring, 0-100
│        74 / Amber               │
│  "Starbucks is eating your     │
│   budget — $142 this month"     │
├─────────────────────────────────┤
│ [Total Spent] [Daily Avg] [Top] │ ← Horizontal scroll pills
│  $3,245  ↑12%  $108/day  Food   │
├─────────────────────────────────┤
│     🍩 Category Breakdown       │  ← SVG donut + legend
│   Food 27% | Shopping 22% | ... │
├─────────────────────────────────┤
│  🔴 CRITICAL                    │  ← Priority-sorted alerts
│  ├─ Unusual Uber: $187.50      │
│  🟡 ADVISORY                    │
│  ├─ Burn rate creeping up       │
│  🟢 WINS                        │
│  └─ Grocery spend down 8%       │
├─────────────────────────────────┤
│  📡 Subscription Radar          │  ← Subscription list
│  $142/mo → $1,704/yr           │
│  "That's 42.6 hrs of work"     │
├─────────────────────────────────┤
│  📈 30-Day Spending Trend       │  ← Bar chart + avg line
│  ▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃             │
├─────────────────────────────────┤
│  💬 Ledger's Take               │  ← Rich AI narrative
│  "This month you spent **$3.2K**│
│   across 14 merchants..."       │
└─────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend — New Computations
**Files to modify:** `backend/insights_engine.py`

Add 4 new pure functions (no new dependencies):

1. **`compute_health_score(velocity, anomalies, subscriptions, dna)`** → `{score: 0-100, components: {}, zone}`
   - velocity_score: 100 (green), 60 (yellow), 30 (red)
   - anomaly_score: 100 - (spike_count * 15), clamped 0-100
   - subscription_score: 100 - (sub_count * 5), clamped 0-100
   - diversity_score: (entropy / 3.0) * 100, clamped 0-100
   - Composite: weighted average (velocity 35%, anomaly 25%, subscription 15%, diversity 25%)

2. **`compute_month_summary(transactions)`** → `{total_spent, daily_average, top_category, anomalies_found, days_elapsed, deltas}`
   - Split transactions into current month vs previous month
   - Compute deltas as percentage change

3. **`compute_category_breakdown(transactions)`** → `[{category, amount, percentage, color}]`
   - Group current-month spending by `category_primary`
   - Assign colors from deterministic palette:
     ```python
     CATEGORY_COLORS = {
         "Food and Drink": "#FF6B6B", "Shopping": "#4ECDC4",
         "Transportation": "#45B7D1", "Entertainment": "#96CEB4",
         "Groceries": "#FFEAA7", "Recreation": "#98D8C8",
         "Income": "#16A34A", "Travel": "#F97316",
         "Utilities": "#DDA0DD", "Uncategorized": "#9CA3AF",
     }
     ```
   - Sort by amount descending

4. **`compute_daily_trend(transactions, days=30)`** → `{period, data: [{date, amount}], average_line}`
   - Aggregate daily spend totals for last N days
   - Compute running average

### Phase 2: Backend — Enhanced LLM Narrator
**Files to modify:** `backend/llm_narrator.py`

Add alongside existing code (don't break `/insights` v1):

- New Pydantic schema `NarratedInsightsV2`:
  - `headline: str` — single most urgent one-liner
  - `alerts: List[PriorityAlert]` — each with `priority` (critical/advisory/win), icon, title, body
  - `narrative: str` — rich paragraph with `**bold**` markdown for numbers/merchants

- New function `narrate_insights_v2(raw_analysis)` with updated system prompt instructing Gemini to produce priority-sorted alerts + narrative

### Phase 3: Backend — New Endpoint
**Files to modify:** `backend/main.py`

Add `GET /insights/v2` that:
1. Loads all transactions
2. Runs all 5 existing + 4 new computation functions
3. Calls `narrate_insights_v2` for AI content
4. Composes single response JSON with all 7 sections' data:

```json
{
  "health_score": { "score": 74, "zone": "amber", "headline": "...", "components": {} },
  "month_summary": { "total_spent": 3245, "daily_average": 108, "top_category": {}, "anomalies_found": 3, "deltas": {} },
  "category_breakdown": [{ "category": "Food", "amount": 892, "percentage": 27.5, "color": "#FF6B6B" }],
  "alerts": [{ "id": "1", "priority": "critical", "icon": "alert-circle", "title": "...", "body": "..." }],
  "subscriptions": { "monthly_total": 142, "annual_total": 1704, "items": [], "hidden_cost_callout": {} },
  "daily_trend": { "period": "30d", "data": [{ "date": "2026-01-15", "amount": 87 }], "average_line": 108 },
  "narrative": { "text": "This month you spent **$3,245**...", "generated_at": "..." },
  "spending_velocity": { "current_pace": 108, "average_pace": 95, "zone": "yellow" }
}
```

### Phase 4: Frontend — New Components
**New directory:** `my-fintech-app/components/insights/`

| Component | File | Props | SVG? | Lines |
|-----------|------|-------|------|-------|
| `HealthScoreRing` | `HealthScoreRing.tsx` | score, zone, headline | Yes (Circle arc) | ~80 |
| `MetricPill` + `MetricRow` | `MetricRow.tsx` | metrics[] | No | ~70 |
| `DonutChart` | `DonutChart.tsx` | data[], totalSpent | Yes (Path arcs) | ~120 |
| `AlertCard` | `AlertCard.tsx` | alert, onAskLedger | No | ~90 |
| `SubscriptionRadar` | `SubscriptionRadar.tsx` | items, totals, callout | No | ~80 |
| `TrendChart` | `TrendChart.tsx` | data[], averageLine | Yes (Rect bars) | ~100 |
| `NarrativeBlock` | `NarrativeBlock.tsx` | text, generatedAt | No | ~50 |
| `SectionHeader` | `SectionHeader.tsx` | title, subtitle? | No | ~20 |

**Key technical decisions:**
- All SVG via `react-native-svg` (already installed, no new deps)
- Animation: `useEffect` + `requestAnimationFrame` for health ring (web-safe, no reanimated dependency)
- Reuse existing `Card`, `Text`, `Button` components from `components/ui/`
- Donut chart: polar-to-cartesian arc helper function, categories <3% grouped into "Other"
- Alert grouping done in frontend via `reduce` (backend returns flat sorted list)

### Phase 5: Frontend — Rewrite insights.tsx
**File to modify:** `my-fintech-app/app/(tabs)/insights.tsx`

Complete rewrite. ScrollView with 7 sections composed from Phase 4 components:
1. `HealthScoreRing` → `data.health_score`
2. `MetricRow` → 5 pills from `data.month_summary`
3. `DonutChart` → `data.category_breakdown`
4. Alert section → group `data.alerts` by priority, render `AlertCard` per item
5. `SubscriptionRadar` → `data.subscriptions`
6. `TrendChart` → `data.daily_trend`
7. `NarrativeBlock` → `data.narrative`

**Data fetching:** Single `fetch('/insights/v2')` on mount + pull-to-refresh. Loading state shows skeleton-style ActivityIndicator.

---

## Execution Order

```
Phase 1 (backend computations) ──┐
                                  ├── Phase 3 (endpoint) ── Phase 5 (page rewrite)
Phase 2 (LLM narrator v2) ───────┘         ↑
                                            │
Phase 4 (frontend components) ──────────────┘
```

Phases 1+2 are parallel. Phase 4 can start in parallel with mock data.
Phase 3 depends on 1+2. Phase 5 depends on 3+4.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `backend/insights_engine.py` | Add 4 functions + CATEGORY_COLORS dict |
| `backend/llm_narrator.py` | Add NarratedInsightsV2 schema + narrate_v2 function |
| `backend/main.py` | Add GET /insights/v2 endpoint |
| `my-fintech-app/components/insights/HealthScoreRing.tsx` | **New** |
| `my-fintech-app/components/insights/MetricRow.tsx` | **New** |
| `my-fintech-app/components/insights/DonutChart.tsx` | **New** |
| `my-fintech-app/components/insights/AlertCard.tsx` | **New** |
| `my-fintech-app/components/insights/SubscriptionRadar.tsx` | **New** |
| `my-fintech-app/components/insights/TrendChart.tsx` | **New** |
| `my-fintech-app/components/insights/NarrativeBlock.tsx` | **New** |
| `my-fintech-app/components/insights/SectionHeader.tsx` | **New** |
| `my-fintech-app/app/(tabs)/insights.tsx` | **Rewrite** |

---

## Component Deep Dive

### HealthScoreRing
```typescript
interface HealthScoreRingProps {
  score: number;           // 0-100
  zone: 'green' | 'amber' | 'red';
  headline: string;        // AI one-liner
}
```
- Full-circle SVG arc using `react-native-svg` Circle with `strokeDasharray`/`strokeDashoffset`
- Score number centered inside (tokens.typography.scale.xxxl = 40px)
- Background track in neutrals[200], value arc colored by zone
- Animation: requestAnimationFrame interpolation from 0 → target over 1.2s (ease-out)
- Size: 180x180 SVG, stroke width 14

### DonutChart
```typescript
interface CategorySlice {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
interface DonutChartProps {
  data: CategorySlice[];
  totalSpent: number;
}
```
- Multiple SVG Path arcs (one per category) computed from cumulative angles
- Center hole shows total spent
- Below: legend rows (colored dot + name + amount + %)
- Helper: `describeArc(cx, cy, r, startAngle, endAngle)` using polar-to-cartesian
- Categories <3% grouped into "Other"

### AlertCard
```typescript
interface Alert {
  id: string;
  priority: 'critical' | 'advisory' | 'win';
  icon: string;
  title: string;
  body: string;
  action_label?: string;
  action_payload?: { query: string };
}
interface AlertCardProps {
  alert: Alert;
  onAskLedger?: (query: string) => void;
}
```
- 4px colored left border (red/amber/green by priority)
- Icon + title + body layout
- "Ask Ledger" pill CTA
- Group headers rendered above each priority group in the parent

### TrendChart
```typescript
interface TrendChartProps {
  data: { date: string; amount: number }[];
  averageLine: number;
  period: string;
}
```
- SVG vertical bars (Rect elements), one per day
- Dashed horizontal Line for average
- Bars above avg: warning color, below: brand primary
- Width fills container, height 160px

### SubscriptionRadar
```typescript
interface SubscriptionRadarProps {
  monthlyTotal: number;
  annualTotal: number;
  items: { merchant: string; amount: number; frequency: string; annual_cost: number }[];
  hiddenCostCallout: { hours_of_work: number; hourly_rate: number; message: string };
}
```
- Bold monthly total header
- Each row: merchant name + amount + frequency badge pill
- Callout card with muted background showing "hours of work" message

---

## Backend Computation Details

### Health Score Formula
```
velocity_score = {green: 100, yellow: 60, red: 30}[zone]
anomaly_score  = clamp(100 - spike_count * 15, 0, 100)
sub_score      = clamp(100 - sub_count * 5, 0, 100)
diversity_score = clamp((entropy / 3.0) * 100, 0, 100)

composite = (velocity * 0.35) + (anomaly * 0.25) + (sub * 0.15) + (diversity * 0.25)
zone = "green" if score >= 80, "amber" if >= 50, "red" otherwise
```

### Month Summary
- Current month: all transactions where `date >= first_of_month`
- Previous month: all transactions in the month before
- Delta: `((current - previous) / previous) * 100`

### Category Breakdown
- Filter: current month, amount > 0 (spending only)
- Group by `category_primary`, sum amounts
- Percentage: `(category_total / grand_total) * 100`
- Sort descending by amount

### Daily Trend
- Last N days: group transactions by date, sum amounts per day
- Fill gaps with 0 for days with no transactions
- Average: `sum(daily_amounts) / len(daily_amounts)`

---

## Verification

1. **Backend:** Start server (`cd backend && uvicorn backend.main:app --port 8001`), hit `GET /insights/v2`, verify all 7 sections have data
2. **Frontend:** Start Expo (`cd my-fintech-app && npx expo start --web`), navigate to Insights tab
3. **Visual check:** Health ring animates, donut chart renders categories, alerts are priority-grouped, trend chart shows bars
4. **Pull-to-refresh:** Data reloads on pull down
5. **Empty state:** With no transactions, shows connect-bank prompt
