# Analytics Redesign — 10x More Useful & Visually Stunning

## Context
The current analytics page has solid data and working charts but falls short on three fronts: the KPI cards are plain text with no visual hierarchy, charts are minimal (flat colors, no gradient fills, Pie instead of Doughnut), and there are zero computed insights — users must mentally interpret raw numbers themselves. Rich data exists in the DB (`is_recurring`, expense hierarchy, monthly breakdowns) but is underutilized. This plan upgrades the analytics page to feel like a modern financial dashboard (Monarch Money / Copilot quality) using only the existing tech stack.

**No new npm packages.** All changes use Chart.js 4, Tailwind CSS 4, Heroicons 2, and date-fns already installed.

**Branch:** `analytics-redesign`

---

## Files Modified

| File | Change Type |
|------|------------|
| `src/components/Analytics/Analytics.tsx` | Extend — new state, prior-period queries, `is_recurring` fetch, computed metrics, layout update |
| `src/components/Analytics/PieChart.tsx` | Rewrite — Pie → Doughnut with center total text |
| `src/components/Analytics/BarChart.tsx` | Extend — gradient fills, income overlay enabled, taller chart |
| `src/components/Analytics/LineChart.tsx` | Extend — gradient area fill, remove x-axis gridlines |
| `src/components/Analytics/CategoryBreakdown.tsx` | Extend — progress bars, transaction count badge |

## New Files Created

| File | Responsibility |
|------|---------------|
| `src/components/Analytics/KPICard.tsx` | Hero metric card with gradient strip, delta badge, inline SVG sparkline |
| `src/components/Analytics/InsightsBanner.tsx` | Auto-generated text insights (2-3 bullet points), dismissible |
| `src/components/Analytics/TopSpenders.tsx` | Ranked top-5 expense types with progress bars |
| `src/components/Analytics/FixedVsVariable.tsx` | Stacked bar + stat blocks showing recurring vs variable split |
| `src/components/Analytics/SavingsRateBar.tsx` | Single-line savings rate progress bar |

---

## Implementation Phases (ordered by visual impact)

### Phase 1 — KPI Hero Cards (`KPICard.tsx`)
Replace the 3 plain white summary cards with rich gradient hero cards.

**New component props:**
```ts
interface KPICardProps {
  label: string
  value: number
  currency: string
  priorValue: number           // same metric for previous period
  sentiment: 'income' | 'expense' | 'surplus' | 'deficit'
  sparklineData?: number[]     // last 6 monthly totals for mini chart
}
```

**Visual spec per card:**
- `h-1` gradient accent strip at top: income=`from-green-400 to-emerald-500`, expense=`from-orange-400 to-red-500`, surplus=`from-blue-400 to-indigo-500`, deficit=`from-red-400 to-rose-500`
- `text-3xl font-bold tabular-nums` for the main figure
- Delta badge: `bg-green-100 text-green-700` or `bg-red-100 text-red-700` pill showing `±X.X%` vs prior period (note: for expenses, positive delta = red/bad)
- Inline SVG sparkline (6 bars, `viewBox="0 0 100 30"`) — no Chart.js, pure SVG rects scaled to max value

**Data changes in `Analytics.tsx`:**
Add prior-period queries inside `loadAnalyticsData` — one for prior expenses (flat `expenses` table with prior date range), one for prior income. Prior period = previous month (monthly mode) or previous year (yearly mode).

```ts
// New state:
const [priorIncome, setPriorIncome] = useState(0)
const [priorExpenses, setPriorExpenses] = useState(0)
```

Sparkline data derived from the already-computed `categories` monthly breakdown — no new query needed.

---

### Phase 2 — Donut Chart (`PieChart.tsx` rewrite)
- Import `Doughnut` instead of `Pie`
- Set `cutout: '68%'` in options
- Add inline Chart.js plugin for center text (total amount + "total" label)
- Fix hardcoded `$` currency bug in tooltip callback → use `formatCurrency()`
- Add `hoverOffset: 8` for expand-on-hover effect
- Accept `currency: string` prop (currently missing)

---

### Phase 3 — Top Spenders Widget (`TopSpenders.tsx`)
Ranked list of top 5 expense types — the most immediately useful new insight.

**Data (computed in `Analytics.tsx`, no new query):**
```ts
const topSpenders = categories
  .flatMap(cat => cat.expenseTypes.map(et => ({ ...et, categoryName: cat.name, categoryColor: cat.color })))
  .filter(et => et.totalAmount > 0)
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, 5)
```

**Visual:** Card with purple gradient accent strip, rank number badge, category color dot, expense type name, amount right-aligned, progress bar (width = amount / top1Amount * 100%), `% of total · N transactions` sublabel.

