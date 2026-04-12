# Loggy - Todo List

## 🎯 **High Priority**

### 1. 🔄 Manage Recurring Transactions UI
**Status**: ✅ Complete
**Description**: Added dedicated interface for users to view and manage recurring transaction templates

**Implemented**:
- Combined History + Recurring into unified Transactions page with tabs
- RecurringContent shows all templates with edit/delete/pause actions
- Filter by All/Expenses/Income
- Shows frequency, amount, next generation date
- Edit template directly
- Delete template (removes template and future instances)
- Pause/resume functionality

---

### 2. 🔥 Eliminate Scrolling in Add Expense Form
**Status**: Pending (deferred for review)
**Description**: Redesign Add Expense form to eliminate all scrolling through creative UX solutions

**Problem**:
- Expense type icon grid takes 180-360px of vertical space
- Desktop scrolling when: large type grids + recurring + split options exceed 80vh
- Current implementation requires scrolling for complex expense entry

**Proposed Solutions** (5 options to choose from):

1. **⭐ Smart Favorites + "More" Button** (RECOMMENDED)
   - Show 6-8 most recent/frequent expense types as quick buttons
   - "See all..." button for full grid in modal
   - 90% of expenses = no scroll, 2 taps

2. **Horizontal Swipe Carousel**
   - Expense types scroll horizontally (like Netflix)
   - No vertical scroll needed

3. **Multi-Step Wizard**
   - Step 1: Category + favorites + Amount + Date
   - Step 2: Optional fields (description, split, recurring)

4. **Progressive Disclosure**
   - Start minimal, "+ More options" expands
   - Hide optional fields until needed

5. **Split Layout (Desktop)**
   - Two columns: Type selection | Form fields
   - Both fit in viewport

**Detailed Plan**: See `C:\Users\mike_\.claude\plans\gentle-scribbling-eclipse.md`

**Next Steps**:
- Review all 5 options
- Pick preferred approach
- Get user feedback on implementation details
- Build & test selected solution

---

### 3. Category Loading Race Condition
**Description**: Fix brief "no categories found" flash for new users
**Solutions**:
- Retry logic with 1.5s delay
- Loading state instead of "no categories" message
- Optimistic UI with default categories

---

### 4. Complete Export Functionality
**Status**: Partially Complete (CSV export in Analytics DataGrid)
**Description**: Expand data export capabilities
**Remaining Work**:
- Activate export functionality in Transactions page
- Date range selection for exports
- Category filtering for exports
- Multiple format support (Excel, PDF)

---

## 📱 Mobile UX Improvements (Medium Priority)

### 5. Collapsible Filters on Mobile (Transactions Page)
**Status**: Pending
**Description**: Make filters collapsible on mobile to save vertical space
- Add "Filters" toggle button (mobile only)
- Collapse Year, Filter, Sort By, Order sections by default
- Show badge when non-default filters are active
- Keep filters always visible on desktop

---

### 6. Quick Actions & Navigation
- Floating Action Button (FAB) for quick "Add Expense"
- Expandable FAB to show "Add Income" option
- Pull-to-refresh functionality on Dashboard and Transactions

---

### 7. Analytics Mobile Optimization
- Better touch handling for Chart.js interactions
- Simplified mobile chart views with larger touch areas
- Enhanced horizontal scroll indicators for data tables

---

### 8. Dashboard Visual Polish
- Enhanced visual hierarchy with better mobile spacing
- Larger text for key financial numbers
- Touch-friendly quick action areas

---

## 📊 **Feature Expansion (Medium Priority)**

### 9. Monthly Analytics Improvements
**Status**: Pending
**Description**: Enhance monthly analytics view with more actionable insights
**Proposed additions**:
- vs Last Month comparisons on Income, Expenses, and Surplus cards
- Savings rate % and daily average spending stats
- Top 5 spenders list with amount, % of total, and trend vs last month
- Income vs expense progress bar (e.g. "You've spent 68% of your income")

---

### 10. Budget Tracking System
**Description**: Monthly budget limits and warnings
- Set monthly budget limits per category
- Visual progress indicators
- Warning system (80% yellow, 100% red)
- Budget vs actual spending reports

---

### 11. Income Tracking Improvements
**Description**: Enhanced income management system
- Income categories (Salary, Freelance, Investments, etc.)
- Better recurring income support
- Enhanced income vs expenses analytics

---

### 12. Dark Mode Implementation
**Status**: Settings Page Ready (placeholder toggle)
**Remaining Work**:
- Dark theme CSS variables
- Component theme switching
- User preference persistence

---

## 🔧 **Lower Priority**

### 13. Search & Advanced Filtering
**Description**: Enhanced search capabilities
- Text search across transactions
- Date range pickers
- Multiple filter combinations

---

### 14. PWA Features
**Description**: Progressive Web App capabilities
- Offline support with local storage
- Install as mobile app
- Push notifications for budget alerts

---

### 15. Performance & Quality
**Description**: Code quality and performance improvements
- Error boundary implementation
- Unit testing setup (Jest/Vitest)
- Accessibility improvements

---

### 16. Database Cleanup - Expense Type Naming
**Description**: Update "Rent/Mortgage" → "Rent / Mortgage" for consistency
**Changes Needed**:
- Update database trigger `create_default_expense_types()`
- Apply migration to existing users
- Update Splitwise mapping in `src/lib/splitwise.ts` (lines 202-203)

---

**Last Updated**: April 12, 2026
**Project Status**: Production-ready, deployed on Vercel