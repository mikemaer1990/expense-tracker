# Loggy - Todo List

## 🎯 **High Priority**

### 1. 🔄 Manage Recurring Transactions UI
**Status**: Pending
**Description**: Add a dedicated interface for users to view and manage their recurring transaction templates

**Problem**:
- Users can only interact with recurring templates through generated instances
- No way to view all active recurring transactions in one place
- No way to pause/resume, edit, or delete a template directly
- Orphaned templates can exist if all instances are deleted individually

**Proposed Solutions**:
1. **Dedicated "Recurring Transactions" page** - New route showing all templates with edit/delete/pause actions
2. **Section in Settings** - List of active recurring templates with management options
3. **Filter in History** - "Show recurring templates" toggle to view and manage them

**Requirements**:
- List all recurring templates (expenses and income)
- Show frequency, amount, next generation date
- Edit template directly (updates all future instances)
- Delete template (removes template and all future instances)
- Optional: Pause/resume functionality

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

### 3. Complete Export Functionality
**Status**: Partially Complete (CSV export in Analytics DataGrid)
**Description**: Expand data export capabilities
**Remaining Work**:
- Activate export functionality in History component
- Date range selection for exports
- Category filtering for exports
- Multiple format support (Excel, PDF)

---

### 4. Recurring Transactions UI
**Status**: Infrastructure Complete (database fields exist)
**Description**: Activate recurring transaction UI features
**Remaining Work**:
- Auto-generation system interface
- Recurring transaction management UI
- Integration with budget tracking

---

## 📱 Mobile UX Improvements (Medium Priority)

### 5. Quick Actions & Navigation
- Floating Action Button (FAB) for quick "Add Expense"
- Expandable FAB to show "Add Income" option
- Pull-to-refresh functionality on Dashboard and History

---

### 6. Analytics Mobile Optimization
- Better touch handling for Chart.js interactions
- Simplified mobile chart views with larger touch areas
- Enhanced horizontal scroll indicators for data tables

---

### 7. Dashboard Visual Polish
- Enhanced visual hierarchy with better mobile spacing
- Larger text for key financial numbers
- Touch-friendly quick action areas

---

## 📊 **Feature Expansion (Medium Priority)**

### 8. Budget Tracking System
**Description**: Monthly budget limits and warnings
- Set monthly budget limits per category
- Visual progress indicators
- Warning system (80% yellow, 100% red)
- Budget vs actual spending reports

---

### 9. Income Tracking Improvements
**Description**: Enhanced income management system
- Income categories (Salary, Freelance, Investments, etc.)
- Better recurring income support
- Enhanced income vs expenses analytics

---

### 10. Dark Mode Implementation
**Status**: Settings Page Ready (placeholder toggle)
**Remaining Work**:
- Dark theme CSS variables
- Component theme switching
- User preference persistence

---

## 🔧 **Lower Priority**

### 11. Search & Advanced Filtering
**Description**: Enhanced search capabilities
- Text search across transactions
- Date range pickers
- Multiple filter combinations

---

### 12. PWA Features
**Description**: Progressive Web App capabilities
- Offline support with local storage
- Install as mobile app
- Push notifications for budget alerts

---

### 13. Performance & Quality
**Description**: Code quality and performance improvements
- Error boundary implementation
- Unit testing setup (Jest/Vitest)
- Accessibility improvements

---

### 14. Database Cleanup - Expense Type Naming
**Description**: Update "Rent/Mortgage" → "Rent / Mortgage" for consistency
**Changes Needed**:
- Update database trigger `create_default_expense_types()`
- Apply migration to existing users
- Update Splitwise mapping in `src/lib/splitwise.ts` (lines 202-203)

---

**Last Updated**: January 11, 2026
**Project Status**: Production-ready, deployed on Vercel