---

### Phase 4 — Insights Banner (`InsightsBanner.tsx`)
Auto-generated text insights, dismissible. Shows 2-3 of these in priority order:
1. Period-over-period change: "You spent 23% more than last month"
2. Top category dominance (if >40%): "Housing accounts for 52% of spending"
3. Recurring cost share: "$1,800 (45%) of spending is fixed/recurring"
4. Savings rate: "Your savings rate is 18% this period"

**Requires** `recurringTotal` which needs `is_recurring` added to the expenses sub-select in the categories query.

**Visual:** `bg-gradient-to-r from-blue-50 to-indigo-50` banner with `LightBulbIcon`, bullet list, dismiss `XMarkIcon` button.

---

### Phase 5 — Fixed vs Variable (`FixedVsVariable.tsx`)
**Requires** extending `ExpenseTypeData` interface with `recurringAmount: number` and adding `is_recurring` to the Supabase expenses sub-select.

**Visual:** Horizontal stacked bar (blue=fixed, orange=variable) + two colored stat blocks showing amounts and percentages side by side.

---

### Phase 6 — Chart Visual Polish

**BarChart.tsx:**
- Gradient bar fill via `backgroundColor` function using `ctx.createLinearGradient`
- Enable income overlay — pass `showIncome={true}` and `monthlyIncomeData` from `Analytics.tsx` (computed from existing income query grouped by month)
- Increase height `h-64` → `h-80`

**LineChart.tsx:**
- Gradient area fill: `rgba(59,130,246,0.3)` at top → `rgba(59,130,246,0.01)` at bottom
- Remove x-axis grid lines for cleaner look

**Bug fix (line 485 `Analytics.tsx`):**
```ts
// BEFORE (broken — always uses 2024 month names):
const monthKey = new Date(2024, i).toLocaleString('default', { month: 'short' })
// AFTER:
const monthKey = new Date(selectedYear, i).toLocaleString('default', { month: 'short' })
```

---

### Phase 7 — Savings Rate Bar (`SavingsRateBar.tsx`)
Single full-width card, only renders when income > 0. Shows rate as filled progress bar with color-coded text: green ≥20%, yellow 0-20%, red <0%.

---

### Phase 8 — CategoryBreakdown Polish
- Add `h-1` color progress bar below each category header (width = percentage, color = category.color)
- Add transaction count badge (`"12 transactions"` gray pill) on category header
- Fix mobile monthly grid: `grid-cols-4` instead of `grid-cols-6`

---

## Final Page Layout

```
[Navigation]
[Page Header]
[TimeControls — unchanged]

[KPI Hero: 3 KPICards in sm:grid-cols-3]

[InsightsBanner — full width, dismissible]

── Charts View ──────────────────────────────────
[xl:grid-cols-2: DonutChart | BarChart (with income overlay)]
[SavingsRateBar — full width, if income > 0]
[md:grid-cols-5/7: TopSpenders | FixedVsVariable]
[LineChart — full width, yearly only]
[CategoryBreakdown — upgraded]

── Data View ────────────────────────────────────
[DataGrid — unchanged]
```

---

## TypeScript Changes

**Extend `ExpenseTypeData`:**
```ts
interface ExpenseTypeData {
  // ... existing fields
  recurringAmount: number  // NEW — sum of is_recurring expenses only
}
```

**New computed state in `Analytics.tsx`:**
```ts
const [priorIncome, setPriorIncome] = useState(0)
const [priorExpenses, setPriorExpenses] = useState(0)
// Derived (no state needed):
const surplus = totalIncome - totalExpenses
const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
const recurringTotal = /* sum recurringAmount across all expenseTypes */
const topSpenders = /* flatMap + sort + slice(0,5) */
const monthlyExpenseSparkline = /* last 6 months of expense totals */
```

---

## What NOT to Change
- `DataGrid.tsx` — works well, CSV export is a real feature
- `TimeControls` inline UI — pill toggles are clean and functional
- The Supabase category join query structure — only extend the expenses sub-select
- `BarChart` insight summary row (avg/highest/lowest) — keep it, it's useful
- Auth, routing, navigation — out of scope

---

## Verification
1. `npm run dev` — check all 3 KPI cards render with correct deltas vs prior period
2. Toggle monthly ↔ yearly — confirm prior period switches correctly (prev month vs prev year)
3. Dismiss insights banner — confirm it disappears and doesn't reappear on re-render (session state)
4. Year selector — confirm LineChart month keys now reflect the selected year (bug fix verification)
5. `npm run build` — zero TypeScript errors before shipping
