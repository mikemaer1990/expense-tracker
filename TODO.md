# Loggy - Todo List

## 🎯 **Current Priority Features**

### 1. 🔥 **Eliminate Scrolling in Add Expense Form** - TOP PRIORITY
**Status**: ⏳ **PENDING** (Deferred for review)
**Priority**: 🔴 **HIGHEST**
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

### 2. ✅ **Historical Data Import** - COMPLETED
**Status**: ✅ **COMPLETED** (December 27, 2025)
**Approach**: One-time import script (not a permanent UI feature)
**Description**: Imported historical 2025 budget spreadsheet data into Loggy

**Results**:
- ✅ Imported 28 income records across 4 sources (Wages, Bonus/Gift, Other, Roommates)
- ✅ Imported 182 expense records across 21 expense types
- ✅ Created 12 custom expense types (Car Payment, Wifi/Phone, Bike, Coffee, Clothes, Health, George, etc.)
- ✅ All transactions dated as 1st of each month (Jan-Dec 2025)
- ✅ Data successfully mapped to Fixed, Variable, and Optional categories

**Note**: Used disposable Node.js script instead of building full UI feature since this was a one-time historical import need.

---

### 2. Mobile UX Improvements - Additional Components
**Priority**: MEDIUM-HIGH
**Description**: Enhanced mobile user experience for remaining components
**Implementation Strategy**: Address after top 2 priorities completed

#### 📱 **Chunk 2: Transaction Card Interactions** - ✅ COMPLETED (January 2, 2026)
**Target**: History page transaction cards
**Completed Improvements**:
- ✅ Larger action buttons (min 44px touch targets)
- ✅ Clear touch feedback and animations (active states, button press effects)
- ❌ Swipe gestures (removed - not needed)
- ❌ Long-press context menus (removed - not needed)
- ✅ Visual hierarchy already strong (no changes needed)

#### 📱 **Chunk 3: Quick Actions & Navigation** - MEDIUM PRIORITY
**Target**: Global navigation and quick access
**Current State**: Mobile menu works well, good foundation exists
**Improvements**:
- Floating Action Button (FAB) for quick "Add Expense"
- Expandable FAB to show "Add Income" option
- Pull-to-refresh functionality on Dashboard and History
- Visual feedback during refresh operations
- Enhanced navigation breadcrumbs

#### 📱 **Chunk 4: Analytics Mobile Optimization** - MEDIUM-LOW PRIORITY
**Target**: Analytics page charts and data tables
**Issues Found**: Charts hard to interact with on mobile, horizontal scroll UX
**Improvements**:
- Better touch handling for Chart.js interactions
- Simplified mobile chart views with larger touch areas
- Enhanced horizontal scroll indicators for data tables
- Mobile-optimized chart legends and tooltips
- Gesture-friendly chart navigation

#### 📱 **Chunk 5: Dashboard Visual Polish** - LOW PRIORITY
**Target**: Dashboard cards and layout
**Current State**: Already responsive, good information hierarchy
**Improvements**:
- Enhanced visual hierarchy with better mobile spacing
- Larger text for key financial numbers
- Touch-friendly quick action areas
- Improved card layouts for better mobile flow
- Subtle animations for better mobile experience

**Next Action**: Implement Chunk 1 (Form & Input Improvements) for maximum user impact

### 2. Category Loading Race Condition
**Priority**: HIGH
**Description**: Fix brief "no categories found" flash for new users
**Solutions**:
- Retry logic with 1.5s delay
- Loading state instead of "no categories" message
- Optimistic UI with default categories

### 4. Complete Export Functionality
**Priority**: MEDIUM-HIGH
**Status**: Partially Complete
**Description**: Expand data export capabilities
**Current State**: CSV export in Analytics DataGrid + Settings placeholder
**Remaining Work**:
- Activate export functionality in History component
- Date range selection for exports
- Category filtering for exports
- Multiple format support (Excel, PDF)

### 5. Recurring Transactions UI Activation
**Priority**: MEDIUM-HIGH
**Status**: Infrastructure Complete
**Description**: Activate recurring transaction UI features
**Current State**: Database fields exist, basic recurring flag implemented
**Remaining Work**:
- Auto-generation system interface
- Recurring transaction management UI
- Integration with budget tracking

### 3. ✅ **Splitwise Integration** - COMPLETED
**Status**: ✅ **COMPLETED** (January 1, 2026)
**Priority**: MEDIUM
**Description**: Connect with Splitwise API for expense sharing
**Implementation**:
- ✅ Splitwise API connection via Settings page
- ✅ API key storage and validation
- ✅ Expense sync from Splitwise to Loggy
- ✅ Duplicate prevention tracking
- ✅ Database schema with splitwise_connections and splitwise_synced_expenses tables
- ✅ Edge Function proxy for secure API calls
- ✅ Optional feature - works seamlessly for users without Splitwise

**Note**: Built-in expense splitting (is_split feature) works independently of Splitwise integration

## 📊 **Feature Expansion**

### 6. Budget Tracking System
**Priority**: MEDIUM
**Description**: Monthly budget limits and warnings
**Features**:
- Set monthly budget limits per category
- Visual progress indicators
- Warning system (80% yellow, 100% red)
- Budget vs actual spending reports

### 7. Income Tracking Improvements
**Priority**: MEDIUM
**Description**: Enhanced income management system
**Features**:
- Income categories (Salary, Freelance, Investments, etc.)
- Better recurring income support
- Enhanced income vs expenses analytics

### 8. Dark Mode Implementation
**Priority**: MEDIUM
**Status**: Settings Page Ready
**Description**: Complete dark theme implementation
**Current State**: Settings page has dark mode toggle (placeholder)
**Remaining Work**:
- Dark theme CSS variables
- Component theme switching
- User preference persistence

## 🔧 **Technical Improvements**

### 9. Search & Advanced Filtering
**Priority**: LOW-MEDIUM
**Description**: Enhanced search capabilities
**Features**:
- Text search across transactions
- Date range pickers
- Multiple filter combinations
- Search result highlighting

### 10. PWA Features
**Priority**: LOW
**Description**: Progressive Web App capabilities
**Features**:
- Offline support with local storage
- Install as mobile app
- Background sync
- Push notifications for budget alerts

### 11. Performance & Quality
**Priority**: LOW-MEDIUM
**Description**: Code quality and performance improvements
**Features**:
- Error boundary implementation
- Unit testing setup (Jest/Vitest)
- Performance audit and optimization
- Accessibility improvements
- SEO optimization

## 📋 **Implementation Notes**

---

## 🐛 **Recent Bug Fixes**

### ✅ Timezone Bug in Year Tab Extraction (January 1, 2026)
**Issue**: Year tabs showing 2024/2025 instead of 2025/2026 due to timezone parsing
**Fix**: Changed from `new Date(date).getFullYear()` to direct string parsing `date.split('-')[0]`
**Impact**: Year tabs now correctly show all years with data across all pages (Dashboard, History, Analytics)

---

**Last Updated**: January 1, 2026
**Project Status**: Production-ready, deployed on Vercel
**Focus**: Feature expansion and UX improvements